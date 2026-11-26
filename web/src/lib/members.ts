import { sql } from "./db";
import { CHAPTERS, MEMBER_CSV_HEADERS, type MemberCsvHeader } from "./constants";

export type Member = {
  id: number;
  name: string;
  chapter: string;
  role: string;
  company: string;
  industry: string;
  chain: string;
  have: string;
  want: string;
  phone: string;
  email: string;
  notes: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type MemberInput = {
  name: string;
  chapter?: string;
  role?: string;
  company?: string;
  industry?: string;
  chain?: string;
  have?: string;
  want?: string;
  phone?: string;
  email?: string;
  notes?: string;
  active?: boolean;
};

function clean(value: unknown, max = 200): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function knownChapter(value: unknown): string {
  const text = clean(value, 40).replace(/分會$/, "");
  return (CHAPTERS as readonly string[]).includes(text) ? text : text;
}

export function normalizeMember(input: MemberInput): MemberInput | { error: string } {
  const name = clean(input.name, 40);
  if (!name) return { error: "姓名必填" };
  return {
    name,
    chapter: knownChapter(input.chapter),
    role: clean(input.role, 40),
    company: clean(input.company, 80),
    industry: clean(input.industry, 40),
    chain: clean(input.chain, 120),
    have: clean(input.have, 240),
    want: clean(input.want, 240),
    phone: clean(input.phone, 40),
    email: clean(input.email, 80),
    notes: clean(input.notes, 240),
    active: input.active !== false,
  };
}

export async function listMembers(opts: {
  q?: string;
  chapter?: string;
  includeInactive?: boolean;
} = {}): Promise<Member[]> {
  const params: unknown[] = [];
  const where: string[] = [];
  if (!opts.includeInactive) where.push("active = true");
  if (opts.chapter) {
    params.push(opts.chapter);
    where.push(`chapter = $${params.length}`);
  }
  if (opts.q) {
    params.push(`%${opts.q}%`);
    const i = params.length;
    where.push(
      `(name ilike $${i} or company ilike $${i} or industry ilike $${i} or have ilike $${i} or want ilike $${i} or role ilike $${i})`,
    );
  }
  const sqlText = `select * from members${where.length ? ` where ${where.join(" and ")}` : ""} order by chapter, name`;
  return sql<Member>(sqlText, params);
}

export async function getMember(id: number): Promise<Member | null> {
  const rows = await sql<Member>("select * from members where id = $1", [id]);
  return rows[0] ?? null;
}

export async function createMember(input: MemberInput): Promise<Member | { error: string }> {
  const normalized = normalizeMember(input);
  if ("error" in normalized) return normalized;
  try {
    const rows = await sql<Member>(
      `insert into members
        (name, chapter, role, company, industry, chain, have, want, phone, email, notes, active)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       returning *`,
      [
        normalized.name,
        normalized.chapter,
        normalized.role,
        normalized.company,
        normalized.industry,
        normalized.chain,
        normalized.have,
        normalized.want,
        normalized.phone,
        normalized.email,
        normalized.notes,
        normalized.active !== false,
      ],
    );
    return rows[0];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/unique|duplicate/i.test(message)) return { error: "同一分會已有同名會員" };
    throw error;
  }
}

export async function updateMember(
  id: number,
  input: MemberInput,
): Promise<Member | { error: string }> {
  const normalized = normalizeMember(input);
  if ("error" in normalized) return normalized;
  try {
    const rows = await sql<Member>(
      `update members set
        name = $2, chapter = $3, role = $4, company = $5, industry = $6, chain = $7,
        have = $8, want = $9, phone = $10, email = $11, notes = $12, active = $13,
        updated_at = now()
       where id = $1
       returning *`,
      [
        id,
        normalized.name,
        normalized.chapter,
        normalized.role,
        normalized.company,
        normalized.industry,
        normalized.chain,
        normalized.have,
        normalized.want,
        normalized.phone,
        normalized.email,
        normalized.notes,
        normalized.active !== false,
      ],
    );
    return rows[0] ?? { error: "找不到這位會員" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/unique|duplicate/i.test(message)) return { error: "同一分會已有同名會員" };
    throw error;
  }
}

