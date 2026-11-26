import { sql } from "./db";
import { importMembers, normalizeMember, type MemberInput } from "./members";

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
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
};

export async function listPendingSubmissions(): Promise<Submission[]> {
  return sql<Submission>(
    `select * from member_submissions where status = 'pending' order by created_at desc limit 200`,
  );
}

export async function submitGuestProfile(input: MemberInput): Promise<
  | { ok: true; submission: Submission; replacedPending: boolean }
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
  if (Number(pendingCount[0]?.count || 0) >= 500) {
    return { error: "待審申請過多，請稍後再試或洽主辦" };
  }

  const existing = await sql<Submission>(
    `select * from member_submissions
     where status = 'pending' and lower(name) = lower($1) and lower(chapter) = lower($2)
     limit 1`,
    [normalized.name, normalized.chapter || ""],
  );

  if (existing[0]) {
    const rows = await sql<Submission>(
      `update member_submissions set
        role = $2, company = $3, industry = $4, chain = $5, have = $6, want = $7, created_at = now()
       where id = $1
       returning *`,
      [
        existing[0].id,
        normalized.role || "",
        normalized.company || "",
        normalized.industry || "",
        normalized.chain || "",
        normalized.have || "",
        normalized.want || "",
      ],
    );
    return { ok: true, submission: rows[0], replacedPending: true };
  }

  const rows = await sql<Submission>(
    `insert into member_submissions
      (name, chapter, role, company, industry, chain, have, want, status)
     values ($1,$2,$3,$4,$5,$6,$7,$8,'pending')
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
    ],
  );
  return { ok: true, submission: rows[0], replacedPending: false };
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

  const result = await importMembers(
    [
      {
        name: row.name,
        chapter: row.chapter,
        role: row.role,
        company: row.company,
        industry: row.industry,
        chain: row.chain,
        have: row.have,
        want: row.want,
        notes: "由訪客申請核准",
      },
    ],
    "upsert",
  );
  if (result.errors.length && result.inserted === 0 && result.updated === 0) {
    return { error: result.errors[0] || "核准失敗" };
  }
  await sql(
    `update member_submissions set status = 'approved', reviewed_at = now() where id = $1`,
    [id],
  );
  return { ok: true };
}
