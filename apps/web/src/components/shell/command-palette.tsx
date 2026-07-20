"use client";

import { useEffect, useMemo, useState } from "react";
import { CommandPaletteShell } from "@mpa/ui";

const COMMAND_SECTIONS = [
  {
    title: "Navigation",
    items: [
      { id: "dashboard", label: "Go to Dashboard", shortcut: "G D" },
      { id: "properties", label: "Go to Properties", shortcut: "G P" },
      { id: "units", label: "Go to Units", shortcut: "G U" },
      { id: "tenants", label: "Go to Tenants", shortcut: "G T" },
      { id: "profile", label: "Go to Profile", shortcut: "G R" }
    ]
  },
  {
    title: "Actions",
    items: [
      { id: "switch-role", label: "Switch role", shortcut: "R" },
      { id: "create-property", label: "Create property", shortcut: "C P" },
      { id: "create-unit", label: "Create unit", shortcut: "C U" },
      { id: "start-move-in", label: "New resident · Move in", shortcut: "C T" }
    ]
  }
] as const;

export function CommandPalette() {
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

  const filteredSections = useMemo(() => {
    if (!query.trim()) return COMMAND_SECTIONS;
    return COMMAND_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase()),
      )
    })).filter((section) => section.items.length > 0);
  }, [query]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)] transition-colors hover:bg-gray-50"
      >
        Command <kbd className="ml-2 text-xs">⌘K</kbd>
      </button>
      <CommandPaletteShell
        open={open}
        query={query}
        onQueryChange={setQuery}
        sections={filteredSections}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
