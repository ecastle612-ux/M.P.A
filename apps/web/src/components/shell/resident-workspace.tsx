"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@mpa/ui";

const linkFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)] focus-visible:ring-offset-2";

export function ResidentStatusBadge({
  tone,
  children
}: {
  tone: "ok" | "watch" | "urgent" | "neutral";
  children: ReactNode;
}) {
  const variant =
    tone === "ok" ? "success" : tone === "watch" ? "warning" : tone === "urgent" ? "danger" : "neutral";
  return <Badge variant={variant}>{children}</Badge>;
}

export function ResidentGlanceCard({
  label,
  value,
  hint,
  href,
  tone = "neutral"
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  tone?: "ok" | "watch" | "urgent" | "neutral";
}) {
  const edge =
    tone === "urgent"
      ? "border-l-[#C0392B]"
      : tone === "watch"
        ? "border-l-[#B45309]"
        : tone === "ok"
          ? "border-l-[#0E7A57]"
          : "border-l-[var(--mpa-color-border-default)]";

  const inner = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
        {label}
      </p>
      <p className="mt-2 font-display text-xl font-semibold text-[var(--mpa-color-text-primary)] sm:text-2xl">
        {value}
      </p>
      {hint ? <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{hint}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`block rounded-2xl border border-[var(--mpa-color-border-default)] border-l-[3px] bg-white p-4 shadow-[0_1px_0_rgba(15,27,45,0.04)] ${edge} ${linkFocus}`}
      >
        {inner}
      </Link>
    );
  }

  return (
    <article
      className={`rounded-2xl border border-[var(--mpa-color-border-default)] border-l-[3px] bg-white p-4 shadow-[0_1px_0_rgba(15,27,45,0.04)] ${edge}`}
    >
      {inner}
    </article>
  );
}

export function ResidentQuickActions({
  actions
}: {
  actions: Array<{ href: string; label: string; primary?: boolean }>;
}) {
  if (!actions.length) return null;
  return (
    <nav aria-label="Quick actions" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {actions.map((action) => (
        <Link
          key={action.href + action.label}
          href={action.href}
          className={
            action.primary
              ? `inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--mpa-color-brand-primary)] px-4 text-base font-semibold text-white hover:bg-[#0C5A48] ${linkFocus}`
              : `inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--mpa-color-border-default)] bg-white px-4 text-base font-medium text-[var(--mpa-color-text-primary)] hover:border-[var(--mpa-color-brand-primary)] ${linkFocus}`
          }
        >
          {action.label}
        </Link>
      ))}
    </nav>
  );
}

export function ResidentSection({
  title,
  description,
  children,
  action
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-[var(--mpa-color-border-default)] bg-white p-4 sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
            {title}
          </h2>
          {description ? (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">{description}</p>
          ) : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

export function ResidentDocumentsStrip({
  title = "Your documents",
  detail = "Lease, renewals, move-in packets, policies, and notices live in your Documents area — organized by Document Intelligence."
}: {
  title?: string;
  detail?: string;
}) {
  return (
    <section
      aria-label="Documents readiness"
      className="rounded-2xl border border-dashed border-[var(--mpa-color-border-default)] bg-white px-4 py-3"
    >
      <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">{title}</p>
      <p className="mt-0.5 text-sm text-[var(--mpa-color-text-secondary)]">{detail}</p>
      <Link
        href="/portal/tenant/documents"
        className={`mt-3 inline-flex min-h-11 items-center text-sm font-medium text-[var(--mpa-color-brand-primary)] underline ${linkFocus}`}
      >
        Open documents
      </Link>
    </section>
  );
}

export function ResidentPageIntro({
  eyebrow = "My Home",
  title,
  description
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="space-y-1 pb-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
        {eyebrow}
      </p>
      <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)] sm:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="max-w-xl text-sm leading-6 text-[var(--mpa-color-text-secondary)] sm:text-base">
          {description}
        </p>
      ) : null}
    </header>
  );
}
