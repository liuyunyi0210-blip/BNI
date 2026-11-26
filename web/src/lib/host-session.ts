import { createHmac, timingSafeEqual } from "node:crypto";

export const HOST_COOKIE = "bni_host";
const TTL_MS = 12 * 60 * 60 * 1000;

function pinSecret(): string {
  return process.env.HOST_PIN?.trim() || "";
}

export function hostPinConfigured(): boolean {
  return pinSecret().length >= 4;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function mintHostSession(now = Date.now()): string | null {
  const secret = pinSecret();
  if (secret.length < 4) return null;
  const exp = String(now + TTL_MS);
  const payload = `v1.${exp}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyHostSession(token: string | undefined | null): boolean {
  const secret = pinSecret();
  if (!token || secret.length < 4) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [ver, exp, sig] = parts;
  if (ver !== "v1") return false;
  const expMs = Number(exp);
  if (!Number.isFinite(expMs) || expMs < Date.now()) return false;
  const payload = `${ver}.${exp}`;
  const expected = sign(payload, secret);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function readCookie(request: Request, name: string): string | null {
  const raw = request.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("=") || "");
  }
  return null;
}

export function requestHasHostSession(request: Request): boolean {
  return verifyHostSession(readCookie(request, HOST_COOKIE));
}

export function verifyHostPin(pin: string): boolean {
  const secret = pinSecret();
  if (secret.length < 4) return false;
  const a = Buffer.from(String(pin || ""));
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function hostSessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" || Boolean(process.env.CURSOR_APP_ID);
  const parts = [
    `${HOST_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.floor(TTL_MS / 1000)}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearHostSessionCookie(): string {
  const secure = process.env.NODE_ENV === "production" || Boolean(process.env.CURSOR_APP_ID);
  const parts = [`${HOST_COOKIE}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}
