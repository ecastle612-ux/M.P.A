"use client";

import { Select } from "@mpa/ui";
import { isUserRole, toRoleLabel } from "@mpa/shared";
import { useRoleContext } from "./role-context";

export function RoleSwitcher() {
  const { availableRoles, activeRole, setActiveRole } = useRoleContext();

  return (
    <label className="inline-flex min-h-9 items-center gap-2 text-xs font-medium text-[var(--mpa-color-text-secondary)] sm:text-sm">
      <span className="hidden sm:inline">Role</span>
      <Select
        aria-label="Active role"
        className="w-36 sm:w-44"
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
