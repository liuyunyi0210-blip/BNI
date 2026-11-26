import Link from "next/link";
import { MemberDirectory } from "../components/MemberDirectory";
import { PublicNav } from "../components/PublicNav";

export default function HomePage() {
  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="mark">BNI</p>
          <h1>現場媒合 · 公開區</h1>
          <p className="sub">未登入可看公開名單、登錄自己的媒合資料，並打開自己的組別。</p>
        </div>
        <PublicNav current="home" />
      </header>

      <section className="choices" style={{ display: "grid", gap: 12, marginBottom: 16 }}>
        <Link className="panel" href="/register" style={{ textDecoration: "none", color: "inherit" }}>
          <p className="kicker">會員</p>
          <h2 style={{ marginTop: 0 }}>登錄媒合資料</h2>
          <p className="hint">填姓名、分會、有的／想要的資源，給主持排組用。</p>
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
      </section>

      <MemberDirectory />
    </main>
  );
}
