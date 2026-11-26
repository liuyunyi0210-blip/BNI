import { requireIdentity, requireTeamRole } from "../../cursor/identity";

function hostEmails(): string[] {
  return (process.env.HOST_EMAILS || "")
    .split(/[,;\s]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function forbidden(message: string) {
  return Response.json({ error: message }, { status: 403, headers: { "cache-control": "private, no-store" } });
}

/** 僅主辦：team app 需 admin；其餘需 HOST_EMAILS 白名單信箱。 */
export async function requireAdmin(request: Request) {
  const identity = await requireIdentity(request);
  if (identity instanceof Response) return identity;

  if (identity.appVisibility === "team") {
    const team = requireTeamRole(identity, ["admin"]);
    if (team instanceof Response) return team;
    return team;
  }

  // 本機模擬主辦（未發布、無 CURSOR_APP_ID）
  if ("simulated" in identity && identity.simulated) {
    return identity;
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

/** 可選：回傳是否為主辦（給 UI 顯示後台入口）。 */
export async function getHostStatus(request: Request) {
  const identity = await requireIdentity(request);
  if (identity instanceof Response) {
    return { host: false as const, signedIn: false as const };
  }
  if (identity.appVisibility === "team") {
    const team = requireTeamRole(identity, ["admin"]);
    return {
      host: !(team instanceof Response),
      signedIn: true as const,
      name: identity.name || "",
      email: identity.email || "",
    };
  }
  if ("simulated" in identity && identity.simulated) {
    return { host: true as const, signedIn: true as const, name: identity.name || "", email: identity.email || "" };
  }
  const allowed = hostEmails();
  const email = String(identity.email || "").toLowerCase();
  return {
    host: Boolean(email && allowed.includes(email)),
    signedIn: true as const,
    name: identity.name || "",
    email: identity.email || "",
  };
}
