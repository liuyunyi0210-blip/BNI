import type { MemberInput } from "../../../../lib/members";
import { submitGuestProfile } from "../../../../lib/submissions";
import {
  clientLimitKey,
  rateLimitExceeded,
  sleep,
} from "../../../../lib/rate-limit";

export const dynamic = "force-dynamic";

const SELF_WINDOW_MS = 60 * 60 * 1000;
const SELF_MAX_PER_HOUR = 3;
const SELF_DAY_MS = 24 * 60 * 60 * 1000;
const SELF_MAX_PER_DAY = 8;

const noStore = { "cache-control": "private, no-store" };

/** 訪客送出媒合申請：只進待審佇列，不直接改正式名單。 */
export async function POST(request: Request) {
  // 只依 IP，避免換 cookie／偽造標頭重置額度
  const hourKey = clientLimitKey(request, "self-submit");
  const dayKey = clientLimitKey(request, "self-submit-day");

  if (
    rateLimitExceeded(hourKey, { windowMs: SELF_WINDOW_MS, max: SELF_MAX_PER_HOUR }) ||
    rateLimitExceeded(dayKey, { windowMs: SELF_DAY_MS, max: SELF_MAX_PER_DAY })
  ) {
    return Response.json(
      { error: "送出過於頻繁，請稍後再試" },
      { status: 429, headers: noStore },
    );
  }

  let body: MemberInput & {
    editToken?: string;
    website?: string;
    formStartedAt?: number;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "JSON 格式不正確" }, { status: 400, headers: noStore });
  }

  // honeypot：正常表單應為空
  if (String(body.website || "").trim()) {
    await sleep(300);
    return Response.json(
      { ok: true, pending: true, replacedPending: false, message: "已送出待審申請，主辦核准後才會進正式名單。" },
      { status: 200, headers: noStore },
    );
  }

  const started = Number(body.formStartedAt);
  if (!Number.isFinite(started) || Date.now() - started < 2000 || Date.now() - started > 6 * 60 * 60 * 1000) {
    return Response.json(
      { error: "請稍候再送出，或重新整理頁面後再試" },
      { status: 400, headers: noStore },
    );
  }

  const result = await submitGuestProfile(body);
  if ("error" in result) {
    return Response.json({ error: result.error }, { status: 400, headers: noStore });
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
    { status: 200, headers: noStore },
  );
}
