import Link from "next/link";
import { Breadcrumbs } from "../shell/breadcrumbs";

export function ModuleAlignmentPage({
  product,
  title,
  description,
  readiness,
  entitlement,
  includedIn,
  requiresComplete
}: {
  product: string;
  title: string;
  description: string;
  readiness: "aligned" | "planned";
  entitlement: string;
  includedIn: string[];
  requiresComplete?: string;
}) {
  const isMissionControl = title.toLowerCase().includes("mission control");
  const readinessLabel =
    readiness === "planned" ? "Planned — included, not implemented" : "Aligned — architectural home";

  return (
    <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs items={[{ href: "/launcher", label: "Launcher" }, { label: title }]} />
      <section className="max-w-3xl space-y-4">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            {product}
            {isMissionControl ? " · Facility attention home" : ""}
          </p>
          <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
            {title}
          </h1>
          <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">{description}</p>
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                readiness === "aligned"
                  ? "bg-[#E3F5EE] text-[#0E7A57]"
                  : "bg-[#FEF3C7] text-[#B45309]"
              }`}
            >
              {readiness === "aligned" ? "Aligned" : "Planned"}
            </span>
          </div>
        </header>

        {isMissionControl ? (
          <section
            aria-label="What to do next"
            className="rounded-md border border-[var(--mpa-color-brand-primary)]/30 bg-white p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
              What to do next
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--mpa-color-text-primary)]">
              Facility Operations workflows are commercially aligned here. Use Billing & Plan or the
              Workspace Launcher to continue day-to-day work until facility ops modules ship.
            </p>
            <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
              Complete Platform customers can open Property Manager Mission Control for live attention
              queues today.
            </p>
          </section>
        ) : null}

        <dl className="grid gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--mpa-color-text-secondary)]">Commercial readiness</dt>
            <dd className="text-right font-medium text-[var(--mpa-color-text-primary)]">
              {readinessLabel}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--mpa-color-text-secondary)]">Entitlement</dt>
            <dd className="font-mono text-xs text-[var(--mpa-color-text-primary)]">{entitlement}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--mpa-color-text-secondary)]">Included in</dt>
            <dd className="text-right text-[var(--mpa-color-text-primary)]">{includedIn.join(" · ")}</dd>
          </div>
          {requiresComplete ? (
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--mpa-color-text-secondary)]">Requires Complete for</dt>
              <dd className="text-right text-[var(--mpa-color-text-primary)]">{requiresComplete}</dd>
            </div>
          ) : null}
        </dl>

        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Phase 1 aligns commercial ownership only. No business workflow implementation lives here.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-medium text-white hover:bg-[#0C5A48] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)] focus-visible:ring-offset-2"
            href="/launcher"
          >
            Open Workspace Launcher
          </Link>
          <Link
            className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--mpa-color-border-default)] bg-white px-4 text-sm font-medium text-[var(--mpa-color-text-primary)] hover:bg-[var(--mpa-color-bg-subtle,#f7faf9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)] focus-visible:ring-offset-2"
            href="/billing"
          >
            View Billing & Plan
          </Link>
          <Link
            className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--mpa-color-border-default)] bg-white px-4 text-sm font-medium text-[var(--mpa-color-text-primary)] hover:bg-[var(--mpa-color-bg-subtle,#f7faf9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)] focus-visible:ring-offset-2"
            href="/setup"
          >
            Guided Setup
          </Link>
        </div>
      </section>
    </main>
  );
}
