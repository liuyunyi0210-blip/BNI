import type { MemberInput } from "../../../../lib/members";
import { submitGuestProfile } from "../../../../lib/submissions";
import {
  clientIp,
  rateLimitExceeded,
} from "../../../../lib/rate-limit";

export const dynamic = "force-dynamic";

const SELF_WINDOW_MS = 60 * 60 * 1000;
const SELF_MAX_PER_HOUR = 12;

/** 訪客送出媒合申請：只進待審佇列，不直接改正式名單。 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  if (rateLimitExceeded(`self-submit:${ip}`, { windowMs: SELF_WINDOW_MS, max: SELF_MAX_PER_HOUR })) {
    return Response.json(
      { error: "送出過於頻繁，請稍後再試" },
      { status: 429, headers: { "cache-control": "private, no-store" } },
    );
  }

  let body: MemberInput & { editToken?: string };
  try {
    body = (await request.json()) as MemberInput & { editToken?: string };
  } catch {
    return Response.json({ error: "JSON 格式不正確" }, { status: 400 });
  }

  const result = await submitGuestProfile(body);
  if ("error" in result) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json(
    {
      ok: true,
      pending: true,
      replacedPending: result.replacedPending,
      editToken: result.editToken,
      member: {
        name: result.submission.name,
        chapter: result.submission.chapter,
        role: result.submission.role,
        company: result.submission.company,
        industry: result.submission.industry,
        chain: result.submission.chain,
        have: result.submission.have,
        want: result.submission.want,
      },
      message: result.replacedPending
        ? "已更新你的待審申請，主辦核准後才會進正式名單。"
        : "已送出待審申請，主辦核准後才會進正式名單。",
    },
    { status: 200, headers: { "cache-control": "private, no-store" } },
  );
}
