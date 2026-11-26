import { ImportPanel } from "../../../components/ImportPanel";
import { SiteNav } from "../../../components/SiteNav";

export default function ImportPage() {
  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="mark">BNI</p>
          <h1>匯入名單</h1>
          <p className="sub">下載範本或大芯現有名單，補資料後上傳。</p>
        </div>
        <SiteNav current="import" />
      </header>
      <ImportPanel />
    </main>
  );
}
