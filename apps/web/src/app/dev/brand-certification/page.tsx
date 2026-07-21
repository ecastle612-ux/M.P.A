import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import {
  MPA_BRAND_EMBEDDED_TEXT_MIN_PX,
  MPA_BRAND_MIN_MARK_PX,
  MPA_BRAND_NAME,
  resolveBrandPresentation,
  type BrandLogoPurpose
} from "@mpa/shared";
import { BrandLogo, BrandSurfaceTone } from "../../../components/branding/brand-logo";

const PURPOSES: BrandLogoPurpose[] = [
  "login",
  "splash",
  "onboarding",
  "sidebar",
  "drawer",
  "header",
  "loading",
  "email",
  "pdf",
  "browser"
];

/**
 * BR-001 Amendment E — Design Partner brand certification harness (development only).
 */
export default function BrandCertificationPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const violations: string[] = [];

  for (const purpose of PURPOSES) {
    const expanded = resolveBrandPresentation(purpose, { collapsed: false });
    const collapsed = resolveBrandPresentation(purpose, { collapsed: true });

    if (purpose === "login" || purpose === "splash") {
      if (expanded.mode === "icon") {
        violations.push(`${purpose}: must never be icon-only`);
      }
      if (expanded.markPx < MPA_BRAND_MIN_MARK_PX.authentication && purpose === "login") {
        violations.push(`${purpose}: mark below authentication floor`);
      }
      if (purpose === "splash" && expanded.markPx < MPA_BRAND_MIN_MARK_PX.splash) {
        violations.push(`${purpose}: mark below splash floor`);
      }
    }

    if ((purpose === "drawer" || purpose === "login") && expanded.mode === "icon") {
      violations.push(`${purpose}: icon-only forbidden on product chrome`);
    }

    for (const presentation of [expanded, collapsed]) {
      if (
        presentation.mode !== "icon" &&
        presentation.markPx < MPA_BRAND_EMBEDDED_TEXT_MIN_PX &&
        !presentation.useLockup &&
        !presentation.showBrandName
      ) {
        violations.push(
          `${purpose}: mark ${presentation.markPx}px below ${MPA_BRAND_EMBEDDED_TEXT_MIN_PX} without lockup (Amendment B)`
        );
      }
      if (presentation.markPx < MPA_BRAND_MIN_MARK_PX.icon) {
        violations.push(`${purpose}: mark below icon floor 48px`);
      }
    }
  }

  const verdict = violations.length === 0 ? "PASS" : "FAIL";

  return (
    <main className="mx-auto max-w-5xl space-y-8 bg-[var(--mpa-color-bg-app)] px-4 py-10 text-[var(--mpa-color-text-primary)]">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--mpa-color-text-muted)]">
          BR-001 · ADR-021
        </p>
        <h1 className="font-display text-3xl font-semibold">{MPA_BRAND_NAME} Brand Certification</h1>
        <p
          className={[
            "inline-flex rounded-md px-3 py-1 text-sm font-semibold",
            verdict === "PASS"
              ? "bg-emerald-500/15 text-emerald-700"
              : "bg-red-500/15 text-red-700"
          ].join(" ")}
        >
          {verdict}
        </p>
        {violations.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-red-700">
            {violations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Presentation rules, floors, and Amendment A–B checks passed. Visually confirm light/dark and device
            widths below (Amendment E).
          </p>
        )}
      </header>

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
      <Sample label="login (Hero)">
        <BrandLogo purpose="login" />
      </Sample>
      <Sample label="splash (Hero)">
        <BrandLogo purpose="splash" />
      </Sample>
      <Sample label="sidebar (Standard)">
        <BrandLogo purpose="sidebar" />
      </Sample>
      <Sample label="sidebar collapsed (Compact)">
        <BrandLogo purpose="sidebar" collapsed />
      </Sample>
      <Sample label="drawer (Compact)">
        <BrandLogo purpose="drawer" />
      </Sample>
      <Sample label="header (Compact)">
        <BrandLogo purpose="header" />
      </Sample>
      <Sample label="loading">
        <BrandLogo purpose="loading" />
      </Sample>
    </div>
  );
}

function Sample({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2 border-b border-[var(--mpa-color-border-subtle)] pb-4 last:border-0">
      <p className="text-xs text-[var(--mpa-color-text-muted)]">{label}</p>
      <div className="flex justify-center">{children}</div>
    </div>
  );
}
