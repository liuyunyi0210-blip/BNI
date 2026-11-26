"use client";

import { FormEvent, useState } from "react";
import { CHAPTERS } from "../lib/constants";
import { RoleSelect } from "./RoleSelect";

const empty = {
  name: "",
  chapter: "大芯",
  role: "",
  company: "",
  industry: "",
  chain: "",
  have: "",
  want: "",
};

export function RegisterForm() {
  const [form, setForm] = useState(empty);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const res = await fetch("/api/members/self", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "儲存失敗");
        return;
      }
      setStatus(data.message || `已送出 ${data.member?.name || ""} 的申請，待主辦核准。`);
      try {
        localStorage.setItem(
          "bni-match-me-v1",
          JSON.stringify({ name: data.member.name, chapter: data.member.chapter }),
        );
      } catch {
        /* ignore */
      }
    } catch {
      setError("網路錯誤，請稍後再試");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <p className="kicker">訪客</p>
      <h2>登錄我的媒合資料</h2>
      <p className="hint">不必登入。送出後進入待審，主辦核准才會進正式名單與現場媒合。</p>
      {status ? <p className="status">{status}</p> : null}
      {error ? <p className="status error">{error}</p> : null}
      <form onSubmit={onSubmit} className="grid two">
        <label className="field">
          姓名*
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="field">
          分會*
          <select value={form.chapter} onChange={(e) => setForm({ ...form, chapter: e.target.value })}>
            {CHAPTERS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          幹部職務（選填）
          <RoleSelect value={form.role} onChange={(role) => setForm({ ...form, role })} />
        </label>
        <label className="field">
          公司
          <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        </label>
        <label className="field">
          行業別
          <input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
        </label>
        <label className="field">
          產業鏈
          <input
            value={form.chain}
            onChange={(e) => setForm({ ...form, chain: e.target.value })}
            placeholder="可多個，用、分隔"
          />
        </label>
        <label className="field">
          我有的資源*
          <textarea
            required
            value={form.have}
            onChange={(e) => setForm({ ...form, have: e.target.value })}
          />
        </label>
        <label className="field">
          想要的資源*
          <textarea
            required
            value={form.want}
            onChange={(e) => setForm({ ...form, want: e.target.value })}
          />
        </label>
        <div className="actions" style={{ gridColumn: "1 / -1" }}>
          <button className="primary" type="submit" disabled={busy}>
            {busy ? "送出中…" : "送出媒合資料"}
          </button>
          <a className="secondary" href="/match/match.html#member" style={{ textDecoration: "none" }}>
            打開媒合會員頁
          </a>
        </div>
      </form>
    </section>
  );
}
