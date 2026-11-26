import Link from "next/link";
import { HostGate } from "../../components/HostGate";
import { HostNav } from "../../components/HostNav";

export default function HostHomePage() {
  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="mark">BNI · 主辦</p>
          <h1>主辦入口</h1>
          <p className="sub">登入後才能管理名單、匯入與媒合設定。</p>
        </div>
        <HostNav current="home" />
      </header>
      <HostGate>
        <div className="grid two">
          <Link className="panel" href="/host/members" style={{ textDecoration: "none", color: "inherit" }}>
            <p className="kicker">後台</p>
            <h2 style={{ marginTop: 0 }}>會員管理</h2>
            <p className="hint">新增、編輯、停用、匯出。</p>
          </Link>
          <Link className="panel" href="/host/import" style={{ textDecoration: "none", color: "inherit" }}>
            <p className="kicker">後台</p>
            <h2 style={{ marginTop: 0 }}>匯入名單</h2>
            <p className="hint">上傳 CSV 批次匯入。</p>
          </Link>
          <Link className="panel" href="/host/match" style={{ textDecoration: "none", color: "inherit" }}>
            <p className="kicker">現場</p>
            <h2 style={{ marginTop: 0 }}>媒合設定</h2>
            <p className="hint">設定每組人數／輪數，載入名單打開媒合台。</p>
          </Link>
        </div>
      </HostGate>
    </main>
  );
}
