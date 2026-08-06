"use client";

import Link from "next/link";
import { workspaceLauncherItemsForSku } from "@mpa/shared";
import { useCommercialContext } from "../shell/commercial-context";
import { Breadcrumbs } from "../shell/breadcrumbs";

const PRODUCT_LABELS = {
  property_manager: "Property Manager",
  facility_operations: "Facility Operations",
  shared: "Shared Platform",
  setup: "Setup"
} as const;

export function WorkspaceLauncherPage() {
  const { productSku, productLabel } = useCommercialContext();
  const items = workspaceLauncherItemsForSku(productSku);

  const grouped = {
    property_manager: items.filter((item) => item.product === "property_manager"),
    facility_operations: items.filter((item) => item.product === "facility_operations"),
    shared: items.filter((item) => item.product === "shared" || item.product === "setup")
  };

  return (
    <main className="flex-1 space-y-6 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs items={[{ label: "Workspace Launcher" }]} />
      <section>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Workspace Launcher
        </h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Workspaces are organized by commercial product.
          {productLabel ? ` Active plan: ${productLabel}.` : " Select a product in Guided Setup."}
        </p>
      </section>

      {(
        [
          ["property_manager", grouped.property_manager],
          ["facility_operations", grouped.facility_operations],
          ["shared", grouped.shared]
        ] as const
      ).map(([key, groupItems]) =>
        groupItems.length ? (
          <section key={key}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
              {PRODUCT_LABELS[key === "shared" ? "shared" : key]}
            </h2>
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {groupItems.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="block rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 hover:border-[var(--mpa-color-brand-primary)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-[var(--mpa-color-text-primary)]">{item.title}</p>
                      {item.readiness === "planned" ? (
                        <span className="text-[10px] uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                          Planned
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">{item.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null
      )}
    </main>
  );
}
