"use client";

import { CHAINS } from "../lib/constants";

function parseChains(value: string): string[] {
  return String(value || "")
    .split(/[、,，/\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function shortLabel(name: string): string {
  return name.replace(/產業鏈$/, "");
}

export function ChainSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const selected = new Set(parseChains(value));
  const extras = parseChains(value).filter((name) => !(CHAINS as readonly string[]).includes(name));

  function toggle(name: string) {
    const next = new Set(selected);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    const ordered = [
      ...CHAINS.filter((item) => next.has(item)),
      ...extras.filter((item) => next.has(item)),
    ];
    onChange(ordered.join("、"));
  }

  return (
    <fieldset className="field chains">
      <legend>產業鏈（可多選）</legend>
      <div className="chip-grid">
        {extras.map((name) => (
          <label key={`extra-${name}`} className="chip">
            <input type="checkbox" checked={selected.has(name)} onChange={() => toggle(name)} />
            <span>{shortLabel(name)}（原資料）</span>
          </label>
        ))}
        {CHAINS.map((name) => (
          <label key={name} className="chip">
            <input type="checkbox" checked={selected.has(name)} onChange={() => toggle(name)} />
            <span>{shortLabel(name)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
