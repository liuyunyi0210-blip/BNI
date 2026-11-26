"use client";

import { FormEvent, useEffect, useState } from "react";
import { CHAPTERS } from "../lib/constants";
import { packWant } from "../lib/want";
import { ChainSelect } from "./ChainSelect";
import { RoleSelect } from "./RoleSelect";

const EDIT_TOKEN_KEY = "bni-submission-edit-token-v1";
const ME_KEY = "bni-match-me-v1";

const empty = {
  name: "",
  chapter: "大芯",
  role: "",
  company: "",
  industry: "",
  chain: "",
  have: "",
  wantNetwork: "",
  wantClients: "",
};

export function RegisterForm() {
  const [form, setForm] = useState(empty);
  const [editToken, setEditToken] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem(EDIT_TOKEN_KEY) || "";
      if (token) setEditToken(token);
      const me = JSON.parse(localStorage.getItem(ME_KEY) || "null");
      if (me && typeof me === "object") {
        setForm((prev) => ({
          ...prev,
          name: typeof me.name === "string" ? me.name : prev.name,
          chapter: typeof me.chapter === "string" ? me.chapter : prev.chapter,
        }));
      }
    } catch {
      /* ignore */
    }
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setStatus("");
    const want = packWant(form.wantNetwork, form.wantClients);
    if (!want) {
      setError("請至少填「業務人脈」或「目標客戶」其中一項");
      setBusy(false);
      return;
    }
    try {
      const res = await fetch("/api/members/self", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          chapter: form.chapter,
          role: form.role,
          company: form.company,
          industry: form.industry,
          chain: form.chain,
          have: form.have,
          want,
          editToken: editToken || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "儲存失敗");
        return;
      }
      setStatus(data.message || `已送出 ${data.member?.name || ""} 的申請，待主辦核准。`);
      try {
        if (data.editToken) {
          localStorage.setItem(EDIT_TOKEN_KEY, data.editToken);
          setEditToken(data.editToken);
        }
        localStorage.setItem(
          ME_KEY,
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
      <p className="hint">不必登入。送出後進入待審，主辦核准才會進正式名單與現場媒合。同一裝置可再次送出更新自己的待審申請。</p>
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
        <label className="field" style={{ gridColumn: "1 / -1" }}>
          行業別
          <input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
        </label>
        <ChainSelect value={form.chain} onChange={(chain) => setForm({ ...form, chain })} />
        <label className="field" style={{ gridColumn: "1 / -1" }}>
          我有的資源*
          <textarea
            required
            value={form.have}
            onChange={(e) => setForm({ ...form, have: e.target.value })}
            placeholder="例如：能介紹裝修案源、企業系統導入經驗"
          />
        </label>
        <div className="want-pair">
          <label className="field">
            想要的資源 · 業務人脈
            <textarea
              value={form.wantNetwork}
              onChange={(e) => setForm({ ...form, wantNetwork: e.target.value })}
              placeholder="想認識哪些同行／合作夥伴"
            />
          </label>
          <label className="field">
            想要的資源 · 目標客戶
            <textarea
              value={form.wantClients}
              onChange={(e) => setForm({ ...form, wantClients: e.target.value })}
              placeholder="想接觸哪類客戶或案源"
            />
          </label>
        </div>
        <p className="hint" style={{ gridColumn: "1 / -1", marginTop: -4 }}>
          「業務人脈」與「目標客戶」至少填一項。
        </p>
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
