"use client";

import { useId, type ReactNode } from "react";
import { Input } from "../primitives/input";
import { useFocusTrap } from "../lib/focus-trap";

export type CommandPaletteItem = {
  id: string;
  label: string;
  shortcut?: string;
};

export function CommandPaletteShell({
  open,
  query,
  onQueryChange,
  sections,
  onClose
}: {
  open: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  sections: ReadonlyArray<{
    title: string;
    items: ReadonlyArray<CommandPaletteItem>;
  }>;
  onClose: () => void;
}) {
  const titleId = useId();
  const containerRef = useFocusTrap<HTMLDivElement>(open, onClose);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-[var(--mpa-color-bg-overlay)] p-6"
      onMouseDown={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
        className="w-full max-w-2xl rounded-xl bg-white shadow-2xl"
      >
        <h2 id={titleId} className="sr-only">
          Command palette
        </h2>
        <div className="border-b border-[var(--mpa-color-border-default)] p-3">
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search commands, pages, and records..."
            autoFocus
          />
        </div>
        <div className="max-h-[420px] overflow-y-auto p-2">
          {sections.map((section) => (
            <div key={section.title} className="mb-3">
              <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                {section.title}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm text-[var(--mpa-color-text-primary)] hover:bg-gray-100"
                    >
                      <span>{item.label}</span>
                      {item.shortcut ? (
                        <kbd className="rounded border border-[var(--mpa-color-border-default)] px-1 py-0.5 text-xs">
                          {item.shortcut}
                        </kbd>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-[var(--mpa-color-border-default)] p-2 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1 text-sm text-[var(--mpa-color-text-secondary)] hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function CommandPaletteEmptyState({ message }: { message: ReactNode }) {
  return <div className="p-4 text-sm text-[var(--mpa-color-text-secondary)]">{message}</div>;
}
