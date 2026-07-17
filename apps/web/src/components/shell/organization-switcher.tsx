"use client";

import { Select } from "@mpa/ui";
import { formatHumanOrganizationName } from "../../lib/format/display-labels";
import { useOrganizationContext } from "./organization-context";

function truncateOrgName(name: string, max = 32): string {
  const human = formatHumanOrganizationName(name);
  return human.length > max ? `${human.slice(0, max - 1)}…` : human;
}

export function OrganizationSwitcher({ compact = false }: { compact?: boolean }) {
  const { organizations, activeOrganizationId, setActiveOrganization } = useOrganizationContext();
  const activeOrg = organizations.find((org) => org.id === activeOrganizationId);

  return (
    <div className={compact ? "w-full space-y-1" : "hidden min-w-0 xl:block"}>
      {!compact ? (
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--mpa-color-text-muted)]">
          Organization
        </p>
      ) : null}
      <Select
        aria-label="Active organization"
        className={compact ? "w-full" : "h-9 min-w-[12rem] max-w-[16rem] text-sm"}
        value={activeOrganizationId ?? ""}
        onChange={(event) => {
          void setActiveOrganization(event.target.value);
        }}
        disabled={organizations.length === 0}
        title={activeOrg ? formatHumanOrganizationName(activeOrg.name) : undefined}
      >
        {organizations.length === 0 ? <option value="">No organizations</option> : null}
        {organizations.map((organization) => (
          <option key={organization.id} value={organization.id}>
            {truncateOrgName(organization.name)}
          </option>
        ))}
      </Select>
    </div>
  );
}
