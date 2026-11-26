import { HostGate } from "../../../components/HostGate";
import { ImportPanel } from "../../../components/ImportPanel";
import { SiteNav } from "../../../components/SiteNav";

export default function ImportPage() {
  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="mark">BNI</p>
          <h1>匯入名單</h1>
          <p className="sub">僅主辦可匯入。請先點右上「主辦登入」。</p>
        </div>
        <SiteNav current="import" />
      </header>
      <HostGate>
        <ImportPanel />
      </HostGate>
    </main>
  );
}
