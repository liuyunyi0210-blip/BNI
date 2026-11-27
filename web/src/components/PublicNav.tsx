import Link from "next/link";

export function PublicNav({ current }: { current: "home" | "register" | "match" }) {
  return (
    <div className="actions" style={{ gap: 10 }}>
      <nav className="nav" aria-label="訪客選單">
        <Link href="/" aria-current={current === "home" ? "page" : undefined}>
          訪客首頁
        </Link>
        <Link href="/register" aria-current={current === "register" ? "page" : undefined}>
          登錄媒合資料
        </Link>
        <Link href="/match/match.html" aria-current={current === "match" ? "page" : undefined}>
          我的組別
        </Link>
      </nav>
      <Link
        href="/host"
        className="secondary"
        style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
      >
        主辦入口
      </Link>
    </div>
  );
}
