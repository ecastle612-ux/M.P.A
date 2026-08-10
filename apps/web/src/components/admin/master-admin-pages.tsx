import Link from "next/link";
import {
  COMMERCIAL_MODULES,
  FIN_OPS_SLICES,
  MASTER_ADMIN_NAV,
  PRODUCT_SKUS,
  SKU_SUMMARIES,
  entitlementsForSku,
  modulesForSku,
  toSkuLabel
} from "@mpa/shared";
import { Badge } from "@mpa/ui";

export function AdminHomePage() {
  return (
    <main className="space-y-6 p-4 md:p-6">
      <section>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Owner Operations Console
        </h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Fully functional tools for monitoring, verifying, and supporting every customer.
        </p>
      </section>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {MASTER_ADMIN_NAV.flatMap((group) =>
          group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 hover:border-[var(--mpa-color-brand-primary)]"
            >
              <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">{group.title}</p>
              <p className="mt-1 font-medium text-[var(--mpa-color-text-primary)]">{item.label}</p>
              <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">{item.description}</p>
            </Link>
          ))
        )}
      </section>
    </main>
  );
}

export function AdminProductPage({ sku }: { sku: (typeof PRODUCT_SKUS)[number] }) {
  const summary = SKU_SUMMARIES[sku];
  const modules = modulesForSku(sku);
  const entitlements = entitlementsForSku(sku);
  const includesFinancialOps = modules.some((module) => module.id === "financial_operations");

  return (
    <main className="space-y-4 p-4 md:p-6">
      <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">{summary.label}</h1>
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">{summary.description}</p>
      <p className="text-xs font-mono text-[var(--mpa-color-text-secondary)]">SKU: {sku}</p>
      <section>
        <h2 className="text-base font-semibold">Modules</h2>
        <ul className="mt-2 grid gap-2 md:grid-cols-2">
          {modules.map((module) => (
            <li key={module.id} className="rounded border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm">
              {module.label} · {module.readiness}
              {module.id === "financial_operations" ? (
                <span className="mt-1 block text-xs text-[var(--mpa-color-text-secondary)]">
                  Property Manager → Financial Operations · S0–S3 live (billing, collections, Command Center,
                  owner reporting)
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
      {includesFinancialOps ? (
        <section className="rounded border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="text-base font-semibold">Property Manager → Financial Operations</h2>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Automatically discovered from the commercial module catalog. Implementation progress:
          </p>
          <ol className="mt-3 space-y-1 text-sm">
            {FIN_OPS_SLICES.map((slice) => (
              <li key={slice.id} className="flex items-center justify-between gap-3 border-b border-[var(--mpa-color-border-subtle)] py-1">
                <span>
                  {slice.id} · {slice.name}
                </span>
                <Badge variant={slice.status === "complete" ? "success" : "neutral"}>{slice.status}</Badge>
              </li>
            ))}
          </ol>
          <Link
            href="/pm/financial-operations"
            className="mt-3 inline-block text-sm text-[var(--mpa-color-brand-primary)] underline"
          >
            Open Financial Operations (customer app)
          </Link>
        </section>
      ) : null}
      <section>
        <h2 className="text-base font-semibold">Entitlements</h2>
        <ul className="mt-2 columns-1 gap-2 text-xs font-mono text-[var(--mpa-color-text-secondary)] md:columns-2">
          {entitlements.map((entitlement) => (
            <li key={entitlement}>{entitlement}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export function AdminCatalogPage() {
  return (
    <main className="space-y-4 p-4 md:p-6">
      <h1 className="font-display text-2xl font-semibold">Capability Catalog</h1>
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">
        Reference catalog of commercial modules. Not shown in Owner Operations navigation.
      </p>
      <ul className="space-y-2">
        {COMMERCIAL_MODULES.filter((module) => module.id !== "capital_projects").map((module) => (
          <li key={module.id} className="rounded border border-[var(--mpa-color-border-default)] bg-white p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium">
                {module.label} · {module.owner.split("_").join(" ")}
              </span>
              <span className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                {module.readiness}
              </span>
            </div>
            <p className="mt-1 text-[var(--mpa-color-text-secondary)]">{module.plannedLabel ?? module.description}</p>
            <p className="mt-1 font-mono text-xs">{module.entitlement}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}

export function AdminSimplePage({
  title,
  description
}: {
  title: string;
  description: string;
  status?: "aligned" | "planned";
}) {
  return (
    <main className="space-y-4 p-4 md:p-6">
      <h1 className="font-display text-2xl font-semibold">{title}</h1>
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">{description}</p>
      {title === "Subscriptions" ? (
        <ul className="mt-4 space-y-2 text-sm">
          {PRODUCT_SKUS.map((sku) => (
            <li key={sku} className="rounded border bg-white px-3 py-2">
              {toSkuLabel(sku)} <span className="font-mono text-xs">({sku})</span>
            </li>
          ))}
        </ul>
      ) : null}
      {title === "Product Matrix" ? (
        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th scope="col" className="py-2 pr-4">Module</th>
                <th scope="col" className="py-2 pr-4">Owner</th>
                <th scope="col" className="py-2 pr-4">PM</th>
                <th scope="col" className="py-2 pr-4">Facility</th>
                <th scope="col" className="py-2 pr-4">Complete</th>
                <th scope="col" className="py-2">Readiness</th>
              </tr>
            </thead>
            <tbody>
              {COMMERCIAL_MODULES.filter((module) => module.id !== "capital_projects").map((module) => {
                const pm = modulesForSku("mpa_property_manager").some((item) => item.id === module.id);
                const facility = modulesForSku("mpa_facility_operations").some((item) => item.id === module.id);
                const complete = modulesForSku("mpa_complete_platform").some((item) => item.id === module.id);
                return (
                  <tr key={module.id} className="border-b border-[var(--mpa-color-border-default)]">
                    <td className="py-2 pr-4">{module.label}</td>
                    <td className="py-2 pr-4">{module.owner}</td>
                    <td className="py-2 pr-4">{pm ? "●" : "—"}</td>
                    <td className="py-2 pr-4">{facility ? "●" : "—"}</td>
                    <td className="py-2 pr-4">{complete ? "●" : "—"}</td>
                    <td className="py-2">{module.readiness}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </main>
  );
}
