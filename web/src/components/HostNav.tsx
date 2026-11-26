import Link from "next/link";

export function HostNav({ current }: { current: "home" | "members" | "import" | "match" }) {
  return (
    <div className="actions" style={{ gap: 10 }}>
      <nav className="nav" aria-label="主辦選單">
        <Link href="/host" aria-current={current === "home" ? "page" : undefined}>
          主辦首頁
        </Link>
        <Link href="/host/members" aria-current={current === "members" ? "page" : undefined}>
          會員管理
        </Link>
        <Link href="/host/import" aria-current={current === "import" ? "page" : undefined}>
          匯入名單
        </Link>
        <Link href="/host/match" aria-current={current === "match" ? "page" : undefined}>
          媒合設定
        </Link>
      </nav>
      <Link href="/" className="text-btn" style={{ textDecoration: "none" }}>
        回訪客前台
      </Link>
    </div>
  );
}
