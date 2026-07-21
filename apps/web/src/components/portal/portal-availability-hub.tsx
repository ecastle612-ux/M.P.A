"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@mpa/ui";
import type { UserRole } from "@mpa/shared";
import type { MasterAdminPortal } from "../../lib/master-admin/contracts";

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
  const router = useRouter();
  const [pendingPortal, setPendingPortal] = useState<MasterAdminPortal | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasTenant = availableRoles.includes("tenant");
  const hasVendor = availableRoles.includes("vendor");
  const hasOwner = availableRoles.includes("property_owner");
  const hasManager = availableRoles.includes("property_manager");

  const cards: PortalCard[] = [
    {
      id: "resident",
      title: "Resident Portal",
      description: hasTenant
        ? "Open your resident experience for maintenance, payments, and announcements."
        : isMasterAdmin
          ? "Master Admin Test Mode — enter without a linked tenancy."
          : "Available to residents with a linked tenancy.",
      available: hasTenant || Boolean(isMasterAdmin),
      roleHint: "Tenant role",
      ...(hasTenant ? { href: "/portal/tenant" } : {})
    },
    {
      id: "vendor",
      title: "Vendor Portal",
      description: hasVendor
        ? "Open assigned work and completion updates."
        : isMasterAdmin
          ? "Master Admin Test Mode — enter without vendor assignments."
          : "Available to vendors with active assignments.",
      available: hasVendor || Boolean(isMasterAdmin),
      roleHint: "Vendor role",
      ...(hasVendor ? { href: "/portal/vendor" } : {})
    },
    {
      id: "owner",
      title: "Owner Portal",
      description: isMasterAdmin
        ? "Master Admin Test Mode — preview owner portal with demo portfolio data."
        : hasOwner
          ? "Open owner portfolio views."
          : "This feature will become available during a future release.",
      available: hasOwner || Boolean(isMasterAdmin),
      roleHint: hasOwner ? "Owner role" : "Future release",
      ...(hasOwner ? { href: "/portal/owner" } : {})
    },
    {
      id: "manager",
      title: "Manager Portal",
      description: isMasterAdmin
        ? "Master Admin Test Mode — preview manager portal shell (Operations remains primary)."
        : hasManager
          ? "Open the manager portal shell."
          : "Property managers use the main Operations workspace today. A dedicated manager portal will become available during a future release.",
      available: hasManager || Boolean(isMasterAdmin),
      roleHint: hasManager ? "Manager role" : "Future release",
      ...(hasManager ? { href: "/portal/manager" } : {})
    }
  ];

  async function openMasterAdminPortal(portal: MasterAdminPortal) {
    setError(null);
    setPendingPortal(portal);
    try {
      const response = await fetch("/api/master-admin/portal-test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ portal })
      });
      const payload = (await response.json().catch(() => null)) as
        | { redirectTo?: string; message?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to open portal test mode.");
      }
      router.push(payload?.redirectTo ?? "/portal");
      router.refresh();
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : "Unable to open portal.");
    } finally {
      setPendingPortal(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Portals
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--mpa-color-text-secondary)]">
          {isMasterAdmin
            ? "Master Admin can open every portal in Test Mode without linked tenancy or assignments."
            : "Only finished portal experiences are available. Unfinished portals are gated so Design Partners never hit a dead end."}{" "}
          Active role: {defaultRole.replaceAll("_", " ")}.
        </p>
      </div>

      {error ? <p className="text-sm text-[var(--mpa-color-status-danger)]">{error}</p> : null}

      <div className="grid gap-3 md:grid-cols-2">
        {cards.map((card) => {
          const label =
            card.id === "resident"
              ? "Open Resident Portal"
              : card.id === "vendor"
                ? "Open Vendor Portal"
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
                  {card.available ? (isMasterAdmin && !card.href ? "Test Mode" : "Available") : card.roleHint}
                </span>
              </div>
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">{card.description}</p>
              {card.available && card.href && !isMasterAdmin ? (
                <a href={card.href}>
                  <Button type="button">Open portal</Button>
                </a>
              ) : null}
              {card.available && isMasterAdmin ? (
                <Button
                  type="button"
                  disabled={pendingPortal === card.id}
                  onClick={() => void openMasterAdminPortal(card.id)}
                >
                  {pendingPortal === card.id ? "Opening…" : label}
                </Button>
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
