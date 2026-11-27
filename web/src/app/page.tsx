import Link from "next/link";
import { PublicNav } from "../components/PublicNav";

export default function HomePage() {
  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="mark">BNI</p>
          <h1>現場媒合 · 訪客區</h1>
          <p className="sub">未登入可登錄媒合資料、打開自己的組別；完整名冊僅主辦登入後可看。</p>
        </div>
        <PublicNav current="home" />
      </header>

      <section className="choices" style={{ display: "grid", gap: 12, marginBottom: 16 }}>
        <Link className="panel" href="/register" style={{ textDecoration: "none", color: "inherit" }}>
          <p className="kicker">會員</p>
          <h2 style={{ marginTop: 0 }}>登錄媒合資料</h2>
          <p className="hint">填姓名、分會、有的／想要的資源，送出後待主辦核准。</p>
        </Link>
        <Link
          className="panel"
          href="/match/match.html"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <p className="kicker">會員</p>
          <h2 style={{ marginTop: 0 }}>我的組別</h2>
          <p className="hint">用結果碼打開每一輪的桌子與同組夥伴。</p>
        </Link>
        <Link className="panel" href="/host" style={{ textDecoration: "none", color: "inherit" }}>
          <p className="kicker">主辦</p>
          <h2 style={{ marginTop: 0 }}>主辦入口</h2>
          <p className="hint">登入後管理名冊、待審申請與現場媒合設定。</p>
        </Link>
      </section>

      <p className="panel hint">
        為保護會員個資，公開網站不再提供整冊名單下載。主辦請到「主辦入口」查看與匯出。
      </p>
    </main>
  );
}
