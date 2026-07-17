"use client";

import type { ReactNode } from "react";
import { Button, Card, PageHeader } from "@mpa/ui";

export function DataTableLayout({
  overline,
  title,
  description,
  actions,
  filters,
  error,
  emptyFilteredMessage,
  showEmptyFiltered = false,
  children,
  page,
  pageCount,
  totalItems,
  pageSize,
  onPreviousPage,
  onNextPage
}: {
  overline?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  filters?: ReactNode;
  error?: string | null;
  emptyFilteredMessage?: string;
  showEmptyFiltered?: boolean;
  children: ReactNode;
  page: number;
  pageCount: number;
  totalItems: number;
  pageSize: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
}) {
  const rangeStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalItems);

  return (
    <div className="space-y-5">
      <PageHeader
        title={title}
        {...(overline ? { overline } : {})}
        {...(description ? { description } : {})}
        {...(actions ? { actions } : {})}
      />
      <Card variant="elevated" padding="none" className="overflow-hidden">
        {filters ? (
          <div className="grid gap-3 border-b border-[var(--mpa-color-border-subtle)] p-4 md:p-5 lg:grid-cols-[2fr_1fr_1fr]">
            {filters}
          </div>
        ) : null}
        {error ? <p className="px-5 pt-4 text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}
        {showEmptyFiltered && emptyFilteredMessage ? (
          <p className="mx-5 my-5 rounded-[var(--mpa-radius-lg)] border border-dashed border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)]/50 p-4 text-sm text-[var(--mpa-color-text-secondary)]">
            {emptyFilteredMessage}
          </p>
        ) : null}
        {children}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--mpa-color-border-subtle)] px-4 py-4 md:px-5">
          <p className="text-xs text-[var(--mpa-color-text-muted)]">
            {totalItems === 0 ? "Showing 0 of 0" : `Showing ${rangeStart}–${rangeEnd} of ${totalItems}`}
          </p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="sm" disabled={page <= 1} onClick={onPreviousPage}>
              Previous
            </Button>
            <span className="min-w-[5rem] text-center text-xs text-[var(--mpa-color-text-muted)]">
              Page {page} of {pageCount}
            </span>
            <Button type="button" variant="secondary" size="sm" disabled={page >= pageCount} onClick={onNextPage}>
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
