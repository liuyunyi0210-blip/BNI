import { AdminMembers } from "../../components/AdminMembers";
import { SiteNav } from "../../components/SiteNav";

export default function AdminPage() {
  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="mark">BNI</p>
          <h1>後台管理</h1>
          <p className="sub">新增、編輯、停用會員，或匯出 CSV。</p>
        </div>
        <SiteNav current="admin" />
      </header>
      <AdminMembers />
    </main>
  );
}
