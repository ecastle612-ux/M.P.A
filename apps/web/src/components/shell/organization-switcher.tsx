"use client";

import { Select } from "@mpa/ui";
import { useOrganizationContext } from "./organization-context";

export function OrganizationSwitcher() {
  const { organizations, activeOrganizationId, setActiveOrganization } = useOrganizationContext();

  return (
    <label className="inline-flex items-center gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
      Organization
      <Select
        aria-label="Active organization"
        className="w-64"
        value={activeOrganizationId ?? ""}
        onChange={(event) => {
          void setActiveOrganization(event.target.value).catch(() => {
            // Keep prior selection; server cookie unchanged on failure.
          });
        }}
        disabled={organizations.length === 0}
      >
        {organizations.length === 0 ? <option value="">No organizations yet</option> : null}
        {organizations.map((organization) => (
          <option key={organization.id} value={organization.id}>
            {organization.name}
            {organization.productLabel ? ` · ${organization.productLabel}` : " · No product"}
          </option>
        ))}
      </Select>
    </label>
  );
}
