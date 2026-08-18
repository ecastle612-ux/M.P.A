"use client";

import { useEffect, useId, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { Input } from "../primitives/input";
import { useFocusTrap } from "../lib/focus-trap";

export type CommandPaletteItem = {
  id: string;
  label: string;
  description?: string;
  kind?: string;
  shortcut?: string;
};

export function CommandPaletteShell({
  open,
  query,
  onQueryChange,
  sections,
  onClose,
  onSelect,
  emptyState,
  labelledBy = "Command palette",
  inputPlaceholder = "Search records, pages, and create actions..."
}: {
  open: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  sections: ReadonlyArray<{
    title: string;
    items: ReadonlyArray<CommandPaletteItem>;
  }>;
  onClose: () => void;
  onSelect?: (id: string) => void;
  emptyState?: ReactNode;
  labelledBy?: string;
  inputPlaceholder?: string;
}) {
  const titleId = useId();
  const listboxId = useId();
  const inputId = useId();
  const containerRef = useFocusTrap<HTMLDivElement>(open, onClose);
  const flatItems = useMemo(() => sections.flatMap((section) => section.items), [sections]);
  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = flatItems.length === 0 ? 0 : Math.min(activeIndex, flatItems.length - 1);
  const activeItem = flatItems[safeIndex] ?? null;

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open, sections]);

  if (!open) return null;

  function select(id: string) {
    onSelect?.(id);
    onClose();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (flatItems.length === 0) return;
      setActiveIndex((value) => (value + 1) % flatItems.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (flatItems.length === 0) return;
      setActiveIndex((value) => (value - 1 + flatItems.length) % flatItems.length);
      return;
    }
    if (event.key === "Enter" && activeItem) {
      event.preventDefault();
      select(activeItem.id);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-[var(--mpa-color-bg-overlay)] p-3 sm:p-6"
      onMouseDown={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
        className="mt-4 w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl sm:mt-12"
      >
        <h2 id={titleId} className="sr-only">
          {labelledBy}
        </h2>
        <div className="border-b border-[var(--mpa-color-border-default)] p-3">
          <Input
            id={inputId}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={inputPlaceholder}
            autoFocus
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls={listboxId}
            aria-activedescendant={
              activeItem
                ? `${listboxId}-${sections.find((section) => section.items.some((item) => item.id === activeItem.id))?.title ?? "item"}-${activeItem.id}`.replace(
                    /[^a-zA-Z0-9_-]/g,
                    "_"
                  )
                : undefined
            }
            aria-label="Search workspace"
          />
        </div>
        <div className="max-h-[min(70vh,28rem)] overflow-y-auto overflow-x-hidden p-2">
          {flatItems.length === 0 ? (
            emptyState ?? <CommandPaletteEmptyState message="No results." />
          ) : (
            <div id={listboxId} role="listbox" aria-label="Search results">
              {sections.map((section) => (
                <div key={section.title} className="mb-3">
                  <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                    {section.title}
                  </p>
                  <ul className="space-y-1">
                    {section.items.map((item) => {
                      const selected = activeItem?.id === item.id;
                      const optionId = `${listboxId}-${section.title}-${item.id}`.replace(/[^a-zA-Z0-9_-]/g, "_");
                      return (
                        <li key={`${section.title}-${item.id}`}>
                          <button
                            type="button"
                            id={optionId}
                            role="option"
                            aria-selected={selected}
                            onClick={() => select(item.id)}
                            className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-brand-primary)]/40 ${
                              selected
                                ? "bg-[var(--mpa-color-bg-subtle,#F7F8FA)]"
                                : "hover:bg-[var(--mpa-color-bg-subtle,#F7F8FA)]"
                            }`}
                          >
                            <span className="min-w-0">
                              <span className="flex flex-wrap items-center gap-2">
                                {item.kind ? (
                                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                                    {item.kind}
                                  </span>
                                ) : null}
                                <span className="truncate text-[var(--mpa-color-text-primary)]">{item.label}</span>
                              </span>
                              {item.description ? (
                                <span className="mt-0.5 block truncate text-xs text-[var(--mpa-color-text-secondary)]">
                                  {item.description}
                                </span>
                              ) : null}
                            </span>
                            {item.shortcut ? (
                              <kbd className="shrink-0 rounded border border-[var(--mpa-color-border-default)] px-1 py-0.5 text-xs">
                                {item.shortcut}
                              </kbd>
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-[var(--mpa-color-border-default)] p-2 text-right">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-md px-3 text-sm text-[var(--mpa-color-text-secondary)] hover:bg-gray-100"
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
