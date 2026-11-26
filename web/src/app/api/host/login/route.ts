import {
  clearHostSessionCookie,
  hostPinConfigured,
  hostSessionCookie,
  mintHostSession,
  verifyHostPin,
} from "../../../../lib/host-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hostPinConfigured()) {
    return Response.json(
      { error: "尚未設定主辦密碼（HOST_PIN）" },
      { status: 503, headers: { "cache-control": "private, no-store" } },
    );
  }

  let body: { pin?: string } = {};
  try {
    body = (await request.json()) as { pin?: string };
  } catch {
    return Response.json({ error: "JSON 格式不正確" }, { status: 400 });
  }

  if (!verifyHostPin(String(body.pin || ""))) {
    return Response.json(
      { error: "主辦密碼不正確" },
      { status: 401, headers: { "cache-control": "private, no-store" } },
    );
  }

  const token = mintHostSession();
  if (!token) {
    return Response.json({ error: "無法建立主辦工作階段" }, { status: 500 });
  }

  return Response.json(
    { ok: true },
    {
      status: 200,
      headers: {
        "cache-control": "private, no-store",
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
        "cache-control": "private, no-store",
        "set-cookie": clearHostSessionCookie(),
      },
    },
  );
}
