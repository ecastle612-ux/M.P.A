"use client";

import { Select } from "@mpa/ui";
import { isUserRole, toRoleLabel } from "@mpa/shared";
import { useRoleContext } from "./role-context";

export function RoleSwitcher() {
  const { availableRoles, activeRole, setActiveRole } = useRoleContext();

  return (
    <label className="inline-flex items-center gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
      Role
      <Select
        aria-label="Active role"
        className="w-44"
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
