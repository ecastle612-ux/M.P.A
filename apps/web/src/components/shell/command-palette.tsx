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
        const [propertyResponse, residentResponse] = await Promise.all([
          fetch(`/api/pm/properties/search?q=${encodeURIComponent(query.trim())}`),
          fetch(`/api/pm/residents/search?q=${encodeURIComponent(query.trim())}`)
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
      } catch {
        if (!cancelled) {
          setPropertyItems([]);
          setResidentItems([]);
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

    const navSections = [...byGroup.entries()].map(([title, items]) => ({ title, items }));
    const entitled = searchCatalogForSku(productSku, "");
    const actions = {
      title: `Quick Actions · ${productLabel ?? "No product"}`,
      items: [
        { id: "/pm/properties?new=1", label: "Add property", shortcut: "A P" },
        { id: "/pm/residents?new=1", label: "Add resident", shortcut: "A R" },
        { id: "/pm/leasing?new=1", label: "Create lease", shortcut: "A L" },
        { id: "/pm/properties", label: "Open Properties", shortcut: "G P" },
        { id: "/pm/residents", label: "Open Residents", shortcut: "G R" },
        { id: "/pm/leasing", label: "Open Leasing", shortcut: "G L" },
        { id: "/pm/mission-control", label: "Open Mission Control", shortcut: "G M" },
        { id: "/setup", label: "Open Guided Setup", shortcut: "G S" },
        { id: "/billing", label: "Open Billing & Plan", shortcut: "G B" },
        { id: "/settings/team", label: "Invite your team", shortcut: "I T" }
      ].filter(
        (item) =>
          item.id.startsWith("/pm/properties") ||
          item.id.startsWith("/pm/residents") ||
          item.id.startsWith("/pm/leasing") ||
          item.id.startsWith("/settings") ||
          entitled.some((result) => result.href === item.id.split("?")[0]) ||
          !productSku
      )
    };

    return [...navSections, actions].filter((section) => section.items.length > 0);
  }, [productLabel, productSku, propertyItems, query, residentItems]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)] hover:bg-gray-50"
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
