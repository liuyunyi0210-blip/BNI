/** 簡單記憶體速率限制（單實例）；適合登入與訪客送出防護。 */

type Bucket = {
  count: number;
  windowStart: number;
  fails: number;
  lockedUntil: number;
};

const buckets = new Map<string, Bucket>();

function bucket(key: string): Bucket {
  let b = buckets.get(key);
  if (!b) {
    b = { count: 0, windowStart: Date.now(), fails: 0, lockedUntil: 0 };
    buckets.set(key, b);
  }
  return b;
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 80);
  }
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 80);
  return "unknown";
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
