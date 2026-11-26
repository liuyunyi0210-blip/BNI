import { requireAdmin } from "../../../../lib/auth";
import { reviewSubmission } from "../../../../lib/submissions";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const identity = await requireAdmin(request);
  if (identity instanceof Response) return identity;

  const { id } = await ctx.params;
  const submissionId = Number(id);
  if (!Number.isInteger(submissionId)) {
    return Response.json({ error: "無效的 id" }, { status: 400 });
  }

  let body: { action?: string } = {};
  try {
    body = (await request.json()) as { action?: string };
  } catch {
    return Response.json({ error: "JSON 格式不正確" }, { status: 400 });
  }
  const action = body.action === "reject" ? "reject" : body.action === "approve" ? "approve" : null;
  if (!action) return Response.json({ error: "請指定 approve 或 reject" }, { status: 400 });

  const result = await reviewSubmission(submissionId, action);
  if ("error" in result) return Response.json(result, { status: 400 });
  return Response.json({ ok: true }, { headers: { "cache-control": "private, no-store" } });
}
