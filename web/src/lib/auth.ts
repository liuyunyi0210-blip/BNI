import { requireIdentity, requireTeamRole } from "../../cursor/identity";

export async function requireViewer(request: Request) {
  return requireIdentity(request);
}

/** 後台寫入：需登入；若是 team app，admin 或 member 皆可。 */
export async function requireAdmin(request: Request) {
  const identity = await requireIdentity(request);
  if (identity instanceof Response) return identity;
  if (identity.appVisibility === "team") {
    const team = requireTeamRole(identity, ["admin", "member", "service"]);
    if (team instanceof Response) return team;
    return team;
  }
  return identity;
}
