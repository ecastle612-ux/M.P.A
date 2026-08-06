import Link from "next/link";
import {
  COMMERCIAL_MODULES,
  MASTER_ADMIN_NAV,
  PRODUCT_SKUS,
  SKU_SUMMARIES,
  entitlementsForSku,
  modulesForSku,
  toSkuLabel
} from "@mpa/shared";

export function AdminHomePage() {
  return (
    <main className="space-y-6 p-4 md:p-6">
      <section>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Master Admin Mission Control
        </h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Operational headquarters for Property Manager, Facility Operations, Complete Platform, platform
          administration, testing, impersonation, commercial, billing, and launch readiness.
        </p>
      </section>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {MASTER_ADMIN_NAV.filter((group) => group.id !== "workspaces").flatMap((group) =>
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
            </li>
          ))}
        </ul>
      </section>
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
        Nothing disappears because it is unimplemented. Planned capabilities remain visible.
      </p>
      <ul className="space-y-2">
        {COMMERCIAL_MODULES.map((module) => (
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
  description,
  status = "aligned"
}: {
  title: string;
  description: string;
  status?: "aligned" | "planned";
}) {
  return (
    <main className="space-y-4 p-4 md:p-6">
      <h1 className="font-display text-2xl font-semibold">{title}</h1>
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">{description}</p>
      <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">Status: {status}</p>
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
                <th className="py-2 pr-4">Module</th>
                <th className="py-2 pr-4">Owner</th>
                <th className="py-2 pr-4">PM</th>
                <th className="py-2 pr-4">Facility</th>
                <th className="py-2 pr-4">Complete</th>
                <th className="py-2">Readiness</th>
              </tr>
            </thead>
            <tbody>
              {COMMERCIAL_MODULES.map((module) => {
                const pm = modulesForSku("mpa_property_manager").some((item) => item.id === module.id);
                const facility = modulesForSku("mpa_facility_operations").some((item) => item.id === module.id);
                const complete = modulesForSku("mpa_complete_platform").some((item) => item.id === module.id);
                return (
                  <tr key={module.id} className="border-b border-[var(--mpa-color-border-default)]">
                    <td className="py-2 pr-4">{module.label}</td>
                    <td className="py-2 pr-4">{module.owner}</td>
                    <td className="py-2 pr-4">{pm ? "●" : "—"}</td>
                    <td className="py-2 pr-4">{facility ? "●" : "—"}</td>
                    <td className="py-2 pr-4">{complete || module.id === "capital_projects" ? "●/future" : "—"}</td>
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

export function AdminWorkspacePage({ moduleId }: { moduleId: string }) {
  const commercialModule = COMMERCIAL_MODULES.find((item) => item.id === moduleId);
  if (!commercialModule) {
    return (
      <main className="p-6">
        <h1 className="font-display text-2xl font-semibold">Unknown workspace</h1>
      </main>
    );
  }

  return (
    <main className="space-y-3 p-4 md:p-6">
      <h1 className="font-display text-2xl font-semibold">
        {commercialModule.label}
      </h1>
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">
        {commercialModule.plannedLabel ?? commercialModule.description}
      </p>
      <dl className="grid max-w-xl gap-2 rounded border bg-white p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt>Owner</dt>
          <dd>{commercialModule.owner}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Readiness</dt>
          <dd>{commercialModule.readiness}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Entitlement</dt>
          <dd className="font-mono text-xs">{commercialModule.entitlement}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Customer href</dt>
          <dd className="font-mono text-xs">{commercialModule.href}</dd>
        </div>
      </dl>
      <Link href={commercialModule.href} className="text-sm text-[var(--mpa-color-brand-primary)] underline">
        Open customer alignment surface
      </Link>
    </main>
  );
}
