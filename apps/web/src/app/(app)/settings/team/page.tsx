"use client";

import {
  productWorkspaceNavHref,
  productWorkspaceNavLabel
} from "@mpa/shared";
import { Breadcrumbs } from "../../../../components/shell/breadcrumbs";
import { TeamInvitePanel } from "../../../../components/team/team-invite-panel";
import { useCommercialContext } from "../../../../components/shell/commercial-context";

export default function TeamSettingsPage() {
  const { productSku, productLabel } = useCommercialContext();
  const workspaceLabel = productWorkspaceNavLabel(productSku);
  const workspaceHref = productWorkspaceNavHref(productSku);
  const isFo = productSku === "mpa_facility_operations";

  return (
    <main className="flex-1 space-y-6 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs
        items={[
          { href: workspaceHref, label: workspaceLabel },
          { href: "/settings/organization", label: "Settings" },
          { label: "Team" }
        ]}
      />
      <header className="max-w-2xl space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          {productLabel ?? "Organization"} · Build your team
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
          {isFo ? "Invite Facility Operations users" : "Invite users"}
        </h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          {isFo
            ? "Invite technicians and facility teammates into your Facility Operations organization — without admin assistance."
            : "Invite teammates, assign a role, and get everyone into the correct workspace — without admin assistance."}
        </p>
      </header>
      <TeamInvitePanel key={productSku ?? "none"} />
    </main>
  );
}
