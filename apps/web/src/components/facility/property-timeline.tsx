"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Card } from "@mpa/ui";
import type { FacilityTimelineEvent, TimelineFilter } from "../../lib/facility/contracts";
import {
  TIMELINE_FILTERS,
  hrefForTimelineEvent,
  timelineIconForEventType
} from "../../lib/facility/contracts";

const FILTER_LABELS: Record<TimelineFilter, string> = {
  all: "All",
  repairs: "Repairs",
  residents: "Residents",
  leases: "Leases",
  financial: "Financial",
  inspections: "Inspections",
  documents: "Documents",
  assets: "Assets",
  future: "Future"
};

export function PropertyTimeline({
  events,
  propertyName,
  initialFilter = "all",
  initialSearch = "",
  emptyLabel = "No timeline events yet — completed repairs and move-ins will appear here.",
  queryParamPrefix = "tl"
}: {
  events: FacilityTimelineEvent[];
  propertyName?: string | null;
  initialFilter?: TimelineFilter;
  initialSearch?: string;
  emptyLabel?: string;
  queryParamPrefix?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<TimelineFilter>(initialFilter);
  const [search, setSearch] = useState(initialSearch);

  function apply(nextFilter: TimelineFilter, nextSearch: string) {
    setFilter(nextFilter);
    setSearch(nextSearch);
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    if (nextFilter === "all") params.delete(`${queryParamPrefix}Filter`);
    else params.set(`${queryParamPrefix}Filter`, nextFilter);
    if (nextSearch.trim()) params.set(`${queryParamPrefix}Q`, nextSearch.trim());
    else params.delete(`${queryParamPrefix}Q`);
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  return (
    <Card variant="elevated" className="space-y-3" id="property-timeline">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="mpa-section-title">Property timeline</h2>
          <p className="mt-0.5 text-sm leading-snug text-[var(--mpa-color-text-secondary)]">
            Permanent operational history{propertyName ? ` for ${propertyName}` : ""}, newest first.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TIMELINE_FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => apply(value, search)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              filter === value
                ? "bg-[var(--mpa-color-brand-primary)] text-[var(--mpa-color-text-inverse)]"
                : "bg-[var(--mpa-color-bg-surface-muted)] text-[var(--mpa-color-text-secondary)] hover:bg-[var(--mpa-color-interactive-row-hover)]"
            }`}
          >
            {FILTER_LABELS[value]}
          </button>
        ))}
      </div>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          apply(filter, search);
        }}
      >
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search timeline…"
          className="min-w-[14rem] flex-1 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-1.5 text-sm"
        />
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Searching…" : "Search"}
        </Button>
      </form>

      {events.length === 0 ? (
        <p className="text-sm text-[var(--mpa-color-text-muted)]">{emptyLabel}</p>
      ) : (
        <ol className="space-y-2">
          {events.map((event) => {
            const href = hrefForTimelineEvent(event);
            const occurred = new Date(event.occurredAt);
            return (
              <li
                key={event.id}
                className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2.5"
              >
                <div className="flex gap-2.5">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--mpa-color-bg-surface-muted)] text-sm"
                    aria-hidden
                  >
                    {timelineIconForEventType(event.eventType)}
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                      <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{event.title}</p>
                      <p className="text-xs text-[var(--mpa-color-text-muted)]">
                        {occurred.toLocaleDateString()} · {occurred.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                    <p className="text-sm leading-snug text-[var(--mpa-color-text-secondary)]">{event.summary}</p>
                    <p className="text-xs text-[var(--mpa-color-text-muted)]">
                      {[
                        event.propertyName,
                        event.unitNumber ? `Unit ${event.unitNumber}` : null,
                        event.performedByLabel ? `By ${event.performedByLabel}` : null,
                        event.serviceProviderDisplayName
                          ? `Provider · ${event.serviceProviderDisplayName}`
                          : null
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {href ? (
                      <Link
                        href={href}
                        className="inline-block pt-0.5 text-xs font-medium text-[var(--mpa-color-brand-primary)]"
                      >
                        Quick view
                      </Link>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
