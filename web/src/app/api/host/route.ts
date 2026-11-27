import { getHostStatus } from "../../../lib/auth";
import { appendRateCookie, rateIdentity } from "../../../lib/rate-limit";

export const dynamic = "force-dynamic";

/** 順便簽發限速 cookie，讓後續登入／送出有穩定伺服器身分。 */
export async function GET(request: Request) {
  const identity = rateIdentity(request);
  const status = await getHostStatus(request);
  const headers = new Headers({ "cache-control": "private, no-store" });
  appendRateCookie(headers, identity);
  return Response.json(status, { headers });
}
