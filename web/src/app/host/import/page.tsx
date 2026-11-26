import { HostGate } from "../../../components/HostGate";
import { HostNav } from "../../../components/HostNav";
import { ImportPanel } from "../../../components/ImportPanel";

export default function HostImportPage() {
  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="mark">BNI · 主辦</p>
          <h1>匯入名單</h1>
          <p className="sub">登入後才能匯入。</p>
        </div>
        <HostNav current="import" />
      </header>
      <HostGate>
        <ImportPanel />
      </HostGate>
    </main>
  );
}
