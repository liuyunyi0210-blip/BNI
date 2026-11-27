import { requireAdmin } from "../../../lib/auth";
import { createMember, listMembers } from "../../../lib/members";

export const dynamic = "force-dynamic";

/**
 * 名單僅主辦可讀：避免 Public App 整冊會員資料被匿名下載。
 * 訪客請走登錄申請與現場媒合頁，不開放公開名冊 API。
 */
export async function GET(request: Request) {
  const identity = await requireAdmin(request);
  if (identity instanceof Response) return identity;

  const url = new URL(request.url);
  const q = url.searchParams.get("q") || undefined;
  const chapter = url.searchParams.get("chapter") || undefined;
  const includeInactive = url.searchParams.get("all") === "1";
  const rows = await listMembers({ q, chapter, includeInactive });
  return Response.json(
    { members: rows, sample: !process.env.DATABASE_URL },
    { headers: { "cache-control": "private, no-store" } },
  );
}

export async function POST(request: Request) {
  const identity = await requireAdmin(request);
  if (identity instanceof Response) return identity;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON 格式不正確" }, { status: 400 });
  }
  const result = await createMember((body ?? {}) as Parameters<typeof createMember>[0]);
  if ("error" in result) return Response.json(result, { status: 400 });
  return Response.json({ member: result }, { status: 201, headers: { "cache-control": "private, no-store" } });
}
