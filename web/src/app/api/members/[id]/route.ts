import { requireAdmin } from "../../../../lib/auth";
import { deactivateMember, getMember, updateMember } from "../../../../lib/members";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const identity = await requireAdmin(request);
  if (identity instanceof Response) return identity;
  const { id } = await ctx.params;
  const memberId = Number(id);
  if (!Number.isInteger(memberId)) return Response.json({ error: "無效的 id" }, { status: 400 });
  const member = await getMember(memberId);
  if (!member) return Response.json({ error: "找不到會員" }, { status: 404 });
  return Response.json({ member }, { headers: { "cache-control": "private, no-store" } });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const identity = await requireAdmin(request);
  if (identity instanceof Response) return identity;
  const { id } = await ctx.params;
  const memberId = Number(id);
  if (!Number.isInteger(memberId)) return Response.json({ error: "無效的 id" }, { status: 400 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON 格式不正確" }, { status: 400 });
  }
  const result = await updateMember(memberId, (body ?? {}) as Parameters<typeof updateMember>[1]);
  if ("error" in result) return Response.json(result, { status: 400 });
  return Response.json({ member: result }, { headers: { "cache-control": "private, no-store" } });
}

export async function DELETE(request: Request, ctx: Ctx) {
  const identity = await requireAdmin(request);
  if (identity instanceof Response) return identity;
  const { id } = await ctx.params;
  const memberId = Number(id);
  if (!Number.isInteger(memberId)) return Response.json({ error: "無效的 id" }, { status: 400 });
  const ok = await deactivateMember(memberId);
  if (!ok) return Response.json({ error: "找不到會員" }, { status: 404 });
  return new Response(null, { status: 204 });
}
