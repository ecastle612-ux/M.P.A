import Link from "next/link";
import { AppPage } from "../../../../../components/presentation/app-page";
import { TENANT_PORTAL_MORE_NAVIGATION } from "../../../../../components/portal/navigation";

/** Secondary destinations — keeps shell nav light (DPX-003 home screen). */
export default function TenantMorePage() {
  return (
    <AppPage
      breadcrumbs={[
        { href: "/portal/tenant", label: "Home" },
        { label: "More" }
      ]}
    >
      <div className="mx-auto max-w-2xl space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">More</h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Announcements, alerts, and account settings.
          </p>
        </div>
        <ul className="space-y-2">
          {TENANT_PORTAL_MORE_NAVIGATION.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-4 py-3 text-sm font-medium text-[var(--mpa-color-text-primary)] transition hover:border-[var(--mpa-color-border-strong)]"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </AppPage>
  );
}
