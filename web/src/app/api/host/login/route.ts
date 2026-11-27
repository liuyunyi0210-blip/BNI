import {
  clearHostSessionCookie,
  hostPinConfigError,
  hostSessionCookie,
  mintHostSession,
  verifyHostPin,
} from "../../../../lib/host-session";
import {
  appendRateCookie,
  clearFailures,
  clientLimitKey,
  globalLimitKey,
  isLocked,
  lockRemainingMs,
  rateIdentity,
  rateLimitExceededPair,
  recordAuthFailure,
  sleep,
} from "../../../../lib/rate-limit";

export const dynamic = "force-dynamic";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_PER_WINDOW = 20;
const LOGIN_GLOBAL_MAX = 40;
const LOGIN_MAX_FAILS = 5;
const LOGIN_GLOBAL_MAX_FAILS = 15;
const LOGIN_LOCK_MS = 30 * 60 * 1000;

function headersFor(identity: ReturnType<typeof rateIdentity>, extraCookies: string[] = []) {
  const headers = new Headers({ "cache-control": "private, no-store" });
  for (const cookie of extraCookies) headers.append("set-cookie", cookie);
  appendRateCookie(headers, identity);
  return headers;
}

export async function POST(request: Request) {
  const identity = rateIdentity(request);
  const personalKey = clientLimitKey(identity.id, "host-login");
  const globalKey = globalLimitKey("host-login");

  const configError = hostPinConfigError();
  if (configError) {
    return Response.json({ error: configError }, { status: 503, headers: headersFor(identity) });
  }

  if (isLocked(personalKey) || isLocked(globalKey)) {
    const mins = Math.ceil(
      Math.max(lockRemainingMs(personalKey), lockRemainingMs(globalKey)) / 60000,
    );
    return Response.json(
      { error: `嘗試過多，請約 ${Math.max(mins, 1)} 分鐘後再試` },
      { status: 429, headers: headersFor(identity) },
    );
  }

  if (
    rateLimitExceededPair(identity.id, "host-login", {
      windowMs: LOGIN_WINDOW_MS,
      max: LOGIN_MAX_PER_WINDOW,
      globalMax: LOGIN_GLOBAL_MAX,
    })
  ) {
    return Response.json(
      { error: "請求過於頻繁，請稍後再試" },
      { status: 429, headers: headersFor(identity) },
    );
  }

  let body: { pin?: string } = {};
  try {
    body = (await request.json()) as { pin?: string };
  } catch {
    return Response.json({ error: "JSON 格式不正確" }, { status: 400, headers: headersFor(identity) });
  }

  if (!verifyHostPin(String(body.pin || ""))) {
    const personal = recordAuthFailure(personalKey, {
      maxFails: LOGIN_MAX_FAILS,
      lockMs: LOGIN_LOCK_MS,
    });
    const global = recordAuthFailure(globalKey, {
      maxFails: LOGIN_GLOBAL_MAX_FAILS,
      lockMs: LOGIN_LOCK_MS,
    });
    const locked = personal.locked || global.locked;
    await sleep(500 + Math.min(personal.fails, 5) * 400);
    return Response.json(
      {
        error: locked
          ? "嘗試過多，主辦登入已暫時鎖定 30 分鐘"
          : "主辦密碼不正確",
      },
      { status: locked ? 429 : 401, headers: headersFor(identity) },
    );
  }

  clearFailures(personalKey);
  const token = mintHostSession();
  if (!token) {
    return Response.json(
      { error: "無法建立主辦工作階段" },
      { status: 500, headers: headersFor(identity) },
    );
  }

  return Response.json(
    { ok: true },
    { status: 200, headers: headersFor(identity, [hostSessionCookie(token)]) },
  );
}

export async function DELETE(request: Request) {
  const identity = rateIdentity(request);
  return Response.json(
    { ok: true },
    { status: 200, headers: headersFor(identity, [clearHostSessionCookie()]) },
  );
}
