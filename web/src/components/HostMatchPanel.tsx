"use client";

import { useState } from "react";

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

export function HostMatchPanel() {
  const [groupSize, setGroupSize] = useState(4);
  const [rounds, setRounds] = useState(3);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadRosterAndOpen() {
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const res = await fetch("/api/members?admin=1", { credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || (res.status === 401 ? "請先主辦登入" : "讀取名單失敗"));
        return;
      }
      const members = (data.members || []) as Member[];
      if (members.length < 2) {
        setError("名單至少兩人才能媒合，請先匯入或請會員登錄資料。");
        return;
      }
      const roster = members.map((m) => ({
        id: "db" + m.id,
        name: m.name,
        company: m.company || "",
        industry: m.industry || "",
        chain: m.chain || "",
        chapter: m.chapter || "",
        role: m.role || "",
        have: m.have || "",
        want: m.want || "",
      }));
      localStorage.setItem("bni-match-roster-v1", JSON.stringify(roster));
      localStorage.removeItem("bni-match-plan-v1");
      localStorage.setItem(
        "bni-match-host-settings-v1",
        JSON.stringify({ groupSize, rounds, at: Date.now() }),
      );
      setStatus(`已帶入 ${roster.length} 人，正在打開媒合台…`);
      window.location.href = `/match/match.html#host`;
    } catch {
      setError("無法載入名單");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <p className="kicker">媒合設定</p>
      <h2>現場分組</h2>
      <p className="hint">
        只有主辦登入後才能使用。會把資料庫名單帶進同站的媒合台（每組人數、輪數可先設定）。
      </p>
      {status ? <p className="status">{status}</p> : null}
      {error ? <p className="status error">{error}</p> : null}
      <div className="grid two">
        <label className="field">
          每組人數
          <input
            type="number"
            min={2}
            max={12}
            value={groupSize}
            onChange={(e) => setGroupSize(Number(e.target.value) || 4)}
          />
        </label>
        <label className="field">
          輪數
          <input
            type="number"
            min={1}
            max={8}
            value={rounds}
            onChange={(e) => setRounds(Number(e.target.value) || 3)}
          />
        </label>
      </div>
      <div className="actions">
        <button className="primary" type="button" disabled={busy} onClick={loadRosterAndOpen}>
          {busy ? "準備中…" : "載入名單並打開媒合台"}
        </button>
        <a className="secondary" href="/match/match.html#host" style={{ textDecoration: "none" }}>
          只打開媒合台（用本機既有名單）
        </a>
      </div>
    </section>
  );
}
