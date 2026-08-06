"use client";

import Link from "next/link";
import { SKU_SUMMARIES, PRODUCT_SKUS, modulesForSku, upgradeCuesForSku } from "@mpa/shared";
import { useCommercialContext } from "../shell/commercial-context";
import { Breadcrumbs } from "../shell/breadcrumbs";

export function BillingPlanPage() {
  const { productSku, productLabel } = useCommercialContext();
  const included = modulesForSku(productSku);
  const cues = upgradeCuesForSku(productSku);

  return (
    <main className="flex-1 space-y-6 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs items={[{ href: "/launcher", label: "Launcher" }, { label: "Billing & Plan" }]} />
      <section>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Billing & Plan
        </h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Your organization currently has: <strong>{productLabel ?? "No product selected"}</strong>. Plan changes are
          performed only by platform commercial operations.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {PRODUCT_SKUS.map((sku) => {
          const summary = SKU_SUMMARIES[sku];
          const active = productSku === sku;
          return (
            <article
              key={sku}
              className={`rounded-md border p-4 ${
                active
                  ? "border-[var(--mpa-color-brand-primary)] bg-white"
                  : "border-[var(--mpa-color-border-default)] bg-white opacity-80"
              }`}
            >
              <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                {active ? "Your purchased plan" : "Other commercial product"}
              </p>
              <h2 className="mt-1 font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
                {summary.label}
              </h2>
              <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">{summary.description}</p>
            </article>
          );
        })}
      </section>

      <section>
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Included in your plan</h2>
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {included.map((module) => (
            <li
              key={module.id}
              className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-[var(--mpa-color-text-primary)]">{module.label}</span>
                <span className="text-xs text-[var(--mpa-color-text-secondary)]">
                  {module.readiness === "planned" ? "Coming later" : "Included"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
          Not included — requires another subscription
        </h2>
        <ul className="mt-3 space-y-2">
          {cues.map((cue) => (
            <li
              key={`${cue.moduleLabel}-${cue.requires}`}
              className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-3 text-sm"
            >
              <p className="font-medium text-[var(--mpa-color-text-primary)]">Requires {cue.requires}</p>
              <p className="mt-1 text-[var(--mpa-color-text-secondary)]">{cue.moduleLabel}</p>
              <p className="mt-1 text-[var(--mpa-color-text-secondary)]">{cue.reason}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm">
          Continue setup:{" "}
          <Link className="text-[var(--mpa-color-brand-primary)] underline" href="/setup">
            Guided Setup
          </Link>
        </p>
      </section>
    </main>
  );
}
