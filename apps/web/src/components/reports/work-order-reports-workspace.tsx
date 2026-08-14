"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatCompletionDuration,
  WORK_ORDER_CATEGORIES,
  WORK_ORDER_CATEGORY_LABELS,
  WORK_ORDER_PRIORITIES,
  WORK_ORDER_PRIORITY_LABELS,
  WORK_ORDER_STATUSES,
  WORK_ORDER_STATUS_LABELS,
  type WorkOrderReportSnapshot,
  type WorkSurface
} from "@mpa/shared";
import { Badge, Button, EmptyState, Input, Skeleton } from "@mpa/ui";
import { FoPageChrome } from "../shell/fo-workspace";
import { PmPageChrome } from "../shell/pm-workspace";

type FilterOptions = {
  properties: Array<{ id: string; name: string }>;
  vendors: Array<{ id: string; name: string }>;
  users: Array<{ userId: string; displayName: string }>;
};

function defaultDates() {
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  return {
    dateFrom: start.toISOString().slice(0, 10),
    dateTo: end.toISOString().slice(0, 10)
  };
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
        {value}
      </p>
    </div>
  );
}

function BreakdownList({
  title,
  items
}: {
  title: string;
  items: Array<{ label: string; count: number }>;
}) {
  return (
    <section className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
      <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">No data for this period</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li
              key={`${title}-${item.label}`}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="text-[var(--mpa-color-text-primary)]">{item.label}</span>
              <Badge variant="neutral">{item.count}</Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function WorkOrderReportsWorkspace({
  surface
}: {
  surface: WorkSurface;
}) {
  const dates = defaultDates();
  const apiBase =
    surface === "facility" ? "/api/facility/reports/work-orders" : "/api/pm/reports/work-orders";
  const [dateFrom, setDateFrom] = useState(dates.dateFrom);
  const [dateTo, setDateTo] = useState(dates.dateTo);
  const [dateMode, setDateMode] = useState<"created" | "completed">("created");
  const [propertyId, setPropertyId] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [userId, setUserId] = useState("");
  const [snapshot, setSnapshot] = useState<WorkOrderReportSnapshot | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("dateFrom", dateFrom);
    params.set("dateTo", dateTo);
    params.set("dateMode", dateMode);
    if (propertyId) params.set("propertyId", propertyId);
    if (location.trim()) params.set("location", location.trim());
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (category) params.set("category", category);
    if (vendorId === "unassigned") params.set("unassignedVendor", "1");
    else if (vendorId) params.set("vendorId", vendorId);
    if (userId) params.set("userId", userId);
    return params.toString();
  }, [dateFrom, dateTo, dateMode, propertyId, location, status, priority, category, vendorId, userId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const response = await fetch(`${apiBase}?${queryString}`);
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error ?? "Failed to load work order report");
        }
        if (!cancelled) {
          setSnapshot(body.snapshot as WorkOrderReportSnapshot);
          setFilterOptions(body.filterOptions as FilterOptions);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setSnapshot(null);
          setError(err instanceof Error ? err.message : "Failed to load report");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiBase, queryString]);

  async function download(format: "csv" | "pdf") {
    setExporting(format);
    try {
      const response = await fetch(`${apiBase}/export?${queryString}&format=${format}`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Export failed (${response.status})`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        format === "csv"
          ? `work-orders-${surface}.csv`
          : `work-orders-${surface}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(null);
    }
  }

  const chromeProps = {
    crumbs:
      surface === "facility"
        ? [
            { href: "/facility/mission-control", label: "Facility Mission Control" },
            { label: "Reports" }
          ]
        : [
            { href: "/pm/mission-control", label: "Property Mission Control" },
            { href: "/pm/maintenance", label: "Maintenance" },
            { label: "Work order reports" }
          ],
    eyebrow: surface === "facility" ? "Facility Operations" : "Property Operations",
    title: "Work order reports",
    description: "What happened in operations for the selected period — download CSV or PDF for leadership.",
    actions: (
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" disabled={!!exporting || !snapshot} onClick={() => void download("csv")}>
          {exporting === "csv" ? "Preparing CSV…" : "Download CSV"}
        </Button>
        <Button type="button" disabled={!!exporting || !snapshot} onClick={() => void download("pdf")}>
          {exporting === "pdf" ? "Preparing PDF…" : "Download PDF"}
        </Button>
      </div>
    )
  };

  const body = (
    <>
      <section className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
          Filters
        </h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1 text-sm">
            <span className="text-[var(--mpa-color-text-secondary)]">From</span>
            <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-[var(--mpa-color-text-secondary)]">To</span>
            <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-[var(--mpa-color-text-secondary)]">Date field</span>
            <select
              className="w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2"
              value={dateMode}
              onChange={(event) => setDateMode(event.target.value as "created" | "completed")}
            >
              <option value="created">Created in period</option>
              <option value="completed">Completed in period</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-[var(--mpa-color-text-secondary)]">Location</span>
            <Input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Building, unit, asset…"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-[var(--mpa-color-text-secondary)]">
              {surface === "facility" ? "Facility / property" : "Property"}
            </span>
            <select
              className="w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2"
              value={propertyId}
              onChange={(event) => setPropertyId(event.target.value)}
            >
              <option value="">All</option>
              {(filterOptions?.properties ?? []).map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-[var(--mpa-color-text-secondary)]">Status</span>
            <select
              className="w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">All</option>
              {WORK_ORDER_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {WORK_ORDER_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-[var(--mpa-color-text-secondary)]">Priority</span>
            <select
              className="w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            >
              <option value="">All</option>
              {WORK_ORDER_PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {WORK_ORDER_PRIORITY_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-[var(--mpa-color-text-secondary)]">Category</span>
            <select
              className="w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">All</option>
              {WORK_ORDER_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {WORK_ORDER_CATEGORY_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-[var(--mpa-color-text-secondary)]">Vendor</span>
            <select
              className="w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2"
              value={vendorId}
              onChange={(event) => setVendorId(event.target.value)}
            >
              <option value="">All</option>
              <option value="unassigned">Unassigned vendor</option>
              {(filterOptions?.vendors ?? []).map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-[var(--mpa-color-text-secondary)]">Assigned user</span>
            <select
              className="w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
            >
              <option value="">All</option>
              {(filterOptions?.users ?? []).map((user) => (
                <option key={user.userId} value={user.userId}>
                  {user.displayName}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {error ? (
        <p className="rounded-md border border-[var(--mpa-color-status-danger)]/40 bg-[var(--mpa-color-status-danger-subtle)] px-3 py-2 text-sm" role="alert">
          {error}
        </p>
      ) : null}

      {loading && !snapshot ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : null}

      {!loading && !snapshot && !error ? (
        <EmptyState title="No report data" description="Adjust filters and try again." />
      ) : null}

      {snapshot ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard label="Total" value={String(snapshot.metrics.total)} />
            <MetricCard label="Open" value={String(snapshot.metrics.open)} />
            <MetricCard label="In progress" value={String(snapshot.metrics.inProgress)} />
            <MetricCard label="Completed" value={String(snapshot.metrics.completed)} />
            <MetricCard
              label="Avg completion"
              value={formatCompletionDuration(snapshot.metrics.averageCompletionHours)}
            />
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            <BreakdownList title="By category" items={snapshot.metrics.byCategory} />
            <BreakdownList title="By priority" items={snapshot.metrics.byPriority} />
            <BreakdownList title="By vendor" items={snapshot.metrics.byVendor} />
          </div>

          {snapshot.truncated ? (
            <p className="text-sm text-[var(--mpa-color-status-warning)]">
              Showing the first {snapshot.rows.length} matching rows. Narrow filters for a complete extract.
            </p>
          ) : null}
        </>
      ) : null}
    </>
  );

  if (surface === "facility") {
    return <FoPageChrome {...chromeProps}>{body}</FoPageChrome>;
  }

  return <PmPageChrome {...chromeProps}>{body}</PmPageChrome>;
}
