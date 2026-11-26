import Link from "next/link";

export function SiteNav({ current }: { current: "home" | "admin" | "import" }) {
  return (
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
  );
}
