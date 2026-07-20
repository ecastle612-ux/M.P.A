"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@mpa/ui";

export function RepairHistoryFilters({
  vendorOptions,
  unitOptions = [],
  initialSearch = "",
  initialVendorId = "",
  initialUnitId = ""
}: {
  vendorOptions: Array<{ id: string; label: string }>;
  unitOptions?: Array<{ id: string; label: string }>;
  initialSearch?: string;
  initialVendorId?: string;
  initialUnitId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);
  const [vendorId, setVendorId] = useState(initialVendorId);
  const [unitId, setUnitId] = useState(initialUnitId);

  function applyFilters(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (vendorId) params.set("vendorId", vendorId);
    if (unitId) params.set("unitId", unitId);
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  function clearFilters() {
    setSearch("");
    setVendorId("");
    setUnitId("");
    startTransition(() => {
      router.push(pathname);
    });
  }

  return (
    <form
      onSubmit={applyFilters}
      className="flex flex-wrap items-end gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)] p-3"
    >
      <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs text-[var(--mpa-color-text-secondary)]">
        Search issue / vendor
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm text-[var(--mpa-color-text-primary)]"
          placeholder="Leak, HVAC, vendor name…"
        />
      </label>
      <label className="flex min-w-[10rem] flex-col gap-1 text-xs text-[var(--mpa-color-text-secondary)]">
        Service provider
        <select
          value={vendorId}
          onChange={(event) => setVendorId(event.target.value)}
          className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm text-[var(--mpa-color-text-primary)]"
        >
          <option value="">All</option>
          {vendorOptions.map((vendor) => (
            <option key={vendor.id} value={vendor.id}>
              {vendor.label}
            </option>
          ))}
        </select>
      </label>
      {unitOptions.length > 0 ? (
        <label className="flex min-w-[10rem] flex-col gap-1 text-xs text-[var(--mpa-color-text-secondary)]">
          Unit
          <select
            value={unitId}
            onChange={(event) => setUnitId(event.target.value)}
            className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm text-[var(--mpa-color-text-primary)]"
          >
            <option value="">All units</option>
            {unitOptions.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Filtering…" : "Filter"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={clearFilters} disabled={isPending}>
          Clear
        </Button>
      </div>
    </form>
  );
}
