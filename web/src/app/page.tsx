import { MemberDirectory } from "../components/MemberDirectory";
import { SiteNav } from "../components/SiteNav";

export default function HomePage() {
  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="mark">BNI</p>
          <h1>會員名單</h1>
          <p className="sub">公開名單免登入可查。主辦請點右上「主辦登入」進入後台（App 需設為 Private 或 Team）。</p>
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
