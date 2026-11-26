import { HostGate } from "../../../components/HostGate";
import { HostMatchPanel } from "../../../components/HostMatchPanel";
import { HostNav } from "../../../components/HostNav";

export default function HostMatchPage() {
  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="mark">BNI · 主辦</p>
          <h1>媒合設定</h1>
          <p className="sub">登入後才能帶入名單並開始現場分組。</p>
        </div>
        <HostNav current="match" />
      </header>
      <HostGate>
        <HostMatchPanel />
      </HostGate>
    </main>
  );
}
