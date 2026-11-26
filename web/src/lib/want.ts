/** 想要的資源拆成「業務人脈」「目標客戶」兩欄，合併存進既有 want 欄位。 */

const NETWORK_LABEL = "業務人脈";
const CLIENTS_LABEL = "目標客戶";

export function packWant(network: string, clients: string): string {
  const parts: string[] = [];
  const n = String(network || "").replace(/\s+/g, " ").trim().slice(0, 200);
  const c = String(clients || "").replace(/\s+/g, " ").trim().slice(0, 200);
  if (n) parts.push(`${NETWORK_LABEL}：${n}`);
  if (c) parts.push(`${CLIENTS_LABEL}：${c}`);
  return parts.join("\n");
}

export function unpackWant(want: string): { network: string; clients: string } {
  const text = String(want || "").trim();
  if (!text) return { network: "", clients: "" };

  let network = "";
  let clients = "";
  const lines = text.split(/\n+/);
  const leftover: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const net = trimmed.match(/^(?:業務人脈|人脈)\s*[:：]\s*(.*)$/);
    if (net) {
      network = [network, net[1].trim()].filter(Boolean).join("；");
      continue;
    }
    const cli = trimmed.match(/^(?:目標客戶|客戶)\s*[:：]\s*(.*)$/);
    if (cli) {
      clients = [clients, cli[1].trim()].filter(Boolean).join("；");
      continue;
    }
    if (trimmed) leftover.push(trimmed);
  }

  if (!network && !clients && leftover.length) {
    network = leftover.join("\n");
  } else if (leftover.length) {
    network = [network, ...leftover].filter(Boolean).join("\n");
  }

  return { network, clients };
}

export function formatWantDisplay(want: string): string {
  const { network, clients } = unpackWant(want);
  const parts: string[] = [];
  if (network) parts.push(`${NETWORK_LABEL}：${network}`);
  if (clients) parts.push(`${CLIENTS_LABEL}：${clients}`);
  return parts.join("｜") || want || "未填";
}
