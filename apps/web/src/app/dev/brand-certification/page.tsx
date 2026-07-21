import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import {
  MPA_BRAND_NAME,
  resolveBrandPresentation,
  type BrandLogoPurpose
} from "@mpa/shared";
import { BrandLogo, BrandSurfaceTone } from "../../../components/branding/brand-logo";

const SCORE_CATEGORIES = [
  "Readability",
  "Balance",
  "Contrast",
  "Premium Feel",
  "First Impression"
] as const;

/**
 * BR-002 / BR-002A — Design Director brand certification harness (development only).
 * Technical wiring is not a PASS. Proud demo to a paying customer is the bar.
 */
export default function BrandCertificationPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const ruleChecks = runPresentationRuleChecks();
  const rulesVerdict = ruleChecks.length === 0 ? "RULES PASS" : "RULES FAIL";

  return (
    <main className="mx-auto max-w-5xl space-y-10 bg-[var(--mpa-color-bg-app)] px-4 py-10 text-[var(--mpa-color-text-primary)]">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--mpa-color-text-muted)]">
          BR-002 · BR-002A · ADR-022
        </p>
        <h1 className="font-display text-3xl font-semibold">{MPA_BRAND_NAME} Visual Brand Certification</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--mpa-color-text-secondary)]">
          Design Director test: if this were the first screen a property manager ever saw, would you proudly demo it
          to a paying customer? Anything less than an immediate yes is a FAIL. Brand recognition takes priority over
          logo fidelity.
        </p>
        <p
          className={[
            "inline-flex rounded-md px-3 py-1 text-sm font-semibold",
            rulesVerdict === "RULES PASS"
              ? "bg-emerald-500/15 text-emerald-700"
              : "bg-red-500/15 text-red-700"
          ].join(" ")}
        >
          Presentation rules: {rulesVerdict}
        </p>
        {ruleChecks.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-red-700">
            {ruleChecks.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </header>

      <section className="rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5">
        <h2 className="font-display text-lg font-semibold">Human PASS checklist</h2>
        <ul className="mt-3 grid gap-2 text-sm text-[var(--mpa-color-text-secondary)] sm:grid-cols-2">
          {[
            "Brand immediately recognizable",
            "Text immediately readable",
            "Correct contrast",
            "Correct visual weight",
            "Balanced spacing",
            "Premium alignment",
            "Looks intentional",
            "Comparable to premium SaaS"
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden="true">✅</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-[var(--mpa-color-text-muted)]">
          Score each surface /10 for: {SCORE_CATEGORIES.join(" · ")}. Any category below 9/10 = FAIL. Record scores in
          docs/86-br-002-visual-brand-certification/03-surface-audit-matrix.md.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <SurfaceCard title="Light surface">
          <BrandSurfaceTone tone="light-surface">
            <Gallery />
          </BrandSurfaceTone>
        </SurfaceCard>
        <SurfaceCard title="Dark surface">
          <BrandSurfaceTone tone="dark-surface">
            <div className="rounded-[var(--mpa-radius-lg)] bg-[#152019] p-4">
              <Gallery />
            </div>
          </BrandSurfaceTone>
        </SurfaceCard>
      </section>
    </main>
  );
}

function runPresentationRuleChecks(): string[] {
  const violations: string[] = [];
  const loading = resolveBrandPresentation("loading");
  if (loading.showBrandName || loading.useLockup) {
    violations.push("loading must render the theme logo only (no extra typography lockup)");
  }
  if (loading.markRole !== "display") {
    violations.push("loading must use the full approved logo asset");
  }
  if (loading.markPx < 96) {
    violations.push("loading mark must be ≥96px");
  }

  const login = resolveBrandPresentation("login");
  if (login.mode !== "hero" || login.markRole !== "display") {
    violations.push("login must be hero full logo");
  }

  for (const purpose of ["drawer", "header", "sidebar", "loading"] as BrandLogoPurpose[]) {
    const presentation = resolveBrandPresentation(purpose);
    if (presentation.markRole !== "display") {
      violations.push(`${purpose}: must use full logo-dark / logo-light asset`);
    }
    if (presentation.showBrandName) {
      violations.push(`${purpose}: do not duplicate PNG wordmark with typography`);
    }
  }

  return violations;
}

function SurfaceCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--mpa-color-text-muted)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Gallery() {
  return (
    <div className="space-y-6">
      <Sample label="login — Hero">
        <BrandLogo purpose="login" />
      </Sample>
      <Sample label="loading — House mark only">
        <div className="flex flex-col items-center gap-3">
          <BrandLogo purpose="loading" decorative />
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">Loading your workspace…</p>
        </div>
      </Sample>
      <Sample label="drawer — Typography lockup">
        <BrandLogo purpose="drawer" />
      </Sample>
      <Sample label="drawer collapsed">
        <BrandLogo purpose="drawer" collapsed />
      </Sample>
      <Sample label="sidebar — Standard">
        <BrandLogo purpose="sidebar" />
      </Sample>
      <Sample label="header — Compact">
        <BrandLogo purpose="header" />
      </Sample>
    </div>
  );
}

function Sample({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2 border-b border-[var(--mpa-color-border-subtle)] pb-4 last:border-0">
      <p className="text-xs text-[var(--mpa-color-text-muted)]">{label}</p>
      <div className="flex justify-center py-2">{children}</div>
      <p className="text-[11px] text-[var(--mpa-color-text-muted)]">
        Scores (human): Readability __/10 · Balance __/10 · Contrast __/10 · Premium __/10 · First impression __/10
      </p>
    </div>
  );
}
