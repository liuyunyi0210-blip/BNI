import { requireAdmin } from "../../../lib/auth";
import { listPendingSubmissions } from "../../../lib/submissions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await requireAdmin(request);
  if (identity instanceof Response) return identity;
  const rows = await listPendingSubmissions();
  return Response.json(
    { submissions: rows },
    { headers: { "cache-control": "private, no-store" } },
  );
}
