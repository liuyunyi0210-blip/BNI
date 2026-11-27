import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * 記憶體速率限制：不使用任何客戶端 IP／轉發標頭（皆可偽造）。
 * 身分改為伺服器簽章的 HttpOnly cookie；並另設全域桶防止清 cookie 重來。
 */

type Bucket = {
  count: number;
  windowStart: number;
  fails: number;
  lockedUntil: number;
  touchedAt: number;
};

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 4000;
const BUCKET_TTL_MS = 2 * 60 * 60 * 1000;

export const RATE_COOKIE = "bni_rl";

function sweep(now: number) {
  if (buckets.size < MAX_BUCKETS / 2) return;
  for (const [key, b] of buckets) {
    const idle = now - b.touchedAt > BUCKET_TTL_MS;
    const unlocked = b.lockedUntil < now;
    const windowDone = now - b.windowStart > BUCKET_TTL_MS;
    if (idle && unlocked && windowDone) buckets.delete(key);
  }
  if (buckets.size <= MAX_BUCKETS) return;
  const oldest = [...buckets.entries()].sort((a, b) => a[1].touchedAt - b[1].touchedAt);
  for (let i = 0; i < oldest.length && buckets.size > MAX_BUCKETS * 0.8; i += 1) {
    buckets.delete(oldest[i][0]);
  }
}

function bucket(key: string): Bucket {
  const now = Date.now();
  sweep(now);
  let b = buckets.get(key);
  if (!b) {
    b = { count: 0, windowStart: now, fails: 0, lockedUntil: 0, touchedAt: now };
    buckets.set(key, b);
  } else {
    b.touchedAt = now;
  }
  return b;
}

function rateSecret(): string {
  const pin = process.env.HOST_PIN?.trim() || "";
  if (pin.length >= 10) return `bni-rate:${pin}`;
  // 本機／尚未設 PIN：固定開發密鑰（正式環境應已設 HOST_PIN）
  return "bni-rate:local-dev-only";
}

function sign(payload: string): string {
  return createHmac("sha256", rateSecret()).update(payload).digest("base64url");
}

function readCookie(request: Request, name: string): string | null {
  const raw = request.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("=") || "");
  }
  return null;
}

/** 驗證伺服器簽章的限速 cookie；偽造／亂填一律無效。 */
export function verifyRateCookie(token: string | null | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [ver, id, sig] = parts;
  if (ver !== "v1" || !/^[a-zA-Z0-9_-]{16,64}$/.test(id)) return null;
  const expected = sign(`v1.${id}`);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return id;
  } catch {
    return null;
  }
}

export function mintRateCookie(): string {
  const id = randomBytes(18).toString("base64url");
  return `v1.${id}.${sign(`v1.${id}`)}`;
}

export function rateCookieHeader(token: string): string {
  const secure = process.env.NODE_ENV === "production" || Boolean(process.env.CURSOR_APP_ID);
  const parts = [
    `${RATE_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${60 * 60 * 24 * 30}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export type RateIdentity = {
  id: string;
  /** 若剛簽發新 cookie，回傳完整 token 以便 Set-Cookie */
  setCookie?: string;
};

/** 取得（或簽發）伺服器簽章身分；不讀取任何 IP／轉發標頭。 */
export function rateIdentity(request: Request): RateIdentity {
  const existing = verifyRateCookie(readCookie(request, RATE_COOKIE));
  if (existing) return { id: existing };
  const token = mintRateCookie();
  const id = verifyRateCookie(token)!;
  return { id, setCookie: token };
}

export function appendRateCookie(headers: Headers, identity: RateIdentity) {
  if (identity.setCookie) headers.append("set-cookie", rateCookieHeader(identity.setCookie));
}

/** 限速鍵：僅用伺服器簽章身分（可加 scope）。 */
export function clientLimitKey(identityId: string, scope: string): string {
  return `${scope}:${identityId}`;
}

export function globalLimitKey(scope: string): string {
  return `${scope}:__global__`;
}

export function rateLimitExceeded(
  key: string,
  opts: { windowMs: number; max: number },
): boolean {
  const now = Date.now();
  const b = bucket(key);
  if (now - b.windowStart > opts.windowMs) {
    b.windowStart = now;
    b.count = 0;
  }
  if (b.count >= opts.max) return true;
  b.count += 1;
  return false;
}

/** 同時檢查個人桶與全域桶；任一超過即拒絕。 */
export function rateLimitExceededPair(
  identityId: string,
  scope: string,
  opts: { windowMs: number; max: number; globalMax: number },
): boolean {
  const personal = rateLimitExceeded(clientLimitKey(identityId, scope), {
    windowMs: opts.windowMs,
    max: opts.max,
  });
  const global = rateLimitExceeded(globalLimitKey(scope), {
    windowMs: opts.windowMs,
    max: opts.globalMax,
  });
  return personal || global;
}

export function isLocked(key: string): boolean {
  return bucket(key).lockedUntil > Date.now();
}

export function lockRemainingMs(key: string): number {
  return Math.max(0, bucket(key).lockedUntil - Date.now());
}

export function recordAuthFailure(
  key: string,
  opts: { maxFails: number; lockMs: number },
): { locked: boolean; fails: number } {
  const b = bucket(key);
  b.fails += 1;
  if (b.fails >= opts.maxFails) {
    b.lockedUntil = Date.now() + opts.lockMs;
    b.fails = 0;
    return { locked: true, fails: opts.maxFails };
  }
  return { locked: false, fails: b.fails };
}

export function clearFailures(key: string) {
  const b = bucket(key);
  b.fails = 0;
  b.lockedUntil = 0;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
