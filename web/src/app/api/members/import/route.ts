import { requireAdmin } from "../../../../lib/auth";
import { importMembers, parseMembersCsv } from "../../../../lib/members";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const identity = await requireAdmin(request);
  if (identity instanceof Response) return identity;

  const contentType = request.headers.get("content-type") || "";
  let text = "";
  let mode: "upsert" | "skip" = "upsert";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    mode = form.get("mode") === "skip" ? "skip" : "upsert";
    if (!(file instanceof File)) {
      return Response.json({ error: "請上傳 CSV 檔" }, { status: 400 });
    }
    text = await file.text();
  } else {
    let body: { csv?: string; mode?: string } = {};
    try {
      body = (await request.json()) as { csv?: string; mode?: string };
    } catch {
      return Response.json({ error: "請提供 CSV 內容" }, { status: 400 });
    }
    text = String(body.csv || "");
    mode = body.mode === "skip" ? "skip" : "upsert";
  }

  const parsed = parseMembersCsv(text);
  if (parsed.error) return Response.json({ error: parsed.error }, { status: 400 });
  if (!parsed.rows.length) return Response.json({ error: "沒有可匯入的列" }, { status: 400 });
  if (parsed.rows.length > 2000) {
    return Response.json({ error: "一次最多匯入 2000 列" }, { status: 400 });
  }

  const result = await importMembers(parsed.rows, mode);
  return Response.json(
    { ...result, total: parsed.rows.length },
    { headers: { "cache-control": "private, no-store" } },
  );
}
