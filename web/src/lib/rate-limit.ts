/** 簡單記憶體速率限制（單實例）；適合登入與訪客送出防護。 */

type Bucket = {
  count: number;
  windowStart: number;
  fails: number;
  lockedUntil: number;
  touchedAt: number;
};

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 5000;
const BUCKET_TTL_MS = 2 * 60 * 60 * 1000;

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

function looksLikeIp(value: string): boolean {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) return true;
  if (value.includes(":") && /^[0-9a-fA-F:.]+$/.test(value)) return true;
  return false;
}

/**
 * 限速用客戶端識別：不信任客戶端可偽造的「第一個」X-Forwarded-For。
 * 優先平台常見標頭；否則取 XFF 最右側（最接近邊緣代理）；再不行用匿名 cookie。
 */
export function clientIp(request: Request): string {
  const platformHeaders = [
    "cf-connecting-ip",
    "true-client-ip",
    "x-vercel-forwarded-for",
    "x-forwarded-for-client",
  ];
  for (const name of platformHeaders) {
    const raw = request.headers.get(name)?.split(",")[0]?.trim();
    if (raw && looksLikeIp(raw)) return raw.slice(0, 80);
  }

  const real = request.headers.get("x-real-ip")?.trim();
  if (real && looksLikeIp(real)) return real.slice(0, 80);

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const rightmost = parts[parts.length - 1];
    if (rightmost && looksLikeIp(rightmost)) return rightmost.slice(0, 80);
  }

  return "unknown";
}

export const RATE_COOKIE = "bni_rl";

export function readRateCookie(request: Request): string | null {
  const raw = request.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === RATE_COOKIE) {
      const value = decodeURIComponent(rest.join("=") || "").trim();
      if (/^[a-zA-Z0-9_-]{16,64}$/.test(value)) return value;
    }
  }
  return null;
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

/** 限速鍵：匿名 cookie + IP，避免單靠可偽造 IP。 */
export function clientLimitKey(request: Request, scope: string): string {
  const ip = clientIp(request);
  const cookie = readRateCookie(request) || "nocookie";
  return `${scope}:${cookie}:${ip}`;
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

export function isLocked(key: string): boolean {
  return bucket(key).lockedUntil > Date.now();
}

export function lockRemainingMs(key: string): number {
  return Math.max(0, bucket(key).lockedUntil - Date.now());
}

/** 失敗累計；達標後鎖定。成功請呼叫 clearFailures。 */
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
