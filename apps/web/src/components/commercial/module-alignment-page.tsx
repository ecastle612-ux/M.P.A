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
  return (
    <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs items={[{ href: "/launcher", label: "Launcher" }, { label: title }]} />
      <section className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          {product}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">{title}</h1>
        <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">{description}</p>
        <dl className="mt-4 grid gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--mpa-color-text-secondary)]">Commercial readiness</dt>
            <dd className="font-medium text-[var(--mpa-color-text-primary)]">
              {readiness === "planned" ? "Planned — included, not implemented" : "Aligned — architectural home"}
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
        <p className="mt-4 text-sm text-[var(--mpa-color-text-secondary)]">
          Phase 1 aligns commercial ownership only. No business workflow implementation lives here.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link className="text-[var(--mpa-color-brand-primary)] underline" href="/billing">
            View Billing & Plan
          </Link>
          <Link className="text-[var(--mpa-color-brand-primary)] underline" href="/setup">
            Guided Setup
          </Link>
          <Link className="text-[var(--mpa-color-brand-primary)] underline" href="/launcher">
            Workspace Launcher
          </Link>
        </div>
      </section>
    </main>
  );
}