export async function deactivateMember(id: number): Promise<boolean> {
  const rows = await sql<{ id: number }>(
    "update members set active = false, updated_at = now() where id = $1 returning id",
    [id],
  );
  return rows.length > 0;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export function parseMembersCsv(text: string): { rows: MemberInput[]; error?: string } {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== "");
  if (!lines.length) return { rows: [], error: "檔案是空的" };
  const header = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const index = new Map(header.map((h, i) => [h, i]));
  if (!index.has("name") && !index.has("姓名")) {
    return { rows: [], error: "CSV 第一列需要 name 或 姓名 欄位" };
  }
  const alias: Record<string, MemberCsvHeader> = {
    name: "name",
    姓名: "name",
    chapter: "chapter",
    分會: "chapter",
    role: "role",
    幹部職務: "role",
    職務: "role",
    company: "company",
    公司: "company",
    industry: "industry",
    行業: "industry",
    行業別: "industry",
    chain: "chain",
    產業鏈: "chain",
    have: "have",
    有的資源: "have",
    我有的資源: "have",
    want: "want",
    想要的資源: "want",
    phone: "phone",
    電話: "phone",
    email: "email",
    信箱: "email",
    notes: "notes",
    備註: "notes",
  };
  const mapped = MEMBER_CSV_HEADERS.map((key) => {
    for (const [label, field] of Object.entries(alias)) {
      if (field === key && index.has(label)) return index.get(label)!;
    }
    return -1;
  });

  const rows: MemberInput[] = [];
  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line);
    const get = (field: MemberCsvHeader) => {
      const i = mapped[MEMBER_CSV_HEADERS.indexOf(field)];
      return i >= 0 ? cols[i] ?? "" : "";
    };
    const name = get("name");
    if (!clean(name)) continue;
    rows.push({
      name,
      chapter: get("chapter"),
      role: get("role"),
      company: get("company"),
      industry: get("industry"),
      chain: get("chain"),
      have: get("have"),
      want: get("want"),
      phone: get("phone"),
      email: get("email"),
      notes: get("notes"),
    });
  }
  return { rows };
}

export function membersToCsv(rows: Member[]): string {
  const escape = (value: string) => {
    if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
    return value;
  };
  const lines = [MEMBER_CSV_HEADERS.join(",")];
  for (const row of rows) {
    lines.push(
      MEMBER_CSV_HEADERS.map((key) => escape(String(row[key] ?? ""))).join(","),
    );
  }
  return lines.join("\n") + "\n";
}

export async function importMembers(
  rows: MemberInput[],
  mode: "upsert" | "skip" = "upsert",
): Promise<{ inserted: number; updated: number; skipped: number; errors: string[] }> {
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];
  for (const [index, row] of rows.entries()) {
    const normalized = normalizeMember(row);
    if ("error" in normalized) {
      errors.push(`第 ${index + 2} 列：${normalized.error}`);
      continue;
    }
    const existing = await sql<{ id: number }>(
      `select id from members
       where active = true and lower(name) = lower($1) and lower(chapter) = lower($2)
       limit 1`,
      [normalized.name, normalized.chapter],
    );
    if (existing[0]) {
      if (mode === "skip") {
        skipped += 1;
        continue;
      }
      const result = await updateMember(existing[0].id, normalized);
      if ("error" in result) errors.push(`第 ${index + 2} 列：${result.error}`);
      else updated += 1;
    } else {
      const result = await createMember(normalized);
      if ("error" in result) errors.push(`第 ${index + 2} 列：${result.error}`);
      else inserted += 1;
    }
  }
  return { inserted, updated, skipped, errors };
}
