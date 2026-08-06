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

  const sections = useMemo(() => {
    const results = searchCatalogForSku(productSku, query);
    const byGroup = new Map<string, Array<{ id: string; label: string; shortcut?: string }>>();
    for (const item of results) {
      const group = byGroup.get(item.group) ?? [];
      group.push({ id: item.href, label: item.label });
      byGroup.set(item.group, group);
    }

    const navSections = [...byGroup.entries()].map(([title, items]) => ({ title, items }));
    const actions = {
      title: `Quick Actions · ${productLabel ?? "No product"}`,
      items: [
        { id: "/setup", label: "Open Guided Setup", shortcut: "G S" },
        { id: "/billing", label: "Open Billing & Plan", shortcut: "G B" },
        { id: "/launcher", label: "Open Workspace Launcher", shortcut: "G L" }
      ].filter((item) => searchCatalogForSku(productSku, "").some((result) => result.href === item.id) || !productSku)
    };

    return [...navSections, actions].filter((section) => section.items.length > 0);
  }, [productLabel, productSku, query]);

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
