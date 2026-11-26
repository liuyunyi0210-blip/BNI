"use client";

import { ROLE_OPTIONS } from "../lib/constants";

export function RoleSelect({
  value,
  onChange,
  id = "role",
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}) {
  const known = !value || (ROLE_OPTIONS as readonly string[]).includes(value);
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">未擔任／不填</option>
      {!known ? <option value={value}>{value}（原資料）</option> : null}
      {ROLE_OPTIONS.map((role) => (
        <option key={role} value={role}>
          {role}
        </option>
      ))}
    </select>
  );
}
