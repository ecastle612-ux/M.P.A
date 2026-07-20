import Link from "next/link";
import { Button, Card } from "@mpa/ui";
import type { UserRole } from "@mpa/shared";

type PortalCard = {
  id: string;
  title: string;
  description: string;
  href?: string;
  available: boolean;
  roleHint: string;
};

export function PortalAvailabilityHub({
  availableRoles,
  defaultRole
}: {
  availableRoles: UserRole[];
  defaultRole: UserRole;
}) {
  const hasTenant = availableRoles.includes("tenant");
  const hasVendor = availableRoles.includes("vendor");

  const cards: PortalCard[] = [
    {
      id: "tenant",
      title: "Resident Portal",
      description: hasTenant
        ? "Open your resident experience for maintenance, payments, and announcements."
        : "Available to residents with a linked tenancy.",
      available: hasTenant,
      roleHint: "Tenant role",
      ...(hasTenant ? { href: "/portal/tenant" } : {})
    },
    {
      id: "vendor",
      title: "Vendor Portal",
      description: hasVendor
        ? "Open assigned work and completion updates."
        : "Available to vendors with active assignments.",
      available: hasVendor,
      roleHint: "Vendor role",
      ...(hasVendor ? { href: "/portal/vendor" } : {})
    },
    {
      id: "owner",
      title: "Owner Portal",
      description: "This feature will become available during a future release.",
      available: false,
      roleHint: "Future release"
    },
    {
      id: "manager",
      title: "Manager Portal",
      description:
        "Property managers use the main Operations workspace today. A dedicated manager portal will become available during a future release.",
      available: false,
      roleHint: "Future release"
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Portals
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--mpa-color-text-secondary)]">
          Only finished portal experiences are available. Unfinished portals are gated so Design Partners
          never hit a dead end. Active role: {defaultRole.replaceAll("_", " ")}.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {cards.map((card) => (
          <Card key={card.id} className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">{card.title}</h2>
              <span className="rounded-md bg-[var(--mpa-color-surface-muted)] px-2 py-1 text-xs font-medium text-[var(--mpa-color-text-secondary)]">
                {card.available ? "Available" : card.roleHint}
              </span>
            </div>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">{card.description}</p>
            {card.available && card.href ? (
              <Link href={card.href}>
                <Button type="button">Open portal</Button>
              </Link>
            ) : (
              <Link href="/dashboard">
                <Button type="button" variant="secondary">
                  Return to Operations Center
                </Button>
              </Link>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
