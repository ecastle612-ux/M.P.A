"use client";

import { Select } from "@mpa/ui";
import { useOrganizationContext } from "./organization-context";

export function OrganizationSwitcher({ compact = false }: { compact?: boolean }) {
  const { organizations, activeOrganizationId, setActiveOrganization } = useOrganizationContext();

  return (
    <label
      className={[
        "inline-flex items-center gap-2 text-sm text-[var(--mpa-color-text-secondary)]",
        compact ? "w-full" : ""
      ].join(" ")}
    >
      <span className={compact ? "w-24 shrink-0" : ""}>Organization</span>
      <Select
        aria-label="Active organization"
        className={compact ? "w-full" : "w-52"}
        value={activeOrganizationId ?? ""}
        onChange={(event) => {
          void setActiveOrganization(event.target.value);
        }}
        disabled={organizations.length === 0}
      >
        {organizations.length === 0 ? <option value="">No organizations yet</option> : null}
        {organizations.map((organization) => (
          <option key={organization.id} value={organization.id}>
            {organization.name}
          </option>
        ))}
      </Select>
    </label>
  );
}
