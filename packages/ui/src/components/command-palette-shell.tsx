"use client";

import { useId, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Input } from "../primitives/input";
import { useFocusTrap } from "../lib/focus-trap";

export type CommandPaletteStatusVariant = "success" | "warning" | "danger" | "neutral" | "info";

export type CommandPaletteItem = {
  id: string;
  label: string;
  subtitle?: string;
  context?: string;
  badge?: string;
  status?: string;
  statusVariant?: CommandPaletteStatusVariant;
  icon?: string;
  shortcut?: string;
  href?: string;
  meta?: string;
  disabled?: boolean;
};

export function CommandPaletteShell({
  open,
  query,
  onQueryChange,
  sections,
  onClose,
  onSelectItem,
  isLoading = false,
  footerHint
}: {
  open: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  sections: ReadonlyArray<{
    title: string;
    items: ReadonlyArray<CommandPaletteItem>;
  }>;
  onClose: () => void;
  onSelectItem?: (item: CommandPaletteItem) => void;
  isLoading?: boolean;
  footerHint?: ReactNode;
}) {
  const titleId = useId();
  const listboxId = useId();
  const containerRef = useFocusTrap<HTMLDivElement>(open, onClose);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const flatItems = useMemo(() => sections.flatMap((section) => section.items), [sections]);

  useEffect(() => {
    if (!open) {
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, sections.length]);

  useEffect(() => {
    itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!open) return null;

  function handleKeyDown(event: KeyboardEvent) {
    if (flatItems.length === 0) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % flatItems.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + flatItems.length) % flatItems.length);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const item = flatItems[activeIndex];
      if (item && !item.disabled) {
        onSelectItem?.(item);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  }

  let runningIndex = -1;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-[var(--mpa-color-bg-overlay)] p-4 sm:p-6"
      onMouseDown={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
        className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <h2 id={titleId} className="sr-only">
          Universal Command Center
        </h2>
        <div className="border-b border-[var(--mpa-color-border-default)] p-3">
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search properties, units, tenants, actions..."
            autoFocus
            aria-controls={listboxId}
            aria-activedescendant={
              flatItems[activeIndex] ? `${listboxId}-${flatItems[activeIndex]?.id}` : undefined
            }
          />
        </div>
        <div id={listboxId} role="listbox" className="max-h-[min(420px,60vh)] overflow-y-auto p-2">
          {isLoading ? (
            <p className="px-2 py-3 text-sm text-[var(--mpa-color-text-secondary)]">Searching…</p>
          ) : null}
          {!isLoading && flatItems.length === 0 ? (
            <p className="px-2 py-3 text-sm text-[var(--mpa-color-text-secondary)]">No matching results.</p>
          ) : null}
          {sections.map((section) => (
            <div key={section.title} className="mb-3">
              <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                {section.title}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  runningIndex += 1;
                  const itemIndex = runningIndex;
                  const isActive = itemIndex === activeIndex;
                  return (
                    <li key={item.id}>
                      <button
                        ref={(element) => {
                          itemRefs.current[itemIndex] = element;
                        }}
                        id={`${listboxId}-${item.id}`}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        disabled={item.disabled}
                        onMouseEnter={() => setActiveIndex(itemIndex)}
                        onClick={() => onSelectItem?.(item)}
                        className={[
                          "flex w-full items-start gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--mpa-color-brand-primary)]",
                          isActive
                            ? "bg-[var(--mpa-color-brand-primary)]/10"
                            : "text-[var(--mpa-color-text-primary)] hover:bg-gray-100",
                          item.disabled ? "cursor-not-allowed opacity-50" : ""
                        ].join(" ")}
                      >
                        <span
                          aria-hidden="true"
                          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--mpa-color-bg-app)] text-base"
                        >
                          {item.icon ?? "•"}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="truncate font-medium">{item.label}</span>
                            {item.badge ? (
                              <span className="rounded-full bg-[var(--mpa-color-bg-app)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                                {item.badge}
                              </span>
                            ) : null}
                            {item.status ? (
                              <span
                                className={[
                                  "rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                                  statusClass(item.statusVariant)
                                ].join(" ")}
                              >
                                {item.status}
                              </span>
                            ) : null}
                          </span>
                          {item.subtitle ? (
                            <span className="block truncate text-xs text-[var(--mpa-color-text-secondary)]">
                              {item.subtitle}
                            </span>
                          ) : null}
                          {item.context ? (
                            <span className="block truncate text-xs text-[var(--mpa-color-text-secondary)]/80">
                              {item.context}
                            </span>
                          ) : item.meta ? (
                            <span className="block truncate text-xs text-[var(--mpa-color-text-secondary)]">
                              {item.meta}
                            </span>
                          ) : null}
                        </span>
                        {item.shortcut ? (
                          <kbd className="mt-0.5 shrink-0 rounded border border-[var(--mpa-color-border-default)] px-1 py-0.5 text-xs">
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
        <div className="flex items-center justify-between border-t border-[var(--mpa-color-border-default)] px-3 py-2 text-xs text-[var(--mpa-color-text-secondary)]">
          <span>{footerHint ?? "↑↓ navigate · Enter open · Esc close"}</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mpa-color-brand-primary)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function statusClass(variant: CommandPaletteStatusVariant | undefined): string {
  switch (variant) {
    case "success":
      return "bg-emerald-50 text-emerald-700";
    case "warning":
      return "bg-amber-50 text-amber-800";
    case "danger":
      return "bg-red-50 text-red-700";
    case "info":
      return "bg-sky-50 text-sky-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export function CommandPaletteEmptyState({ message }: { message: ReactNode }) {
  return <div className="p-4 text-sm text-[var(--mpa-color-text-secondary)]">{message}</div>;
}
