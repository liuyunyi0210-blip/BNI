"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useState } from "react";

type HostStatus = {
  host: boolean;
  signedIn: boolean;
  name?: string;
  email?: string;
  emailVerified?: boolean;
  visibility?: string;
  needsCursorLogin?: boolean;
  canUsePin?: boolean;
  pinConfigured?: boolean;
  via?: string;
  reason?: string;
};

export function HostGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<HostStatus | null>(null);
  const [error, setError] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch("/api/host", { credentials: "same-origin" });
    if (!res.ok) throw new Error("無法確認登入狀態");
    const data = (await res.json()) as HostStatus;
    setStatus(data);
  }

  useEffect(() => {
    refresh().catch((err: Error) => setError(err.message || "無法確認登入狀態"));
  }, []);

  async function onPinLogin(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/host/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "登入失敗");
        return;
      }
      setPin("");
      await refresh();
    } catch {
      setError("登入時發生錯誤");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/host/login", { method: "DELETE", credentials: "same-origin" });
    await refresh();
  }

  if (error && !status) {
    return <p className="status error">{error}</p>;
  }

  if (!status) {
    return <p className="panel hint">正在確認主辦登入狀態…</p>;
  }

  if (status.host) {
    return (
      <div className="grid">
        <p className="callout">
          已以主辦身分登入
          {status.via === "pin" ? "（主辦密碼）" : status.name || status.email ? `（${status.name || status.email}）` : ""}
          。
          {status.via === "pin" ? (
            <>
              {" "}
              <button className="text-btn" type="button" onClick={logout}>
                登出
              </button>
            </>
          ) : null}
        </p>
        {children}
      </div>
    );
  }

  return (
    <section className="panel">
      <p className="kicker">主辦登入</p>
      <h2>請先登入主辦</h2>
      {error ? <p className="status error">{error}</p> : null}

      {status.canUsePin || status.pinConfigured ? (
        <form onSubmit={onPinLogin} style={{ marginTop: 12 }}>
          <label className="field">
            主辦密碼
            <input
              type="password"
              autoComplete="current-password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="輸入主辦密碼"
              required
            />
          </label>
          <div className="actions">
            <button className="primary" type="submit" disabled={busy}>
              {busy ? "登入中…" : "主辦登入"}
            </button>
          </div>
        </form>
      ) : (
        <>
          <p>
            尚未設定主辦密碼時，請把 App 改成 <strong>Private</strong>／<strong>Team</strong>，用主辦 Cursor
            帳號開啟；或在 Secrets 新增 HOST_PIN 後即可在此輸入密碼登入。
          </p>
          <div className="actions" style={{ marginTop: 14 }}>
            <button className="primary" type="button" onClick={() => window.location.reload()}>
              重新整理
            </button>
          </div>
        </>
      )}

      <p className="hint" style={{ marginTop: 16 }}>
        訪客前台不必登入；只有後台與媒合設定需要主辦身分。
      </p>
      <div className="actions">
        <Link className="secondary" href="/" style={{ textDecoration: "none" }}>
          回訪客前台
        </Link>
      </div>
    </section>
  );
}
