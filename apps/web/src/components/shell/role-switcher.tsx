"use client";

import { Select } from "@mpa/ui";
import { isUserRole, toRoleLabel } from "@mpa/shared";
import { useRoleContext } from "./role-context";

export function RoleSwitcher({ compact = false }: { compact?: boolean }) {
  const { availableRoles, activeRole, setActiveRole } = useRoleContext();

  return (
    <label
      className={[
        "inline-flex items-center gap-2 text-sm text-[var(--mpa-color-text-secondary)]",
        compact ? "w-full" : ""
      ].join(" ")}
    >
      <span className={compact ? "w-24 shrink-0" : ""}>Role</span>
      <Select
        aria-label="Active role"
        className={compact ? "w-full" : "w-44"}
        value={activeRole}
        onChange={(event) => {
          const nextRole = event.target.value;
          if (isUserRole(nextRole)) {
            setActiveRole(nextRole);
          }
        }}
      >
        {availableRoles.map((role) => (
          <option key={role} value={role}>
            {toRoleLabel(role)}
          </option>
        ))}
      </Select>
    </label>
  );
}
