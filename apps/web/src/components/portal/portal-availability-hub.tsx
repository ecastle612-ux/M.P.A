"use client";

import { Button, Card } from "@mpa/ui";
import type { UserRole } from "@mpa/shared";
import type { MasterAdminPortal } from "../../lib/master-admin/contracts";
import { PortalLauncher } from "../master-admin/portal-launcher";

type PortalCard = {
  id: MasterAdminPortal;
  title: string;
  description: string;
  href?: string;
  available: boolean;
  roleHint: string;
};

export function PortalAvailabilityHub({
  availableRoles,
  defaultRole,
  isMasterAdmin
}: {
  availableRoles: UserRole[];
  defaultRole: UserRole;
  isMasterAdmin?: boolean;
}) {
  if (isMasterAdmin) {
    return (
      <PortalLauncher
        title="Portal Launcher"
        description="Master Admin can open every role and dashboard. Use Open Portal for the live surface, View As for Impersonation Center, and Launch in Test Mode where portal Test Mode is supported — production permissions stay unchanged."
      />
    );
  }

  const hasTenant = availableRoles.includes("tenant");
  const hasOwner = availableRoles.includes("property_owner");
  const hasManager = availableRoles.includes("property_manager");

  const cards: PortalCard[] = [
    {
      id: "resident",
      title: "Resident Portal",
      description: hasTenant
        ? "Open your resident experience for maintenance, payments, and announcements."
        : "Available to residents with a linked tenancy.",
      available: hasTenant,
      roleHint: "Tenant role",
      ...(hasTenant ? { href: "/portal/tenant" } : {})
    },
    {
      id: "owner",
      title: "Owner Portal",
      description: hasOwner
        ? "Open your owner portfolio, financials, documents, and messages."
        : "Available when you have the Property Owner role.",
      available: hasOwner,
      roleHint: "Owner role",
      ...(hasOwner ? { href: "/portal/owner" } : {})
    },
    {
      id: "manager",
      title: "Manager Portal",
      description: hasManager
        ? "Open the manager portal shell."
        : "Property managers use the main Operations workspace today. A dedicated manager portal will become available during a future release.",
      available: hasManager,
      roleHint: hasManager ? "Manager role" : "Future release",
      ...(hasManager ? { href: "/portal/manager" } : {})
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Portals
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--mpa-color-text-secondary)]">
          Only finished portal experiences are available. Unfinished portals are gated so Design
          Partners never hit a dead end. Vendors use secure action links — there is no Vendor Portal.
          Active role: {defaultRole.replaceAll("_", " ")}.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {cards.map((card) => {
          const label =
            card.id === "resident"
              ? "Open Resident Portal"
              : card.id === "owner"
                ? "Open Owner Portal"
                : "Open Manager Portal";

          return (
            <Card key={card.id} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
                  {card.title}
                </h2>
                <span className="rounded-md bg-[var(--mpa-color-surface-muted)] px-2 py-1 text-xs font-medium text-[var(--mpa-color-text-secondary)]">
                  {card.available ? "Available" : card.roleHint}
                </span>
              </div>
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">{card.description}</p>
              {card.available && card.href ? (
                <a href={card.href}>
                  <Button type="button">{label}</Button>
                </a>
              ) : null}
              {!card.available ? (
                <a href="/dashboard">
                  <Button type="button" variant="secondary">
                    Return to Operations Center
                  </Button>
                </a>
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
