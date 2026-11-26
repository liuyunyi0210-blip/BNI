import { AdminMembers } from "../../components/AdminMembers";
import { HostGate } from "../../components/HostGate";
import { SiteNav } from "../../components/SiteNav";

export default function AdminPage() {
  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="mark">BNI</p>
          <h1>後台管理</h1>
          <p className="sub">僅主辦可進入。請先點右上「主辦登入」。</p>
        </div>
        <SiteNav current="admin" />
      </header>
      <HostGate>
        <AdminMembers />
      </HostGate>
    </main>
  );
}
