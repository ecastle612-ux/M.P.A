"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Badge, resolveHealthToneVariant, resolveStatusBadgeVariant } from "@mpa/ui";
import type { HealthTone } from "../../lib/admin/command-center-metrics";

export type OpsFilterOption = { value: string; label: string };

export type OpsColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
};

export function HealthBadge({ tone, label }: { tone: HealthTone; label?: string }) {
  return <Badge variant={resolveHealthToneVariant(tone)}>{label ?? tone}</Badge>;
}

export function StatusBadge({ value }: { value: string }) {
  return <Badge variant={resolveStatusBadgeVariant(value)}>{value}</Badge>;
}

export function OpsDirectoryTable<T extends { id: string }>({
  caption,
  rows,
  columns,
  searchPlaceholder = "Search…",
  searchText,
  filters = [],
  emptyMessage = "No rows match the current filters."
}: {
  caption: string;
  rows: T[];
  columns: OpsColumn<T>[];
  searchPlaceholder?: string;
  searchText: (row: T) => string;
  filters?: Array<{
    id: string;
    label: string;
    options: OpsFilterOption[];
    valueOf: (row: T) => string;
  }>;
  emptyMessage?: string;
}) {
  const [query, setQuery] = useState("");
  const [filterState, setFilterState] = useState<Record<string, string>>(() =>
    Object.fromEntries(filters.map((f) => [f.id, "all"]))
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (q && !searchText(row).toLowerCase().includes(q)) return false;
      for (const filter of filters) {
        const selected = filterState[filter.id] ?? "all";
        if (selected !== "all" && filter.valueOf(row) !== selected) return false;
      }
      return true;
    });
  }, [rows, query, filterState, filters, searchText]);

  return (
    <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <label
            htmlFor={`ops-search-${caption.replace(/\s+/g, "-").toLowerCase()}`}
            className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]"
          >
            Search
          </label>
          <input
            id={`ops-search-${caption.replace(/\s+/g, "-").toLowerCase()}`}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm text-[var(--mpa-color-text-primary)]"
          />
        </div>
        {filters.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {filters.map((filter) => (
              <div key={filter.id} className="min-w-[10rem]">
                <label
                  htmlFor={`ops-filter-${filter.id}`}
                  className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]"
                >
                  {filter.label}
                </label>
                <select
                  id={`ops-filter-${filter.id}`}
                  value={filterState[filter.id] ?? "all"}
                  onChange={(e) =>
                    setFilterState((prev) => ({ ...prev, [filter.id]: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm"
                >
                  <option value="all">All</option>
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <p className="text-xs text-[var(--mpa-color-text-secondary)]" aria-live="polite">
        Showing {filtered.length} of {rows.length}
      </p>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-[var(--mpa-color-border-default)]">
              {columns.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  className="whitespace-nowrap py-2 pr-4 text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-6 text-sm text-[var(--mpa-color-text-secondary)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[var(--mpa-color-border-subtle)] align-top"
                >
                  {columns.map((col) => (
                    <td key={col.id} className="py-2.5 pr-4 text-[var(--mpa-color-text-primary)]">
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
