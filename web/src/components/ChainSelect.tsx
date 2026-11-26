"use client";

import { CHAIN_GROUPS, CHAINS } from "../lib/constants";

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
  const known = new Set(CHAINS as readonly string[]);
  const extras = parseChains(value).filter((name) => !known.has(name));
  const selectedCount = selected.size;

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
      <p className="chains-summary">
        {selectedCount ? `已選 ${selectedCount} 項` : "尚未選擇，可跨分類勾選"}
      </p>

      {extras.length ? (
        <div className="chain-group">
          <h3 className="chain-group-title">原資料</h3>
          <div className="chain-options">
            {extras.map((name) => (
              <label key={`extra-${name}`} className={`chain-option${selected.has(name) ? " is-on" : ""}`}>
                <input type="checkbox" checked={selected.has(name)} onChange={() => toggle(name)} />
                <span>{shortLabel(name)}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className="chain-groups">
        {CHAIN_GROUPS.map((group) => (
          <div key={group.id} className="chain-group">
            <h3 className="chain-group-title">{group.label}</h3>
            <div className="chain-options">
              {group.items.map((name) => (
                <label key={name} className={`chain-option${selected.has(name) ? " is-on" : ""}`}>
                  <input type="checkbox" checked={selected.has(name)} onChange={() => toggle(name)} />
                  <span>{shortLabel(name)}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
