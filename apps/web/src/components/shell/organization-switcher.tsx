"use client";

import { Select } from "@mpa/ui";
import { useOrganizationContext } from "./organization-context";

export function OrganizationSwitcher() {
  const { organizations, activeOrganizationId, setActiveOrganization } = useOrganizationContext();

  return (
    <label className="inline-flex min-h-9 items-center gap-2 text-xs font-medium text-[var(--mpa-color-text-secondary)] sm:text-sm">
      <span className="hidden sm:inline">Organization</span>
      <Select
        aria-label="Active organization"
        className="w-40 sm:w-52"
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
