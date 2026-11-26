"use client";

import { useCallback, useEffect, useState } from "react";
import { formatWantDisplay } from "../lib/want";

type Submission = {
  id: number;
  name: string;
  chapter: string;
  role: string;
  company: string;
  industry: string;
  chain: string;
  have: string;
  want: string;
  created_at: string;
};

export function HostSubmissions() {
  const [rows, setRows] = useState<Submission[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/submissions", { credentials: "same-origin" });
    if (!res.ok) throw new Error(res.status === 401 || res.status === 403 ? "請先主辦登入" : "讀取失敗");
    const data = await res.json();
    setRows(data.submissions || []);
  }, []);

  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
  }, [load]);

  async function review(id: number, action: "approve" | "reject") {
    setError("");
    setStatus("");
    const res = await fetch(`/api/submissions/${id}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "操作失敗");
      return;
    }
    setStatus(action === "approve" ? "已核准並寫入正式名單" : "已拒絕申請");
    await load();
  }

  return (
    <section className="panel">
      <p className="kicker">待審</p>
      <h2>訪客媒合申請（{rows.length}）</h2>
      <p className="hint">訪客送出的資料不會直接改正式名單，需主辦核准。</p>
      {status ? <p className="status">{status}</p> : null}
      {error ? <p className="status error">{error}</p> : null}
      {rows.length === 0 ? (
        <p className="meta">目前沒有待審申請。</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>姓名</th>
                <th>分會／職務</th>
                <th>資源</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.name}</strong>
                    <div className="meta">{row.company || "—"}</div>
                  </td>
                  <td>
                    {row.chapter || "—"}
                    {row.role ? ` · ${row.role}` : ""}
                    <div className="meta">{row.industry}</div>
                  </td>
                  <td>
                    <div className="meta">有：{row.have || "未填"}</div>
                    <div className="meta">要：{formatWantDisplay(row.want || "")}</div>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="primary" type="button" onClick={() => review(row.id, "approve")}>
                        核准
                      </button>
                      <button className="text-btn" type="button" onClick={() => review(row.id, "reject")}>
                        拒絕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
