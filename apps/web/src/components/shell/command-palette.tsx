"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { searchCatalogForSku } from "@mpa/shared";
import { CommandPaletteShell } from "@mpa/ui";
import { useCommercialContext } from "./commercial-context";

export function CommandPalette() {
  const router = useRouter();
  const { productSku, productLabel } = useCommercialContext();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [propertyItems, setPropertyItems] = useState<Array<{ id: string; label: string }>>([]);
  const [residentItems, setResidentItems] = useState<Array<{ id: string; label: string }>>([]);
  const [facilitySiteItems, setFacilitySiteItems] = useState<Array<{ id: string; label: string }>>([]);
  const [facilityAssetItems, setFacilityAssetItems] = useState<Array<{ id: string; label: string }>>([]);
  const [facilitySystemItems, setFacilitySystemItems] = useState<Array<{ id: string; label: string }>>([]);
  const [facilityWorkItems, setFacilityWorkItems] = useState<Array<{ id: string; label: string }>>([]);
  const [facilityPmItems, setFacilityPmItems] = useState<Array<{ id: string; label: string }>>([]);
  const [facilityPartItems, setFacilityPartItems] = useState<Array<{ id: string; label: string }>>([]);
  const [facilityInventoryItems, setFacilityInventoryItems] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [facilityInspectionItems, setFacilityInspectionItems] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [facilitySafetyItems, setFacilitySafetyItems] = useState<Array<{ id: string; label: string }>>([]);
  const [facilityComplianceItems, setFacilityComplianceItems] = useState<
    Array<{ id: string; label: string }>
  >([]);

  useEffect(() => {
    function handler(event: KeyboardEvent) {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (isShortcut) {
        event.preventDefault();
        setOpen((value) => !value);
        return;
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!open || !productSku) {
      return;
    }
    let cancelled = false;
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
          fetch(`/api/pm/properties/search?q=${encodeURIComponent(query.trim())}`),
          fetch(`/api/pm/residents/search?q=${encodeURIComponent(query.trim())}`),
          fetch(`/api/facility/sites/search?q=${encodeURIComponent(query.trim())}`),
          fetch(`/api/facility/assets/search?q=${encodeURIComponent(query.trim())}`),
          fetch(`/api/facility/systems/search?q=${encodeURIComponent(query.trim())}`),
          fetch(`/api/facility/operations/search?q=${encodeURIComponent(query.trim())}`),
          fetch(`/api/facility/preventive/search?q=${encodeURIComponent(query.trim())}`),
          fetch(`/api/facility/parts/search?q=${encodeURIComponent(query.trim())}`),
          fetch(`/api/facility/inventory/search?q=${encodeURIComponent(query.trim())}`),
          fetch(`/api/facility/inspections/search?q=${encodeURIComponent(query.trim())}`),
          fetch(`/api/facility/safety/search?q=${encodeURIComponent(query.trim())}`),
          fetch(`/api/facility/compliance/search?q=${encodeURIComponent(query.trim())}`)
        ]);
        if (!cancelled && propertyResponse.ok) {
          const payload = (await propertyResponse.json()) as {
            results?: Array<{ id: string; label: string; href: string }>;
          };
          setPropertyItems(
            (payload.results ?? []).map((item) => ({
              id: item.href,
              label: item.label
            }))
          );
        }
        if (!cancelled && residentResponse.ok) {
          const payload = (await residentResponse.json()) as {
            results?: Array<{ id: string; label: string; href: string }>;
          };
          setResidentItems(
            (payload.results ?? []).map((item) => ({
              id: item.href,
              label: item.label
            }))
          );
        }
        if (!cancelled && facilityResponse.ok) {
          const payload = (await facilityResponse.json()) as {
            results?: Array<{ id: string; label: string; href: string }>;
          };
          setFacilitySiteItems(
            (payload.results ?? []).map((item) => ({
              id: item.href,
              label: item.label
            }))
          );
        }
        if (!cancelled && assetResponse.ok) {
          const payload = (await assetResponse.json()) as {
            results?: Array<{ id: string; label: string; href: string }>;
          };
          setFacilityAssetItems(
            (payload.results ?? []).map((item) => ({
              id: item.href,
              label: item.label
            }))
          );
        }
        if (!cancelled && systemResponse.ok) {
          const payload = (await systemResponse.json()) as {
            results?: Array<{ id: string; label: string; href: string }>;
          };
          setFacilitySystemItems(
            (payload.results ?? []).map((item) => ({
              id: item.href,
              label: item.label
            }))
          );
        }
        if (!cancelled && workResponse.ok) {
          const payload = (await workResponse.json()) as {
            results?: Array<{ id: string; label: string; href: string }>;
          };
          setFacilityWorkItems(
            (payload.results ?? []).map((item) => ({
              id: item.href,
              label: item.label
            }))
          );
        }
        if (!cancelled && pmResponse.ok) {
          const payload = (await pmResponse.json()) as {
            results?: Array<{ id: string; label: string; href: string }>;
          };
          setFacilityPmItems(
            (payload.results ?? []).map((item) => ({
              id: item.href,
              label: item.label
            }))
          );
        }
        if (!cancelled && partsResponse.ok) {
          const payload = (await partsResponse.json()) as {
            results?: Array<{ id: string; label: string; href: string }>;
          };
          setFacilityPartItems(
            (payload.results ?? []).map((item) => ({
              id: item.href,
              label: item.label
            }))
          );
        }
        if (!cancelled && inventoryResponse.ok) {
          const payload = (await inventoryResponse.json()) as {
            results?: Array<{ id: string; label: string; href: string }>;
          };
          setFacilityInventoryItems(
            (payload.results ?? []).map((item) => ({
              id: item.href,
              label: item.label
            }))
          );
        }
        if (!cancelled && inspectionsResponse.ok) {
          const payload = (await inspectionsResponse.json()) as {
            results?: Array<{ id: string; label: string; href: string }>;
          };
          setFacilityInspectionItems(
            (payload.results ?? []).map((item) => ({
              id: item.href,
              label: item.label
            }))
          );
        }
        if (!cancelled && safetyResponse.ok) {
          const payload = (await safetyResponse.json()) as {
            results?: Array<{ id: string; label: string; href: string }>;
          };
          setFacilitySafetyItems(
            (payload.results ?? []).map((item) => ({
              id: item.href,
              label: item.label
            }))
          );
        }
        if (!cancelled && complianceResponse.ok) {
          const payload = (await complianceResponse.json()) as {
            results?: Array<{ id: string; label: string; href: string }>;
          };
          setFacilityComplianceItems(
            (payload.results ?? []).map((item) => ({
              id: item.href,
              label: item.label
            }))
          );
        }
      } catch {
        if (!cancelled) {
          setPropertyItems([]);
          setResidentItems([]);
          setFacilitySiteItems([]);
          setFacilityAssetItems([]);
          setFacilitySystemItems([]);
          setFacilityWorkItems([]);
          setFacilityPmItems([]);
          setFacilityPartItems([]);
          setFacilityInventoryItems([]);
          setFacilityInspectionItems([]);
          setFacilitySafetyItems([]);
          setFacilityComplianceItems([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, productSku, query]);

  const sections = useMemo(() => {
    const results = searchCatalogForSku(productSku, query);
    const byGroup = new Map<string, Array<{ id: string; label: string; shortcut?: string }>>();
    for (const item of results) {
      const group = byGroup.get(item.group) ?? [];
      group.push({ id: item.href, label: item.label });
      byGroup.set(item.group, group);
    }
    if (propertyItems.length > 0) {
      byGroup.set(
        "Properties",
        propertyItems.map((item) => ({ id: item.id, label: item.label }))
      );
    }
    if (residentItems.length > 0) {
      byGroup.set(
        "Residents",
        residentItems.map((item) => ({ id: item.id, label: item.label }))
      );
    }
    if (facilitySiteItems.length > 0) {
      byGroup.set(
        "Facility Sites",
        facilitySiteItems.map((item) => ({ id: item.id, label: item.label }))
      );
    }
    if (facilityAssetItems.length > 0) {
      byGroup.set(
        "Facility Assets",
        facilityAssetItems.map((item) => ({ id: item.id, label: item.label }))
      );
    }
    if (facilitySystemItems.length > 0) {
      byGroup.set(
        "Building Systems",
        facilitySystemItems.map((item) => ({ id: item.id, label: item.label }))
      );
    }
    if (facilityWorkItems.length > 0) {
      byGroup.set(
        "Facility Operations",
        facilityWorkItems.map((item) => ({ id: item.id, label: item.label }))
      );
    }
    if (facilityPmItems.length > 0) {
      byGroup.set(
        "Preventive Maintenance",
        facilityPmItems.map((item) => ({ id: item.id, label: item.label }))
      );
    }
    if (facilityPartItems.length > 0) {
      byGroup.set(
        "Parts",
        facilityPartItems.map((item) => ({ id: item.id, label: item.label }))
      );
    }
    if (facilityInventoryItems.length > 0) {
      byGroup.set(
        "Inventory",
        facilityInventoryItems.map((item) => ({ id: item.id, label: item.label }))
      );
    }
    if (facilityInspectionItems.length > 0) {
      byGroup.set(
        "Inspections",
        facilityInspectionItems.map((item) => ({ id: item.id, label: item.label }))
      );
    }
    if (facilitySafetyItems.length > 0) {
      byGroup.set(
        "Safety",
        facilitySafetyItems.map((item) => ({ id: item.id, label: item.label }))
      );
    }
    if (facilityComplianceItems.length > 0) {
      byGroup.set(
        "Compliance",
        facilityComplianceItems.map((item) => ({ id: item.id, label: item.label }))
      );
    }

    const navSections = [...byGroup.entries()].map(([title, items]) => ({ title, items }));
    const entitled = searchCatalogForSku(productSku, "");
    const actions = {
      title: `Quick Actions · ${productLabel ?? "No product"}`,
      items: [
        { id: "/pm/properties?new=1", label: "Add property", shortcut: "A P" },
        { id: "/pm/residents?new=1", label: "Add resident", shortcut: "A R" },
        { id: "/pm/leasing?new=1", label: "Create lease", shortcut: "A L" },
        { id: "/facility/sites?new=1", label: "Add facility site", shortcut: "A S" },
        { id: "/facility/assets?new=1", label: "Register asset", shortcut: "A A" },
        { id: "/facility/operations?new=1", label: "Create facility work", shortcut: "A W" },
        { id: "/facility/preventive-maintenance?new=1", label: "Create PM program", shortcut: "A M" },
        { id: "/facility/parts?new=1", label: "Create part", shortcut: "A C" },
        { id: "/facility/inspections?new=1", label: "Create inspection program", shortcut: "A I" },
        { id: "/facility/safety?new=1", label: "Report safety incident", shortcut: "A X" },
        { id: "/facility/compliance?new=1", label: "Create compliance obligation", shortcut: "A O" },
        { id: "/pm/properties", label: "Open Properties", shortcut: "G P" },
        { id: "/pm/residents", label: "Open Residents", shortcut: "G R" },
        { id: "/pm/leasing", label: "Open Leasing", shortcut: "G L" },
        { id: "/pm/mission-control", label: "Open Mission Control", shortcut: "G M" },
        { id: "/facility/mission-control", label: "Open Facility Mission Control", shortcut: "G F" },
        { id: "/facility/overview", label: "Open Facility Overview", shortcut: "G O" },
        { id: "/facility/operations", label: "Open Facility Operations", shortcut: "G Q" },
        {
          id: "/facility/preventive-maintenance",
          label: "Open Preventive Maintenance",
          shortcut: "G V"
        },
        { id: "/facility/inventory", label: "Open Inventory", shortcut: "G I" },
        { id: "/facility/parts", label: "Open Parts", shortcut: "G T" },
        { id: "/facility/inspections", label: "Open Inspections", shortcut: "G N" },
        { id: "/facility/safety", label: "Open Safety", shortcut: "G H" },
        { id: "/facility/compliance", label: "Open Compliance", shortcut: "G C" },
        { id: "/facility/assets", label: "Open Assets", shortcut: "G A" },
        { id: "/facility/building-systems", label: "Open Building Systems", shortcut: "G Y" },
        { id: "/setup", label: "Open Guided Setup", shortcut: "G S" },
        { id: "/billing", label: "Open Billing & Plan", shortcut: "G B" },
        { id: "/settings/team", label: "Invite your team", shortcut: "I T" },
        { id: "/settings/facility-sites", label: "Facility site settings", shortcut: "G Z" }
      ].filter(
        (item) =>
          item.id.startsWith("/pm/properties") ||
          item.id.startsWith("/pm/residents") ||
          item.id.startsWith("/pm/leasing") ||
          (item.id.startsWith("/settings") && !item.id.startsWith("/settings/facility")) ||
          entitled.some((result) => result.href === item.id.split("?")[0]) ||
          !productSku
      )
    };

    return [...navSections, actions].filter((section) => section.items.length > 0);
  }, [
    facilityAssetItems,
    facilityInventoryItems,
    facilityInspectionItems,
    facilitySafetyItems,
    facilityComplianceItems,
    facilityPartItems,
    facilityPmItems,
    facilitySiteItems,
    facilitySystemItems,
    facilityWorkItems,
    productLabel,
    productSku,
    propertyItems,
    query,
    residentItems
  ]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)] hover:bg-[var(--mpa-color-bg-app)]"
      >
        Quick Actions <kbd className="ml-2 text-xs">⌘K</kbd>
      </button>
      <CommandPaletteShell
        open={open}
        query={query}
        onQueryChange={setQuery}
        sections={sections}
        onClose={() => setOpen(false)}
        onSelect={(id) => {
          setOpen(false);
          router.push(id);
        }}
      />
    </>
  );
}
