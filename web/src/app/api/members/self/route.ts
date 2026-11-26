import type { MemberInput } from "../../../../lib/members";
import { submitGuestProfile } from "../../../../lib/submissions";

export const dynamic = "force-dynamic";

/** 訪客送出媒合申請：只進待審佇列，不直接改正式名單。 */
export async function POST(request: Request) {
  let body: MemberInput;
  try {
    body = (await request.json()) as MemberInput;
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
