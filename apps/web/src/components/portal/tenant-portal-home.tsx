import Link from "next/link";
import { Card } from "@mpa/ui";

/** DPX-003 — communication-first, then account operations. */
const COMMUNICATION_LINKS = [
  {
    href: "/portal/tenant/announcements",
    title: "Announcements",
    description: "Property and community updates from management."
  },
  {
    href: "/portal/tenant/notifications",
    title: "Notifications",
    description: "Alerts and activity that need your attention."
  },
  {
    href: "/portal/tenant/messages",
    title: "Messages",
    description: "Message your property manager."
  }
] as const;

const ACCOUNT_LINKS = [
  {
    href: "/portal/tenant/payments",
    title: "Rent",
    description: "Balance, charges, and payments."
  },
  {
    href: "/portal/tenant/maintenance",
    title: "Maintenance",
    description: "Submit a request and track status."
  },
  {
    href: "/portal/tenant/documents",
    title: "Lease & documents",
    description: "Lease files and shared documents."
  }
] as const;

const SECONDARY_LINKS = [
  {
    href: "/portal/tenant/community",
    title: "Community",
    description: "Calendar and neighborhood updates."
  },
  {
    href: "/portal/tenant/preferences",
    title: "Preferences",
    description: "Notification and communication settings."
  },
  {
    href: "/profile",
    title: "Profile",
    description: "Name, contact info, and photo."
  }
] as const;

function LinkGrid({
  links
}: {
  links: ReadonlyArray<{ href: string; title: string; description: string }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-xl border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4 transition hover:border-[var(--mpa-color-border-strong)]"
        >
          <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">{link.title}</p>
          <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">{link.description}</p>
        </Link>
      ))}
    </div>
  );
}

export function TenantPortalHome({
  residentName,
  hasLinkedTenant
}: {
  residentName: string;
  hasLinkedTenant: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Welcome{residentName ? `, ${residentName}` : ""}
        </h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Start with messages from management — then rent, maintenance, and documents.
        </p>
      </div>

      {!hasLinkedTenant ? (
        <Card className="border-amber-300 bg-amber-50">
          <p className="text-sm text-amber-900">
            Your account is not linked to a resident profile yet. Accept your invitation or contact your
            property manager to finish activation.
          </p>
        </Card>
      ) : null}

      <section className="space-y-3" aria-labelledby="tenant-comms-heading">
        <div>
          <h2 id="tenant-comms-heading" className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
            From management
          </h2>
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">
            Did we contact you? Check announcements, notifications, and messages first.
          </p>
        </div>
        <LinkGrid links={COMMUNICATION_LINKS} />
      </section>

      <section className="space-y-3" aria-labelledby="tenant-account-heading">
        <div>
          <h2 id="tenant-account-heading" className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
            Your account
          </h2>
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">
            Rent, maintenance, and lease documents.
          </p>
        </div>
        <LinkGrid links={ACCOUNT_LINKS} />
      </section>

      <details className="rounded-xl border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface-muted)]/40 px-3 py-2">
        <summary className="cursor-pointer text-sm font-medium text-[var(--mpa-color-text-secondary)]">
          More · community, preferences, profile
        </summary>
        <div className="mt-3 pb-2">
          <LinkGrid links={SECONDARY_LINKS} />
        </div>
      </details>
    </div>
  );
}
