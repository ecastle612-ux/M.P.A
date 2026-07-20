import Link from "next/link";
import { Card } from "@mpa/ui";

const DASHBOARDS = [
  { href: "/dashboard", label: "Operations Center", description: "Property manager home" },
  { href: "/portal", label: "Portals", description: "Role portal launcher" },
  { href: "/ai-operations", label: "AI Operations", description: "AI workspace" },
  { href: "/financials", label: "Accounting", description: "Financial operations" },
  { href: "/properties", label: "Properties / Facility", description: "Portfolio and facility entry" },
  { href: "/portal/tenant", label: "Tenant portal", description: "Resident experience" },
  { href: "/portal/owner", label: "Owner portal", description: "Owner experience" },
  { href: "/portal/manager", label: "Manager portal", description: "Manager experience" },
  { href: "/portal/vendor", label: "Vendor portal", description: "Vendor experience" }
] as const;

export default function MasterAdminDashboardsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
          Dashboard switcher
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--mpa-color-text-secondary)]">
          Navigate across product surfaces without signing out. Organization context stays in the shell
          switcher.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {DASHBOARDS.map((item) => (
          <Link key={item.href} href={item.href} className="block transition hover:opacity-95">
            <Card className="h-full space-y-1">
              <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
                {item.label}
              </h2>
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">{item.description}</p>
              <p className="pt-1 text-xs text-[var(--mpa-color-text-tertiary)]">{item.href}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
