import { randomBytes } from "node:crypto";
import { sql } from "./db";
import { createMember, normalizeMember, type Member, type MemberInput } from "./members";

export type { MemberInput };

export type Submission = {
  id: number;
  name: string;
  chapter: string;
  role: string;
  company: string;
  industry: string;
  chain: string;
  have: string;
  want: string;
  edit_token: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
};

function newEditToken(): string {
  return randomBytes(24).toString("hex");
}

export async function listPendingSubmissions(): Promise<Submission[]> {
  return sql<Submission>(
    `select id, name, chapter, role, company, industry, chain, have, want, status, created_at, reviewed_at,
            '' as edit_token
     from member_submissions where status = 'pending' order by created_at desc limit 200`,
  );
}

export async function submitGuestProfile(
  input: MemberInput & { editToken?: string },
): Promise<
  | { ok: true; submission: Submission; replacedPending: boolean; editToken: string }
  | { error: string }
> {
  const normalized = normalizeMember({
    name: input.name,
    chapter: input.chapter,
    role: input.role,
    company: input.company,
    industry: input.industry,
    chain: input.chain,
    have: input.have,
    want: input.want,
  });
  if ("error" in normalized) return normalized;

  const pendingCount = await sql<{ count: string }>(
    `select count(*)::text as count from member_submissions where status = 'pending'`,
  );
  if (Number(pendingCount[0]?.count || 0) >= 200) {
    return { error: "待審申請過多，請稍後再試或洽主辦" };
  }

  const providedToken = String(input.editToken || "").trim();

  if (providedToken) {
    const owned = await sql<Submission>(
      `select * from member_submissions
       where status = 'pending' and edit_token = $1
       limit 1`,
      [providedToken],
    );
    if (owned[0]) {
      const rows = await sql<Submission>(
        `update member_submissions set
          name = $2, chapter = $3, role = $4, company = $5, industry = $6,
          chain = $7, have = $8, want = $9, created_at = now()
         where id = $1 and edit_token = $10 and status = 'pending'
         returning *`,
        [
          owned[0].id,
          normalized.name,
          normalized.chapter || "",
          normalized.role || "",
          normalized.company || "",
          normalized.industry || "",
          normalized.chain || "",
          normalized.have || "",
          normalized.want || "",
          providedToken,
        ],
      );
      if (!rows[0]) return { error: "無法更新待審申請" };
      return {
        ok: true,
        submission: rows[0],
        replacedPending: true,
        editToken: providedToken,
      };
    }
  }

  const existing = await sql<Submission>(
    `select * from member_submissions
     where status = 'pending' and lower(name) = lower($1) and lower(chapter) = lower($2)
     limit 1`,
    [normalized.name, normalized.chapter || ""],
  );

  if (existing[0]) {
    return {
      error: "此姓名與分會已有待審申請。請用原裝置繼續編輯，或洽主辦處理。",
    };
  }

  const editToken = newEditToken();
  const rows = await sql<Submission>(
    `insert into member_submissions
      (name, chapter, role, company, industry, chain, have, want, status, edit_token)
     values ($1,$2,$3,$4,$5,$6,$7,$8,'pending',$9)
     returning *`,
    [
      normalized.name,
      normalized.chapter || "",
      normalized.role || "",
      normalized.company || "",
      normalized.industry || "",
      normalized.chain || "",
      normalized.have || "",
      normalized.want || "",
      editToken,
    ],
  );
  return { ok: true, submission: rows[0], replacedPending: false, editToken };
}

/** 核准時合併進正式名單：不覆寫既有電話／信箱／備註（訪客申請沒有這些欄位）。 */
async function mergeApprovedSubmission(row: Submission): Promise<{ ok: true } | { error: string }> {
  const normalized = normalizeMember({
    name: row.name,
    chapter: row.chapter,
    role: row.role,
    company: row.company,
    industry: row.industry,
    chain: row.chain,
    have: row.have,
    want: row.want,
  });
  if ("error" in normalized) return normalized;

  const existing = await sql<Member>(
    `select * from members
     where active = true and lower(name) = lower($1) and lower(chapter) = lower($2)
     limit 1`,
    [normalized.name, normalized.chapter || ""],
  );

  if (existing[0]) {
    const prev = existing[0];
    const noteParts = [prev.notes, "由訪客申請核准"].filter(Boolean);
    const notes = Array.from(new Set(noteParts)).join("；").slice(0, 240);
    try {
      await sql(
        `update members set
          role = $2, company = $3, industry = $4, chain = $5,
          have = $6, want = $7, notes = $8, updated_at = now()
         where id = $1`,
        [
          prev.id,
          normalized.role || prev.role || "",
          normalized.company || prev.company || "",
          normalized.industry || prev.industry || "",
          normalized.chain || prev.chain || "",
          normalized.have || prev.have || "",
          normalized.want || prev.want || "",
          notes,
        ],
      );
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/unique|duplicate/i.test(message)) return { error: "同一分會已有同名會員" };
      throw error;
    }
  }

  const created = await createMember({
    ...normalized,
    notes: "由訪客申請核准",
  });
  if ("error" in created) return created;
  return { ok: true };
}

export async function reviewSubmission(
  id: number,
  action: "approve" | "reject",
): Promise<{ ok: true } | { error: string }> {
  const rows = await sql<Submission>(
    `select * from member_submissions where id = $1 and status = 'pending' limit 1`,
    [id],
  );
  const row = rows[0];
  if (!row) return { error: "找不到待審申請" };

  if (action === "reject") {
    await sql(
      `update member_submissions set status = 'rejected', reviewed_at = now() where id = $1`,
      [id],
    );
    return { ok: true };
  }

  const result = await mergeApprovedSubmission(row);
  if ("error" in result) return result;

  await sql(
    `update member_submissions set status = 'approved', reviewed_at = now() where id = $1`,
    [id],
  );
  return { ok: true };
}
