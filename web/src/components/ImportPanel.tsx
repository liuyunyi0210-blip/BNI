"use client";

import { FormEvent, useState } from "react";

export function ImportPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"upsert" | "skip">("upsert");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("請先選擇 CSV 檔");
      return;
    }
    setBusy(true);
    setError("");
    setStatus("");
    const body = new FormData();
    body.set("file", file);
    body.set("mode", mode);
    try {
      const res = await fetch("/api/members/import", { method: "POST", body, credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "匯入失敗");
        return;
      }
      const errText = data.errors?.length ? `；提醒 ${data.errors.length} 則` : "";
      setStatus(
        `完成：新增 ${data.inserted}、更新 ${data.updated}、略過 ${data.skipped}（共 ${data.total} 列）${errText}`,
      );
      if (data.errors?.length) {
        setError(data.errors.slice(0, 8).join("；"));
      }
    } catch {
      setError("匯入時發生錯誤");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid">
      <section className="panel">
        <p className="kicker">匯入</p>
        <h2>用 CSV 匯入會員</h2>
        <p className="hint">
          請下載空白範本，用 Excel／Google 試算表填入會員資料（產業鏈、想要的資源等）後上傳。真實名單請自行保管，不要放進公開網站目錄。
        </p>
        <div className="actions" style={{ margin: "12px 0" }}>
          <a className="primary" href="/samples/members-template.csv" style={{ textDecoration: "none" }}>
            下載空白範本
          </a>
        </div>
        <p className="meta">
          欄位：name, chapter, role, company, industry, chain, have, want, phone, email, notes
          （也接受中文表頭：姓名、分會、幹部職務…）
        </p>
      </section>

      <section className="panel">
        <h2>上傳檔案</h2>
        {status ? <p className="status">{status}</p> : null}
        {error ? <p className="status error">{error}</p> : null}
        <form onSubmit={onSubmit}>
          <label className="field">
            CSV 檔
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          <label className="field">
            同名處理
            <select value={mode} onChange={(e) => setMode(e.target.value as "upsert" | "skip")}>
              <option value="upsert">覆蓋更新（同名同分會）</option>
              <option value="skip">略過已存在</option>
            </select>
          </label>
          <div className="actions">
            <button className="primary" type="submit" disabled={busy}>
              {busy ? "匯入中…" : "開始匯入"}
            </button>
            <a className="text-btn" href="/host/members">
              回到會員管理
            </a>
          </div>
        </form>
      </section>
    </div>
  );
}
