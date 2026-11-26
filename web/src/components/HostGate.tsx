"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";

type HostStatus = {
  host: boolean;
  signedIn: boolean;
  name?: string;
  email?: string;
  emailVerified?: boolean;
  visibility?: string;
  needsCursorLogin?: boolean;
  reason?: string;
};

export function HostGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<HostStatus | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/host")
      .then(async (res) => {
        if (!res.ok) throw new Error("無法確認登入狀態");
        return res.json();
      })
      .then((data: HostStatus) => setStatus(data))
      .catch((err: Error) => setError(err.message || "無法確認登入狀態"));
  }, []);

  if (error) {
    return <p className="status error">{error}</p>;
  }

  if (!status) {
    return <p className="panel hint">正在確認主辦登入狀態…</p>;
  }

  if (status.host) {
    return (
      <div className="grid">
        <p className="callout">
          已以主辦身分登入{status.name || status.email ? `（${status.name || status.email}）` : ""}。
        </p>
        {children}
      </div>
    );
  }

  return (
    <section className="panel">
      <p className="kicker">主辦登入</p>
      <h2>還沒有主辦身分</h2>
      {!status.signedIn ? (
        <>
          <p>
            這個 App 目前若是 <strong>Public</strong>，訪客不會經過 Cursor 登入，後台也就認不出主辦。
          </p>
          <p className="hint">
            請到 Cursor 的 Publish Settings，把誰可以開啟改成 <strong>Private</strong>（只有你）或{" "}
            <strong>Team</strong>（團隊），再用主辦 Cursor 帳號重新打開這個網址。平台會先要求登入，之後點「主辦登入」即可進後台。
          </p>
        </>
      ) : (
        <>
          <p>
            已登入{status.email ? `（${status.email}）` : ""}，但不是主辦白名單或 team admin。
          </p>
          <p className="hint">
            請確認密鑰 HOST_EMAILS 含有這個信箱；若是 Team App，需為 team admin。
            {status.emailVerified === false ? " 另外此信箱尚未通過驗證。" : ""}
          </p>
        </>
      )}
      <div className="actions" style={{ marginTop: 14 }}>
        <button className="primary" type="button" onClick={() => window.location.reload()}>
          我已改設定／已登入，重新整理
        </button>
        <Link className="secondary" href="/" style={{ textDecoration: "none" }}>
          回前台名單
        </Link>
      </div>
    </section>
  );
}
