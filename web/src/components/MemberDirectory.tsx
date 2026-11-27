"use client";

import { useEffect, useMemo, useState } from "react";
import { CHAPTERS } from "../lib/constants";
import { formatWantDisplay } from "../lib/want";

type Member = {
  id: number;
  name: string;
  chapter: string;
  role: string;
  company: string;
  industry: string;
  chain: string;
  have: string;
  want: string;
};

export function MemberDirectory() {
  const [members, setMembers] = useState<Member[]>([]);
  const [q, setQ] = useState("");
  const [chapter, setChapter] = useState("大芯");
  const [sample, setSample] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (chapter) params.set("chapter", chapter);
    setLoading(true);
    fetch(`/api/members?${params.toString()}`, {
      signal: controller.signal,
      credentials: "same-origin",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(res.status === 429 ? "請求過於頻繁，請稍後再試" : "讀取失敗");
        return res.json();
      })
      .then((data) => {
        setMembers(data.members || []);
        setSample(Boolean(data.sample));
        setError("");
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setError(err.message || "讀取失敗");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [q, chapter]);

  const countLabel = useMemo(() => `${members.length} 人`, [members.length]);

  return (
    <div className="grid">
      {sample ? (
        <p className="callout">目前是本機示範資料庫（尚未連正式 Postgres）。發布後名單會持久保存。</p>
      ) : null}
      {error ? <p className="status error">{error}</p> : null}
      <div className="panel">
        <div className="grid filters">
          <label className="field">
            搜尋
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="姓名、公司、行業、資源"
            />
          </label>
          <label className="field">
            分會
            <select value={chapter} onChange={(e) => setChapter(e.target.value)} required>
              {CHAPTERS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <p className="meta" style={{ marginBottom: 12 }}>
            {loading ? "載入中…" : countLabel}
          </p>
        </div>
      </div>
      {!loading && members.length === 0 ? (
        <p className="panel hint">還沒有會員。請到後台匯入 CSV，或手動新增。</p>
      ) : (
        <div className="card-list">
          {members.map((member) => (
            <article key={member.id} className="member-card">
              <h3>
                {member.name}
                {member.role ? <span className="tag">{member.role}</span> : null}
              </h3>
              <p>
                {[member.chapter ? `${member.chapter}分會` : "", member.industry, member.company]
                  .filter(Boolean)
                  .join(" · ") || "尚未填公司行業"}
              </p>
              {member.chain ? <p>產業鏈：{member.chain}</p> : null}
              <p>有的：{member.have || "未填"}</p>
              <p>想要：{formatWantDisplay(member.want || "")}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
