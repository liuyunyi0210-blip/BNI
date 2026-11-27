import { randomBytes } from "node:crypto";
import { requireAdmin } from "../../../lib/auth";
import { createMember, listMembers, listPublicMembers } from "../../../lib/members";
import {
  clientLimitKey,
  rateCookieHeader,
  rateLimitExceeded,
  readRateCookie,
} from "../../../lib/rate-limit";

export const dynamic = "force-dynamic";

function publicHeaders(request: Request) {
  const headers = new Headers({ "cache-control": "private, no-store" });
  if (!readRateCookie(request)) {
    headers.append("set-cookie", rateCookieHeader(randomBytes(18).toString("base64url")));
  }
  return headers;
}

/** 公開名單：免登入，需指定分會；只回傳前台需要的欄位。 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || undefined;
  const chapter = url.searchParams.get("chapter") || undefined;
  const adminView = url.searchParams.get("admin") === "1";

  if (adminView) {
    const identity = await requireAdmin(request);
    if (identity instanceof Response) return identity;
    const includeInactive = url.searchParams.get("all") === "1";
    const rows = await listMembers({ q, chapter, includeInactive });
    return Response.json(
      { members: rows, sample: !process.env.DATABASE_URL },
      { headers: { "cache-control": "private, no-store" } },
    );
  }

  const limitKey = clientLimitKey(request, "public-members");
  if (rateLimitExceeded(limitKey, { windowMs: 60 * 1000, max: 60 })) {
    return Response.json(
      { error: "請求過於頻繁，請稍後再試" },
      { status: 429, headers: publicHeaders(request) },
    );
  }

  if (!chapter) {
    return Response.json(
      { members: [], needChapter: true, sample: !process.env.DATABASE_URL },
      { headers: publicHeaders(request) },
    );
  }

  const rows = await listPublicMembers({ q, chapter, limit: 80 });
  return Response.json(
    { members: rows, sample: !process.env.DATABASE_URL },
    { headers: publicHeaders(request) },
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
