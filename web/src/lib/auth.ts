import { getIdentity, requireIdentity, requireTeamRole } from "../../cursor/identity";

function hostEmails(): string[] {
  return (process.env.HOST_EMAILS || "")
    .split(/[,;\s]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function forbidden(message: string) {
  return Response.json({ error: message }, { status: 403, headers: { "cache-control": "private, no-store" } });
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

/** 僅主辦：team app 需 admin；private／其他需已驗證信箱且在 HOST_EMAILS。 */
export async function requireAdmin(request: Request) {
  const identity = await requireIdentity(request);
  if (identity instanceof Response) return identity;

  if (identity.kind === "key") {
    return forbidden("請用主辦 Cursor 帳號登入，不要用 API key");
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
    return forbidden("尚未設定主辦信箱，無法使用後台");
  }
  const email = String(identity.email || "").toLowerCase();
  if (!email || !allowed.includes(email)) {
    return forbidden("只有主辦可以管理會員資料");
  }
  return identity;
}

/** 給 UI：是否已登入、是否為主辦。 */
export async function getHostStatus(request: Request) {
  const identity = await getIdentity(request);
  if (!identity.verified) {
    return {
      host: false as const,
      signedIn: false as const,
      reason: identity.reason,
      needsCursorLogin: true as const,
    };
  }
  if (identity.kind === "key") {
    return {
      host: false as const,
      signedIn: false as const,
      reason: "api_key",
      needsCursorLogin: true as const,
    };
  }
  return {
    host: isPersonHost(identity),
    signedIn: true as const,
    name: identity.name || "",
    email: identity.email || "",
    emailVerified: identity.emailVerified,
    visibility: identity.appVisibility,
    needsCursorLogin: false as const,
  };
}
