import { MemberDirectory } from "../components/MemberDirectory";
import { SiteNav } from "../components/SiteNav";

export default function HomePage() {
  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="mark">BNI</p>
          <h1>會員名單</h1>
          <p className="sub">訪客可搜尋公開資源資料；只有主辦登入後才能進後台維護。</p>
        </div>
        <SiteNav current="home" />
      </header>
      <MemberDirectory />
      <p className="hint" style={{ marginTop: 18 }}>
        自己的組別與媒合結果，請用現場結果碼／回饋碼打開（不必登入）：
        <a href="https://liuyunyi0210-blip.github.io/BNI/match.html" target="_blank" rel="noreferrer">
          現場媒合
        </a>
        。
      </p>
    </main>
  );
}
