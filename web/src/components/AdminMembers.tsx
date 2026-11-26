"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { CHAPTERS, ROLE_SUGGESTIONS } from "../lib/constants";

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
  phone: string;
  email: string;
  notes: string;
  active: boolean;
};

const emptyForm = {
  name: "",
  chapter: "大芯",
  role: "",
  company: "",
  industry: "",
  chain: "",
  have: "",
  want: "",
  phone: "",
  email: "",
  notes: "",
};

export function AdminMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/members?${params.toString()}`);
    if (!res.ok) throw new Error(res.status === 401 ? "請先登入" : "讀取失敗");
    const data = await res.json();
    setMembers(data.members || []);
  }, [q]);

  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
  }, [load]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setStatus("");
    const res = await fetch(editId ? `/api/members/${editId}` : "/api/members", {
      method: editId ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "儲存失敗");
      return;
    }
    setStatus(editId ? `已更新 ${data.member.name}` : `已新增 ${data.member.name}`);
    setForm(emptyForm);
    setEditId(null);
    await load();
  }

  function startEdit(member: Member) {
    setEditId(member.id);
    setForm({
      name: member.name,
      chapter: member.chapter || "大芯",
      role: member.role || "",
      company: member.company || "",
      industry: member.industry || "",
      chain: member.chain || "",
      have: member.have || "",
      want: member.want || "",
      phone: member.phone || "",
      email: member.email || "",
      notes: member.notes || "",
    });
  }

  async function removeMember(member: Member) {
    if (!window.confirm(`確定停用 ${member.name}？`)) return;
    const res = await fetch(`/api/members/${member.id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("停用失敗");
      return;
    }
    setStatus(`已停用 ${member.name}`);
    if (editId === member.id) {
      setEditId(null);
      setForm(emptyForm);
    }
    await load();
  }

  return (
    <div className="grid">
      {status ? <p className="status">{status}</p> : null}
      {error ? <p className="status error">{error}</p> : null}

      <section className="panel">
        <p className="kicker">後台</p>
        <h2>{editId ? "編輯會員" : "新增會員"}</h2>
        <form onSubmit={onSubmit} className="grid two">
          <label className="field">
            姓名*
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="field">
            分會
            <select
              value={form.chapter}
              onChange={(e) => setForm({ ...form, chapter: e.target.value })}
            >
              {CHAPTERS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            幹部職務
            <input
              list="role-suggestions"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
            <datalist id="role-suggestions">
              {ROLE_SUGGESTIONS.map((role) => (
                <option key={role} value={role} />
              ))}
            </datalist>
          </label>
          <label className="field">
            公司
            <input
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
          </label>
          <label className="field">
            行業別
            <input
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
            />
          </label>
          <label className="field">
            產業鏈
            <input
              value={form.chain}
              onChange={(e) => setForm({ ...form, chain: e.target.value })}
              placeholder="可填多個，用、分隔"
            />
          </label>
          <label className="field">
            我有的資源
            <textarea
              value={form.have}
              onChange={(e) => setForm({ ...form, have: e.target.value })}
            />
          </label>
          <label className="field">
            想要的資源
            <textarea
              value={form.want}
              onChange={(e) => setForm({ ...form, want: e.target.value })}
            />
          </label>
          <label className="field">
            電話
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label className="field">
            信箱
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            備註
            <input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>
          <div className="actions" style={{ gridColumn: "1 / -1" }}>
            <button className="primary" type="submit">
              {editId ? "儲存變更" : "新增"}
            </button>
            {editId ? (
              <button
                className="secondary"
                type="button"
                onClick={() => {
                  setEditId(null);
                  setForm(emptyForm);
                }}
              >
                取消編輯
              </button>
            ) : null}
            <a className="secondary" href="/api/members/export" style={{ textDecoration: "none" }}>
              匯出 CSV
            </a>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="actions" style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>會員列表（{members.length}）</h2>
          <label className="field" style={{ margin: 0, minWidth: 220 }}>
            搜尋
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="姓名／公司／資源" />
          </label>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>姓名</th>
                <th>分會／職務</th>
                <th>公司／行業</th>
                <th>資源</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <strong>{member.name}</strong>
                  </td>
                  <td>
                    {member.chapter || "—"}
                    {member.role ? ` · ${member.role}` : ""}
                  </td>
                  <td>
                    {member.company || "—"}
                    <div className="meta">{member.industry}</div>
                  </td>
                  <td>
                    <div className="meta">有：{member.have || "未填"}</div>
                    <div className="meta">要：{member.want || "未填"}</div>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="text-btn" type="button" onClick={() => startEdit(member)}>
                        編輯
                      </button>
                      <button className="text-btn" type="button" onClick={() => removeMember(member)}>
                        停用
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
