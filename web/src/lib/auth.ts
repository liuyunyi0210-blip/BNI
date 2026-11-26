import { getIdentity, requireIdentity, requireTeamRole } from "../../cursor/identity";
import {
  hostPinConfigured,
  requestHasHostSession,
} from "./host-session";

function hostEmails(): string[] {
  return (process.env.HOST_EMAILS || "")
    .split(/[,;\s]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function forbidden(message: string) {
  return Response.json({ error: message }, { status: 403, headers: { "cache-control": "private, no-store" } });
}

function unauthorized(message: string) {
  return Response.json({ error: message }, { status: 401, headers: { "cache-control": "private, no-store" } });
}

function isPersonHost(identity: Awaited<ReturnType<typeof getIdentity>>): boolean {
  if (!identity.verified) return false;
  if (identity.kind === "key") return false;
  if (identity.simulated) return true;
  if (identity.appVisibility === "team") {
    return identity.teamRole === "admin";
  }
  if (!identity.emailVerified) return false;
  const allowed = hostEmails();
  if (allowed.length === 0) return false;
  const email = String(identity.email || "").toLowerCase();
  return Boolean(email && allowed.includes(email));
}

/** 僅主辦：Cursor 身分（team admin／HOST_EMAILS）或有效的 HOST_PIN 工作階段。 */
export async function requireAdmin(request: Request) {
  if (requestHasHostSession(request)) {
    return { kind: "pin-session" as const };
  }

  const identity = await getIdentity(request);
  if (identity.verified) {
    if (identity.kind === "key") {
      return forbidden("請用主辦帳號或主辦密碼登入，不要用 API key");
    }
    if (identity.appVisibility === "team") {
      const team = requireTeamRole(identity, ["admin"]);
      if (team instanceof Response) return team;
      return team;
    }
    if (identity.simulated) return identity;
    if (!identity.emailVerified) {
      return forbidden("主辦信箱尚未驗證，無法進入後台");
    }
    const allowed = hostEmails();
    if (allowed.length === 0) {
      // Public 常見：改走 PIN
      if (hostPinConfigured()) {
        return unauthorized("請用主辦密碼登入");
      }
      return forbidden("尚未設定主辦信箱或主辦密碼");
    }
    const email = String(identity.email || "").toLowerCase();
    if (!email || !allowed.includes(email)) {
      if (hostPinConfigured()) return unauthorized("請用主辦密碼登入");
      return forbidden("只有主辦可以管理會員資料");
    }
    return identity;
  }

  if (hostPinConfigured()) {
    return unauthorized("請用主辦密碼登入");
  }

  // 本機無 PIN、無身分時，維持 requireIdentity 行為以便開發
  const required = await requireIdentity(request);
  if (required instanceof Response) return required;
  return required;
}

export async function getHostStatus(request: Request) {
  if (requestHasHostSession(request)) {
    return {
      host: true as const,
      signedIn: true as const,
      via: "pin" as const,
      pinConfigured: hostPinConfigured(),
      needsCursorLogin: false as const,
    };
  }

  const identity = await getIdentity(request);
  if (!identity.verified) {
    return {
      host: false as const,
      signedIn: false as const,
      reason: identity.reason,
      pinConfigured: hostPinConfigured(),
      needsCursorLogin: !hostPinConfigured(),
      canUsePin: hostPinConfigured(),
    };
  }
  if (identity.kind === "key") {
    return {
      host: false as const,
      signedIn: false as const,
      reason: "api_key",
      pinConfigured: hostPinConfigured(),
      canUsePin: hostPinConfigured(),
      needsCursorLogin: false as const,
    };
  }
  return {
    host: isPersonHost(identity),
    signedIn: true as const,
    name: identity.name || "",
    email: identity.email || "",
    emailVerified: identity.emailVerified,
    visibility: identity.appVisibility,
    pinConfigured: hostPinConfigured(),
    canUsePin: hostPinConfigured(),
    needsCursorLogin: false as const,
    via: "identity" as const,
  };
}
