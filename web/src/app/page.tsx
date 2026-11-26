import { MemberDirectory } from "../components/MemberDirectory";
import { SiteNav } from "../components/SiteNav";

export default function HomePage() {
  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="mark">BNI</p>
          <h1>會員名單</h1>
          <p className="sub">前台可搜尋分會會員與資源；後台可維護與匯入。</p>
        </div>
        <SiteNav current="home" />
      </header>
      <MemberDirectory />
      <p className="hint" style={{ marginTop: 18 }}>
        現場媒合投影與回饋碼仍可用現有頁面：
        <a href="https://liuyunyi0210-blip.github.io/BNI/match.html" target="_blank" rel="noreferrer">
          match.html
        </a>
        。之後可把名單從資料庫一鍵帶入媒合。
      </p>
    </main>
  );
}
