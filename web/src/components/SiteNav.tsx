import Link from "next/link";

export function SiteNav({ current }: { current: "home" | "admin" | "import" }) {
  return (
    <div className="actions" style={{ gap: 10 }}>
      <nav className="nav" aria-label="主要選單">
        <Link href="/" aria-current={current === "home" ? "page" : undefined}>
          前台名單
        </Link>
        <Link href="/admin" aria-current={current === "admin" ? "page" : undefined}>
          後台管理
        </Link>
        <Link href="/admin/import" aria-current={current === "import" ? "page" : undefined}>
          匯入名單
        </Link>
      </nav>
      <Link
        href="/admin"
        className="primary"
        style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
      >
        主辦登入
      </Link>
    </div>
  );
}
