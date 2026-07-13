"use client";

import { useEffect, useMemo, useState } from "react";
import { CommandPaletteShell } from "@mpa/ui";

const PLACEHOLDER_SECTIONS = [
  {
    title: "Navigation",
    items: [
      { id: "dashboard", label: "Go to Dashboard", shortcut: "G D" },
      { id: "settings", label: "Open Settings (placeholder)", shortcut: "G S" }
    ]
  },
  {
    title: "Actions",
    items: [
      { id: "switch-role", label: "Switch role", shortcut: "R" },
      { id: "open-notifications", label: "Open notifications", shortcut: "N" }
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
    if (!query.trim()) return PLACEHOLDER_SECTIONS;
    return PLACEHOLDER_SECTIONS.map((section) => ({
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
        className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)] hover:bg-gray-50"
      >
        Command Palette <kbd className="ml-2 text-xs">⌘K</kbd>
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
