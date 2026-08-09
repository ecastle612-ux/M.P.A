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

const linkFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)] focus-visible:ring-offset-2";

export function WorkspaceLauncherPage() {
  const { productSku, productLabel } = useCommercialContext();
  const items = workspaceLauncherItemsForSku(productSku);

  const grouped = {
    property_manager: items.filter((item) => item.product === "property_manager"),
    facility_operations: items.filter((item) => item.product === "facility_operations"),
    shared: items.filter((item) => item.product === "shared" || item.product === "setup")
  };

  const missionControlItems = items.filter((item) =>
    item.title.toLowerCase().includes("mission control")
  );

  return (
    <main className="flex-1 space-y-6 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs items={[{ label: "Workspace Launcher" }]} />
      <section className="max-w-3xl space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Complete Platform · Start of day
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
          Workspace Launcher
        </h1>
        <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
          Workspaces are organized by commercial product.
          {productLabel ? ` Active plan: ${productLabel}.` : " Select a product in Guided Setup."}{" "}
          Begin and end the day in Mission Control.
        </p>
      </section>

      {missionControlItems.length > 0 ? (
        <section
          aria-label="Begin your day"
          className="max-w-4xl space-y-3 rounded-md border border-[var(--mpa-color-brand-primary)]/30 bg-white p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
            Begin your day
          </p>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Open an attention home first — then use product workspaces for deep work.
          </p>
          <ul className="grid gap-3 md:grid-cols-2">
            {missionControlItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={`block rounded-md border border-[var(--mpa-color-brand-primary)]/40 bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)] p-4 hover:border-[var(--mpa-color-brand-primary)] ${linkFocus}`}
                >
                  <p className="font-semibold text-[var(--mpa-color-text-primary)]">{item.title}</p>
                  <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{item.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {(
        [
          ["property_manager", grouped.property_manager],
          ["facility_operations", grouped.facility_operations],
          ["shared", grouped.shared]
        ] as const
      ).map(([key, groupItems]) =>
        groupItems.length ? (
          <section key={key}>
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
              {PRODUCT_LABELS[key === "shared" ? "shared" : key]}
            </h2>
            <p className="mb-3 text-xs text-[var(--mpa-color-text-muted)]">
              {key === "property_manager"
                ? "Property Manager attention and portfolio workflows."
                : key === "facility_operations"
                  ? "Facility Operations attention home and aligned modules."
                  : "Shared commercial and setup surfaces."}
            </p>
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {groupItems.map((item) => {
                const isMc = item.title.toLowerCase().includes("mission control");
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={`block rounded-md border bg-white p-4 hover:border-[var(--mpa-color-brand-primary)] ${linkFocus} ${
                        isMc
                          ? "border-[var(--mpa-color-brand-primary)]/35"
                          : "border-[var(--mpa-color-border-default)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-[var(--mpa-color-text-primary)]">{item.title}</p>
                        {item.readiness === "planned" ? (
                          <span className="text-[10px] uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                            Planned
                          </span>
                        ) : isMc ? (
                          <span className="text-[10px] uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
                            Start here
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">{item.description}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null
      )}
    </main>
  );
}
