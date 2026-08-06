"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CommandPaletteShell } from "@mpa/ui";
import { useCommercialContext } from "./commercial-context";

export function CommandPalette() {
  const router = useRouter();
  const { navigationGroups, productLabel } = useCommercialContext();
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
    const navSection = {
      title: `Navigation · ${productLabel ?? "No product"}`,
      items: navigationGroups.flatMap((group) =>
        group.items.map((item) => ({
          id: item.href,
          label: `${group.title}: ${item.label}${item.readiness === "planned" ? " (Planned)" : ""}`
        }))
      )
    };

    const actionSection = {
      title: "Quick Actions",
      items: [
        { id: "/setup", label: "Open Guided Setup", shortcut: "G S" },
        { id: "/billing", label: "Open Billing & Plan", shortcut: "G B" },
        { id: "/launcher", label: "Open Workspace Launcher", shortcut: "G L" }
      ]
    };

    const all = [navSection, actionSection];
    if (!query.trim()) {
      return all;
    }
    return all
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
      }))
      .filter((section) => section.items.length > 0);
  }, [navigationGroups, productLabel, query]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)] hover:bg-gray-50"
      >
        Search / Actions <kbd className="ml-2 text-xs">⌘K</kbd>
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
