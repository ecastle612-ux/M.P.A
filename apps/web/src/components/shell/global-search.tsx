"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { searchCatalogForSku, type SearchResultItem } from "@mpa/shared";
import { Input } from "@mpa/ui";
import { useCommercialContext } from "./commercial-context";

export function GlobalSearch() {
  const router = useRouter();
  const { productSku } = useCommercialContext();
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [propertyResults, setPropertyResults] = useState<SearchResultItem[]>([]);
  const [residentResults, setResidentResults] = useState<SearchResultItem[]>([]);
  const [facilitySiteResults, setFacilitySiteResults] = useState<SearchResultItem[]>([]);
  const [facilityAssetResults, setFacilityAssetResults] = useState<SearchResultItem[]>([]);
  const [facilitySystemResults, setFacilitySystemResults] = useState<SearchResultItem[]>([]);
  const [facilityWorkResults, setFacilityWorkResults] = useState<SearchResultItem[]>([]);
  const [facilityPmResults, setFacilityPmResults] = useState<SearchResultItem[]>([]);
  const [facilityPartResults, setFacilityPartResults] = useState<SearchResultItem[]>([]);
  const [facilityInventoryResults, setFacilityInventoryResults] = useState<SearchResultItem[]>([]);
  const [facilityInspectionResults, setFacilityInspectionResults] = useState<SearchResultItem[]>([]);
  const [facilitySafetyResults, setFacilitySafetyResults] = useState<SearchResultItem[]>([]);
  const [facilityComplianceResults, setFacilityComplianceResults] = useState<SearchResultItem[]>([]);

  const catalogResults = useMemo(() => searchCatalogForSku(productSku, query), [productSku, query]);
  const results = useMemo(() => {
    if (!query.trim()) {
      return catalogResults;
    }
    return [
      ...residentResults,
      ...propertyResults,
      ...facilitySiteResults,
      ...facilityAssetResults,
      ...facilitySystemResults,
      ...facilityWorkResults,
      ...facilityPmResults,
      ...facilityPartResults,
      ...facilityInventoryResults,
      ...facilityInspectionResults,
      ...facilitySafetyResults,
      ...facilityComplianceResults,
      ...catalogResults
    ];
  }, [
    catalogResults,
    facilityAssetResults,
    facilityInventoryResults,
    facilityInspectionResults,
    facilitySafetyResults,
    facilityComplianceResults,
    facilityPartResults,
    facilityPmResults,
    facilitySiteResults,
    facilitySystemResults,
    facilityWorkResults,
    propertyResults,
    query,
    residentResults
  ]);
  const safeActiveIndex = results.length === 0 ? 0 : Math.min(activeIndex, results.length - 1);

  function clearLiveResults() {
    setPropertyResults([]);
    setResidentResults([]);
    setFacilitySiteResults([]);
    setFacilityAssetResults([]);
    setFacilitySystemResults([]);
    setFacilityWorkResults([]);
    setFacilityPmResults([]);
    setFacilityPartResults([]);
    setFacilityInventoryResults([]);
    setFacilityInspectionResults([]);
    setFacilitySafetyResults([]);
    setFacilityComplianceResults([]);
  }

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    const normalized = query.trim();
    if (!productSku || !normalized) {
      return;
    }
    let cancelled = false;
    const handle = window.setTimeout(() => {
      void (async () => {
        try {
          const [
            propertyResponse,
            residentResponse,
            facilityResponse,
            assetResponse,
            systemResponse,
            workResponse,
            pmResponse,
            partsResponse,
            inventoryResponse,
            inspectionsResponse,
            safetyResponse,
            complianceResponse
          ] = await Promise.all([
            fetch(`/api/pm/properties/search?q=${encodeURIComponent(normalized)}`),
            fetch(`/api/pm/residents/search?q=${encodeURIComponent(normalized)}`),
            fetch(`/api/facility/sites/search?q=${encodeURIComponent(normalized)}`),
            fetch(`/api/facility/assets/search?q=${encodeURIComponent(normalized)}`),
            fetch(`/api/facility/systems/search?q=${encodeURIComponent(normalized)}`),
            fetch(`/api/facility/operations/search?q=${encodeURIComponent(normalized)}`),
            fetch(`/api/facility/preventive/search?q=${encodeURIComponent(normalized)}`),
            fetch(`/api/facility/parts/search?q=${encodeURIComponent(normalized)}`),
            fetch(`/api/facility/inventory/search?q=${encodeURIComponent(normalized)}`),
            fetch(`/api/facility/inspections/search?q=${encodeURIComponent(normalized)}`),
            fetch(`/api/facility/safety/search?q=${encodeURIComponent(normalized)}`),
            fetch(`/api/facility/compliance/search?q=${encodeURIComponent(normalized)}`)
          ]);
          if (cancelled) {
            return;
          }
          if (propertyResponse.ok) {
            const payload = (await propertyResponse.json()) as {
              results?: Array<{ id: string; label: string; href: string; group: string }>;
            };
            setPropertyResults(
              (payload.results ?? []).map((item) => ({
                id: `property:${item.id}`,
                label: item.label,
                href: item.href,
                group: item.group,
                entitlement: "pm.properties"
              }))
            );
          }
          if (residentResponse.ok) {
            const payload = (await residentResponse.json()) as {
              results?: Array<{ id: string; label: string; href: string; group: string }>;
            };
            setResidentResults(
              (payload.results ?? []).map((item) => ({
                id: `resident:${item.id}`,
                label: item.label,
                href: item.href,
                group: item.group,
                entitlement: "pm.residents"
              }))
            );
          }
          if (facilityResponse.ok) {
            const payload = (await facilityResponse.json()) as {
              results?: Array<{ id: string; label: string; href: string; group: string }>;
            };
            setFacilitySiteResults(
              (payload.results ?? []).map((item) => ({
                id: `facility-site:${item.id}`,
                label: item.label,
                href: item.href,
                group: item.group,
                entitlement: "facility.mission_control"
              }))
            );
          }
          if (assetResponse.ok) {
            const payload = (await assetResponse.json()) as {
              results?: Array<{ id: string; label: string; href: string; group: string }>;
            };
            setFacilityAssetResults(
              (payload.results ?? []).map((item) => ({
                id: `facility-asset:${item.id}`,
                label: item.label,
                href: item.href,
                group: item.group,
                entitlement: "facility.assets"
              }))
            );
          }
          if (systemResponse.ok) {
            const payload = (await systemResponse.json()) as {
              results?: Array<{ id: string; label: string; href: string; group: string }>;
            };
            setFacilitySystemResults(
              (payload.results ?? []).map((item) => ({
                id: `facility-system:${item.id}`,
                label: item.label,
                href: item.href,
                group: item.group,
                entitlement: "facility.building_systems"
              }))
            );
          }
          if (workResponse.ok) {
            const payload = (await workResponse.json()) as {
              results?: Array<{ id: string; label: string; href: string; group: string }>;
            };
            setFacilityWorkResults(
              (payload.results ?? []).map((item) => ({
                id: `facility-work:${item.id}`,
                label: item.label,
                href: item.href,
                group: item.group,
                entitlement: "facility.operations"
              }))
            );
          }
          if (pmResponse.ok) {
            const payload = (await pmResponse.json()) as {
              results?: Array<{ id: string; label: string; href: string; group: string }>;
            };
            setFacilityPmResults(
              (payload.results ?? []).map((item) => ({
                id: `facility-pm:${item.id}`,
                label: item.label,
                href: item.href,
                group: item.group,
                entitlement: "facility.preventive"
              }))
            );
          }
          if (partsResponse.ok) {
            const payload = (await partsResponse.json()) as {
              results?: Array<{ id: string; label: string; href: string; group: string }>;
            };
            setFacilityPartResults(
              (payload.results ?? []).map((item) => ({
                id: `facility-part:${item.id}`,
                label: item.label,
                href: item.href,
                group: item.group,
                entitlement: "facility.parts"
              }))
            );
          }
          if (inventoryResponse.ok) {
            const payload = (await inventoryResponse.json()) as {
              results?: Array<{ id: string; label: string; href: string; group: string }>;
            };
            setFacilityInventoryResults(
              (payload.results ?? []).map((item) => ({
                id: `facility-inventory:${item.id}`,
                label: item.label,
                href: item.href,
                group: item.group,
                entitlement: "facility.inventory"
              }))
            );
          }
          if (inspectionsResponse.ok) {
            const payload = (await inspectionsResponse.json()) as {
              results?: Array<{ id: string; label: string; href: string; group: string }>;
            };
            setFacilityInspectionResults(
              (payload.results ?? []).map((item) => ({
                id: `facility-inspection:${item.id}`,
                label: item.label,
                href: item.href,
                group: item.group,
                entitlement: "facility.inspections"
              }))
            );
          }
          if (safetyResponse.ok) {
            const payload = (await safetyResponse.json()) as {
              results?: Array<{ id: string; label: string; href: string; group: string }>;
            };
            setFacilitySafetyResults(
              (payload.results ?? []).map((item) => ({
                id: `facility-safety:${item.id}`,
                label: item.label,
                href: item.href,
                group: item.group,
                entitlement: "facility.safety"
              }))
            );
          }
          if (complianceResponse.ok) {
            const payload = (await complianceResponse.json()) as {
              results?: Array<{ id: string; label: string; href: string; group: string }>;
            };
            setFacilityComplianceResults(
              (payload.results ?? []).map((item) => ({
                id: `facility-compliance:${item.id}`,
                label: item.label,
                href: item.href,
                group: item.group,
                entitlement: "facility.compliance"
              }))
            );
          }
        } catch {
          // Keep last successful live results; catalog still works.
        }
      })();
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [productSku, query]);

  function navigateTo(href: string) {
    setOpen(false);
    setQuery("");
    clearLiveResults();
    router.push(href);
  }

  return (
    <div ref={containerRef} className="relative hidden min-w-[240px] flex-1 md:block">
      <Input
        aria-label="Search entitled workspaces, properties, and residents"
        aria-controls={listId}
        aria-expanded={open}
        aria-autocomplete="list"
        role="combobox"
        placeholder="Search workspaces, properties, residents..."
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          const next = event.target.value;
          setQuery(next);
          if (!next.trim()) {
            clearLiveResults();
          }
          setActiveIndex(0);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
            setOpen(true);
            return;
          }
          if (event.key === "Escape") {
            setOpen(false);
            return;
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
          }
          if (event.key === "Enter" && results[safeActiveIndex]) {
            event.preventDefault();
            navigateTo(results[safeActiveIndex].href);
          }
        }}
      />
      {open ? (
        <div
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-80 w-full overflow-auto rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] shadow-lg"
        >
          {results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)]">
              No entitled workspaces, properties, or residents match.
            </p>
          ) : (
            <ul>
              {results.map((item, index) => (
                <li key={item.id} role="option" aria-selected={index === safeActiveIndex}>
                  <button
                    type="button"
                    className={`flex w-full flex-col px-3 py-2 text-left text-sm ${
                      index === safeActiveIndex
                        ? "bg-[var(--mpa-color-bg-app)]"
                        : "hover:bg-[var(--mpa-color-bg-app)]"
                    }`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => navigateTo(item.href)}
                  >
                    <span className="font-medium text-[var(--mpa-color-text-primary)]">
                      {item.label}
                    </span>
                    <span className="text-xs text-[var(--mpa-color-text-secondary)]">
                      {item.group}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
