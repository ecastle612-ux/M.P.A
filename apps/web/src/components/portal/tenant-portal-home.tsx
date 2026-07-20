import Link from "next/link";
import { Card } from "@mpa/ui";

const LINKS = [
  {
    href: "/portal/tenant/maintenance",
    title: "Maintenance",
    description: "Submit a request, attach photos, and track status."
  },
  {
    href: "/portal/tenant/payments",
    title: "Payments",
    description: "View charges, pay rent, and manage autopay."
  },
  {
    href: "/portal/tenant/messages",
    title: "Messages",
    description: "Message your property manager."
  },
  {
    href: "/portal/tenant/announcements",
    title: "Announcements",
    description: "Read property and community updates."
  },
  {
    href: "/portal/tenant/documents",
    title: "Documents",
    description: "Lease files and shared documents."
  },
  {
    href: "/portal/tenant/notifications",
    title: "Notifications",
    description: "Recent alerts and activity."
  },
  {
    href: "/portal/tenant/preferences",
    title: "Preferences",
    description: "Notification and communication preferences."
  },
  {
    href: "/profile",
    title: "Profile",
    description: "Update your name, contact info, and photo."
  }
] as const;

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
          Your resident portal for payments, maintenance, messages, and documents.
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

      <div className="grid gap-3 sm:grid-cols-2">
        {LINKS.map((link) => (
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
    </div>
  );
}
