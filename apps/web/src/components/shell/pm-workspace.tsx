"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, Button } from "@mpa/ui";
import { Breadcrumbs } from "./breadcrumbs";

const linkFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)] focus-visible:ring-offset-2";

export function documentsHref(entityType?: string, query?: string): string {
  const params = new URLSearchParams();
  if (entityType) params.set("entityType", entityType);
  if (query) params.set("q", query);
  const qs = params.toString();
  return qs ? `/shared/documents?${qs}` : "/shared/documents";
}

export function PmStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  let variant: "success" | "warning" | "danger" | "neutral" | "info" = "neutral";
  if (["active", "occupied", "paid", "complete", "completed", "closed"].some((k) => normalized.includes(k))) {
    variant = "success";
  } else if (
    ["pending", "draft", "sent", "in_progress", "assigned", "open", "available"].some((k) =>
      normalized.includes(k)
    )
  ) {
    variant = "warning";
  } else if (
    ["overdue", "emergency", "critical", "failed", "cancelled", "delinquent", "vacant"].some((k) =>
      normalized.includes(k)
    )
  ) {
    variant = "danger";
  } else if (["info", "trial"].some((k) => normalized.includes(k))) {
    variant = "info";
  }
  return <Badge variant={variant}>{status}</Badge>;
}

export function PmPageChrome({
  crumbs,
  eyebrow,
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
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)] md:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm text-[var(--mpa-color-text-secondary)]">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      {children}
    </main>
  );
}

export function PmDirectoryToolbar({
  id,
  label,
  value,
  onChange,
  placeholder,
  showing,
  total,
  filters
}: {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  showing: number;
  total: number;
  filters?: ReactNode;
}) {
  return (
    <section
      aria-label="Directory filters"
      className="flex flex-col gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-3 sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="min-w-0 flex-1">
        <label
          htmlFor={id}
          className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]"
        >
          {label ?? "Search"}
        </label>
        <input
          id={id}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm text-[var(--mpa-color-text-primary)] ${linkFocus}`}
        />
      </div>
      {filters}
      <p className="text-xs tabular-nums text-[var(--mpa-color-text-secondary)]" aria-live="polite">
        Showing {showing} of {total}
      </p>
    </section>
  );
}

export function PmDocumentsStrip({
  entityType,
  title = "Documents",
  detail = "Property files, leases, inspections, invoices, and work-order attachments live in Documents — ready for Document Intelligence later."
}: {
  entityType?: string;
  title?: string;
  detail?: string;
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
        href={documentsHref(entityType)}
        className={`inline-flex shrink-0 items-center justify-center rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--mpa-color-brand-primary)] hover:border-[var(--mpa-color-brand-primary)] ${linkFocus}`}
      >
        Open documents
      </Link>
    </section>
  );
}

export function PmQuickActions({
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

export function PmErrorRetry({
  title,
  description,
  onRetry
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-md border border-[var(--mpa-color-border-default)] border-l-[3px] border-l-[#C0392B] bg-white p-4"
    >
      <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">{title}</p>
      <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{description}</p>
      {onRetry ? (
        <Button type="button" className="mt-3" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}

export function PmEntityCard({
  title,
  href,
  meta,
  status,
  footer,
  children
}: {
  title: string;
  href: string;
  meta?: string;
  status?: string;
  footer?: string;
  children?: ReactNode;
}) {
  return (
    <li className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 shadow-[0_1px_0_rgba(15,27,45,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
            <Link
              href={href}
              className={`text-[var(--mpa-color-brand-primary)] underline-offset-2 hover:underline ${linkFocus}`}
            >
              {title}
            </Link>
          </h2>
          {meta ? (
            <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">{meta}</p>
          ) : null}
        </div>
        {status ? <PmStatusBadge status={status} /> : null}
      </div>
      {children}
      {footer ? (
        <p className="mt-3 text-sm text-[var(--mpa-color-text-secondary)]">{footer}</p>
      ) : null}
    </li>
  );
}
