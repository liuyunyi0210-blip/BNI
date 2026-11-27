import { randomBytes } from "node:crypto";
import {
  clearHostSessionCookie,
  hostPinConfigError,
  hostSessionCookie,
  mintHostSession,
  verifyHostPin,
} from "../../../../lib/host-session";
import {
  clearFailures,
  clientLimitKey,
  isLocked,
  lockRemainingMs,
  rateCookieHeader,
  rateLimitExceeded,
  readRateCookie,
  recordAuthFailure,
  sleep,
} from "../../../../lib/rate-limit";

export const dynamic = "force-dynamic";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_PER_WINDOW = 20;
const LOGIN_MAX_FAILS = 5;
const LOGIN_LOCK_MS = 30 * 60 * 1000;

function baseHeaders(request: Request, extraCookies: string[] = []) {
  const headers = new Headers({ "cache-control": "private, no-store" });
  for (const cookie of extraCookies) headers.append("set-cookie", cookie);
  if (!readRateCookie(request)) {
    headers.append("set-cookie", rateCookieHeader(randomBytes(18).toString("base64url")));
  }
  return headers;
}

export async function POST(request: Request) {
  const configError = hostPinConfigError();
  if (configError) {
    return Response.json({ error: configError }, { status: 503, headers: baseHeaders(request) });
  }

  const limitKey = clientLimitKey(request, "host-login");

  if (isLocked(limitKey)) {
    const mins = Math.ceil(lockRemainingMs(limitKey) / 60000);
    return Response.json(
      { error: `嘗試過多，請約 ${mins} 分鐘後再試` },
      { status: 429, headers: baseHeaders(request) },
    );
  }

  if (rateLimitExceeded(limitKey, { windowMs: LOGIN_WINDOW_MS, max: LOGIN_MAX_PER_WINDOW })) {
    return Response.json(
      { error: "請求過於頻繁，請稍後再試" },
      { status: 429, headers: baseHeaders(request) },
    );
  }

  let body: { pin?: string } = {};
  try {
    body = (await request.json()) as { pin?: string };
  } catch {
    return Response.json({ error: "JSON 格式不正確" }, { status: 400, headers: baseHeaders(request) });
  }

  if (!verifyHostPin(String(body.pin || ""))) {
    const { locked } = recordAuthFailure(limitKey, {
      maxFails: LOGIN_MAX_FAILS,
      lockMs: LOGIN_LOCK_MS,
    });
    await sleep(400);
    return Response.json(
      {
        error: locked
          ? "嘗試過多，主辦登入已暫時鎖定 30 分鐘"
          : "主辦密碼不正確",
      },
      { status: locked ? 429 : 401, headers: baseHeaders(request) },
    );
  }

  clearFailures(limitKey);
  const token = mintHostSession();
  if (!token) {
    return Response.json({ error: "無法建立主辦工作階段" }, { status: 500, headers: baseHeaders(request) });
  }

  return Response.json(
    { ok: true },
    { status: 200, headers: baseHeaders(request, [hostSessionCookie(token)]) },
  );
}

export async function DELETE(request: Request) {
  return Response.json(
    { ok: true },
    { status: 200, headers: baseHeaders(request, [clearHostSessionCookie()]) },
  );
}
