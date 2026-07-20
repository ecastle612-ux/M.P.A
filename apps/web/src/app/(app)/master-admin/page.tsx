import Link from "next/link";
import { Card } from "@mpa/ui";

const HUB_LINKS = [
  {
    href: "/master-admin/dashboards",
    title: "Dashboard switcher",
    description: "Jump between PM, portal, AI, accounting, and facility surfaces."
  },
  {
    href: "/master-admin/providers",
    title: "Provider status",
    description: "Read-only Design Partner provider connection center."
  },
  {
    href: "/master-admin/testing",
    title: "Testing utilities",
    description: "Seed or reset demo portfolio data for the active org."
  },
  {
    href: "/master-admin/health",
    title: "System health",
    description: "Read-only table count checks for the active organization."
  },
  {
    href: "/master-admin/flags",
    title: "Feature flags",
    description: "Public env flags and provider credential presence (boolean only)."
  }
] as const;

export default function MasterAdminHubPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
          Master Admin
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--mpa-color-text-secondary)]">
          Internal console for development and Design Partner operations. Access is gated by the{" "}
          <code className="text-xs">master_admin</code> capability (organization overrides).
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {HUB_LINKS.map((item) => (
          <Link key={item.href} href={item.href} className="block transition hover:opacity-95">
            <Card className="h-full space-y-2">
              <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
                {item.title}
              </h2>
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">{item.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
