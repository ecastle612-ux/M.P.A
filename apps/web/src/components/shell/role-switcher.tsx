"use client";

import { Select } from "@mpa/ui";
import { isUserRole, toRoleLabel } from "@mpa/shared";
import { useRoleContext } from "./role-context";

export function RoleSwitcher({ compact = false }: { compact?: boolean }) {
  const { availableRoles, activeRole, setActiveRole } = useRoleContext();

  if (availableRoles.length === 0) {
    return null;
  }

  return (
    <div className={compact ? "w-full space-y-1" : "hidden min-w-0 xl:block"}>
      {!compact ? (
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--mpa-color-text-muted)]">Role</p>
      ) : null}
      <Select
        aria-label="Active role"
        className={compact ? "w-full" : "h-9 w-[10.5rem] text-sm"}
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
    </div>
  );
}
