import { AdminMembers } from "../../../components/AdminMembers";
import { HostGate } from "../../../components/HostGate";
import { HostNav } from "../../../components/HostNav";

export default function HostMembersPage() {
  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="mark">BNI · 主辦</p>
          <h1>會員管理</h1>
          <p className="sub">登入後才能使用。</p>
        </div>
        <HostNav current="members" />
      </header>
      <HostGate>
        <AdminMembers />
      </HostGate>
    </main>
  );
}
