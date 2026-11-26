import { importMembers, normalizeMember, type MemberInput } from "../../../../lib/members";

export const dynamic = "force-dynamic";

/** 訪客自行登錄／更新媒合資料（不含電話信箱備註）。 */
export async function POST(request: Request) {
  let body: MemberInput;
  try {
    body = (await request.json()) as MemberInput;
  } catch {
    return Response.json({ error: "JSON 格式不正確" }, { status: 400 });
  }

  const payload: MemberInput = {
    name: body.name,
    chapter: body.chapter,
    role: body.role,
    company: body.company,
    industry: body.industry,
    chain: body.chain,
    have: body.have,
    want: body.want,
  };

  const normalized = normalizeMember(payload);
  if ("error" in normalized) {
    return Response.json({ error: normalized.error }, { status: 400 });
  }

  const safe: MemberInput = {
    ...normalized,
    phone: "",
    email: "",
    notes: "訪客自行登錄媒合資料",
  };

  const result = await importMembers([safe], "upsert");
  if (result.errors.length && result.inserted === 0 && result.updated === 0) {
    return Response.json({ error: result.errors[0] || "儲存失敗" }, { status: 400 });
  }

  return Response.json(
    {
      ok: true,
      inserted: result.inserted,
      updated: result.updated,
      member: {
        name: safe.name,
        chapter: safe.chapter,
        role: safe.role,
        company: safe.company,
        industry: safe.industry,
        chain: safe.chain,
        have: safe.have,
        want: safe.want,
      },
    },
    { status: 200, headers: { "cache-control": "private, no-store" } },
  );
}
