import { getHostStatus } from "../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const status = await getHostStatus(request);
  return Response.json(status, { headers: { "cache-control": "private, no-store" } });
}
