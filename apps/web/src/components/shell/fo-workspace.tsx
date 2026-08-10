"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@mpa/ui";
import { Breadcrumbs } from "./breadcrumbs";
import { documentsHref } from "./pm-workspace";

export { documentsHref };

const linkFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)] focus-visible:ring-offset-2";

export type FoPriority = "emergency" | "high" | "scheduled" | "waiting" | "completed";

export function FoPriorityBadge({ priority }: { priority: FoPriority }) {
  switch (priority) {
    case "emergency":
      return <Badge variant="danger">Emergency</Badge>;
    case "high":
      return <Badge variant="warning">High priority</Badge>;
    case "scheduled":
      return <Badge variant="info">Scheduled</Badge>;
    case "waiting":
      return <Badge variant="neutral">Waiting</Badge>;
    case "completed":
      return <Badge variant="success">Completed</Badge>;
  }
}

export function FoPriorityLegend() {
  const items: FoPriority[] = ["emergency", "high", "scheduled", "waiting", "completed"];
  return (
    <section
      aria-label="Work priority legend"
      className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-4 py-3"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
        Priority language
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {items.map((priority) => (
          <li key={priority}>
            <FoPriorityBadge priority={priority} />
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-[var(--mpa-color-text-secondary)]">
        Facility queues will use this language so emergency, scheduled, and waiting work never look the
        same.
      </p>
    </section>
  );
}

export function FoPageChrome({
  crumbs,
  eyebrow = "Facility Operations",
  title,
  description,
  actions,
  children
}: {
  crumbs: Array<{ href?: string; label: string }>;
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="flex-1 space-y-5 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs items={crumbs} />
      <header className="flex max-w-4xl flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            {eyebrow}
          </p>
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)] md:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      {children}
    </main>
  );
}

export function FoQuickActions({
  actions
}: {
  actions: Array<{ href: string; label: string; primary?: boolean }>;
}) {
  if (!actions.length) return null;
  return (
    <nav aria-label="Quick actions" className="flex flex-wrap gap-2">
      {actions.map((action) =>
        action.primary ? (
          <Link
            key={action.href + action.label}
            href={action.href}
            className={`inline-flex h-9 items-center justify-center rounded-md bg-[var(--mpa-color-brand-primary)] px-3 text-sm font-medium text-white hover:bg-[#0C5A48] ${linkFocus}`}
          >
            {action.label}
          </Link>
        ) : (
          <Link
            key={action.href + action.label}
            href={action.href}
            className={`inline-flex h-9 items-center justify-center rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 text-sm font-medium text-[var(--mpa-color-text-primary)] hover:border-[var(--mpa-color-brand-primary)] ${linkFocus}`}
          >
            {action.label}
          </Link>
        )
      )}
    </nav>
  );
}

export function FoDocumentsStrip({
  title = "Facility documents",
  detail = "Manuals, certificates, inspection reports, vendor contracts, warranties, and photos live in Document Intelligence — one library, many relationships.",
  entityType,
  query
}: {
  title?: string;
  detail?: string;
  entityType?: string;
  query?: string;
}) {
  return (
    <section
      aria-label="Documents"
      className="flex flex-col gap-2 rounded-md border border-dashed border-[var(--mpa-color-border-default)] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">{title}</p>
        <p className="mt-0.5 text-xs text-[var(--mpa-color-text-secondary)]">{detail}</p>
      </div>
      <Link
        href={documentsHref(entityType, query)}
        className={`inline-flex shrink-0 items-center justify-center rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--mpa-color-brand-primary)] hover:border-[var(--mpa-color-brand-primary)] ${linkFocus}`}
      >
        Open documents
      </Link>
    </section>
  );
}

export function FoGlanceCard({
  label,
  value,
  hint,
  tone = "neutral"
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "critical" | "watch" | "ok";
}) {
  const edge =
    tone === "critical"
      ? "border-l-[#C0392B]"
      : tone === "watch"
        ? "border-l-[#B45309]"
        : tone === "ok"
          ? "border-l-[#0E7A57]"
          : "border-l-[var(--mpa-color-border-default)]";
  return (
    <article
      className={`rounded-md border border-[var(--mpa-color-border-default)] border-l-[3px] bg-white p-4 ${edge}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
        {label}
      </p>
      <p className="mt-2 font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">{hint}</p> : null}
    </article>
  );
}

export function FoCapabilityCard({
  title,
  href,
  status,
  summary,
  documentsHref: docsHref
}: {
  title: string;
  href: string;
  status: "aligned" | "planned";
  summary: string;
  documentsHref?: string;
}) {
  return (
    <li className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 shadow-[0_1px_0_rgba(15,27,45,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
          {status === "aligned" ? (
            <Link
              href={href}
              className={`text-[var(--mpa-color-brand-primary)] underline-offset-2 hover:underline ${linkFocus}`}
            >
              {title}
            </Link>
          ) : (
            <span>{title}</span>
          )}
        </h3>
        <Badge variant={status === "aligned" ? "success" : "warning"}>
          {status === "aligned" ? "Live" : "Opens when live"}
        </Badge>
      </div>
      <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">{summary}</p>
      {docsHref ? (
        <p className="mt-3">
          <Link href={docsHref} className={`text-xs text-[var(--mpa-color-brand-primary)] underline ${linkFocus}`}>
            Related documents
          </Link>
        </p>
      ) : null}
    </li>
  );
}
