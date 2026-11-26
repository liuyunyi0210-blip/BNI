import { requireAdmin } from "../../../../lib/auth";
import { listMembers, membersToCsv } from "../../../../lib/members";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await requireAdmin(request);
  if (identity instanceof Response) return identity;
  const url = new URL(request.url);
  const chapter = url.searchParams.get("chapter") || undefined;
  const rows = await listMembers({ chapter, includeInactive: url.searchParams.get("all") === "1" });
  const csv = membersToCsv(rows);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="bni-members.csv"',
      "cache-control": "private, no-store",
    },
  });
}
