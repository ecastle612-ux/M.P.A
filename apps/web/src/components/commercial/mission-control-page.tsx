"use client";

import Link from "next/link";
import { useCommercialContext } from "../shell/commercial-context";
import { useOrganizationContext } from "../shell/organization-context";
import { Breadcrumbs } from "../shell/breadcrumbs";

export function MissionControlPage() {
  const { activeOrganization } = useOrganizationContext();
  const { productLabel, setupComplete } = useCommercialContext();

  return (
    <main className="flex-1 space-y-6 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs
        items={[
          { href: "/dashboard", label: "Home" },
          { label: "Mission Control" }
        ]}
      />

      <header className="max-w-2xl space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          {productLabel ?? "Property Manager"}
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
          Mission Control
        </h1>
        <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
          Your attention home — not an analytics dashboard. One clear next action at a time.
        </p>
      </header>

      <section className="max-w-2xl space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-5">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[var(--mpa-color-text-secondary)]">Organization</dt>
            <dd className="mt-1 font-medium text-[var(--mpa-color-text-primary)]">
              {activeOrganization?.name ?? "No organization selected"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--mpa-color-text-secondary)]">Plan</dt>
            <dd className="mt-1 font-medium text-[var(--mpa-color-text-primary)]">
              {productLabel ?? "Property Manager"}
            </dd>
          </div>
        </dl>

        {!setupComplete ? (
          <div className="space-y-3 border-t border-[var(--mpa-color-border-default)] pt-4">
            <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
              Finish Guided Setup
            </h2>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              Setup is incomplete. Complete it before daily operations begin.
            </p>
            <Link
              href="/setup"
              className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-medium text-white hover:bg-[#0C5A48]"
            >
              Continue Guided Setup
            </Link>
          </div>
        ) : (
          <div className="space-y-3 border-t border-[var(--mpa-color-border-default)] pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
              Next action
            </p>
            <h2 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">
              Add your first property
            </h2>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              You&apos;re in. Open Properties to continue onboarding. Creating and managing the
              portfolio is the next authorized journey.
            </p>
            <Link
              href="/pm/properties"
              className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-medium text-white hover:bg-[#0C5A48]"
            >
              Go to Properties
            </Link>
          </div>
        )}
      </section>

      <p className="max-w-2xl text-xs text-[var(--mpa-color-text-secondary)]">
        Secondary surfaces (Billing, Settings) stay available from the shell — they are not competing
        CTAs on this home.
      </p>
    </main>
  );
}
