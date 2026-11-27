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
  rateLimitExceeded,
  recordAuthFailure,
  sleep,
} from "../../../../lib/rate-limit";

export const dynamic = "force-dynamic";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_PER_WINDOW = 30;
const LOGIN_MAX_FAILS = 5;
const LOGIN_LOCK_MS = 30 * 60 * 1000;

const noStore = { "cache-control": "private, no-store" };

export async function POST(request: Request) {
  const configError = hostPinConfigError();
  if (configError) {
    return Response.json({ error: configError }, { status: 503, headers: noStore });
  }

  // 只依 IP；不可用 cookie 輪換重置失敗次數
  const limitKey = clientLimitKey(request, "host-login");

  if (isLocked(limitKey)) {
    const mins = Math.ceil(lockRemainingMs(limitKey) / 60000);
    return Response.json(
      { error: `嘗試過多，請約 ${mins} 分鐘後再試` },
      { status: 429, headers: noStore },
    );
  }

  if (rateLimitExceeded(limitKey, { windowMs: LOGIN_WINDOW_MS, max: LOGIN_MAX_PER_WINDOW })) {
    return Response.json(
      { error: "請求過於頻繁，請稍後再試" },
      { status: 429, headers: noStore },
    );
  }

  let body: { pin?: string } = {};
  try {
    body = (await request.json()) as { pin?: string };
  } catch {
    return Response.json({ error: "JSON 格式不正確" }, { status: 400, headers: noStore });
  }

  if (!verifyHostPin(String(body.pin || ""))) {
    const { locked, fails } = recordAuthFailure(limitKey, {
      maxFails: LOGIN_MAX_FAILS,
      lockMs: LOGIN_LOCK_MS,
    });
    // 失敗次數越多延遲越長，降低暴力猜測速度
    await sleep(400 + Math.min(fails, 5) * 350);
    return Response.json(
      {
        error: locked
          ? "嘗試過多，主辦登入已暫時鎖定 30 分鐘"
          : "主辦密碼不正確",
      },
      { status: locked ? 429 : 401, headers: noStore },
    );
  }

  clearFailures(limitKey);
  const token = mintHostSession();
  if (!token) {
    return Response.json({ error: "無法建立主辦工作階段" }, { status: 500, headers: noStore });
  }

  return Response.json(
    { ok: true },
    {
      status: 200,
      headers: {
        ...noStore,
        "set-cookie": hostSessionCookie(token),
      },
    },
  );
}

export async function DELETE() {
  return Response.json(
    { ok: true },
    {
      status: 200,
      headers: {
        ...noStore,
        "set-cookie": clearHostSessionCookie(),
      },
    },
  );
}
