"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { searchCatalogForSku } from "@mpa/shared";
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

  const results = useMemo(() => searchCatalogForSku(productSku, query), [productSku, query]);
  const safeActiveIndex = results.length === 0 ? 0 : Math.min(activeIndex, results.length - 1);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  function navigateTo(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <div ref={containerRef} className="relative hidden min-w-[240px] flex-1 md:block">
      <Input
        aria-label="Search entitled workspaces"
        aria-controls={listId}
        aria-expanded={open}
        aria-autocomplete="list"
        role="combobox"
        placeholder="Search your subscribed workspaces..."
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
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
          className="absolute z-50 mt-1 max-h-80 w-full overflow-auto rounded-md border border-[var(--mpa-color-border-default)] bg-white shadow-lg"
        >
          {results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)]">
              No entitled workspaces match. Hidden modules never appear here.
            </p>
          ) : (
            <ul>
              {results.map((item, index) => (
                <li key={item.id} role="option" aria-selected={index === safeActiveIndex}>
                  <button
                    type="button"
                    className={`flex w-full flex-col px-3 py-2 text-left text-sm ${
                      index === safeActiveIndex ? "bg-[var(--mpa-color-bg-app)]" : "hover:bg-[var(--mpa-color-bg-app)]"
                    }`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => navigateTo(item.href)}
                  >
                    <span className="font-medium text-[var(--mpa-color-text-primary)]">{item.label}</span>
                    <span className="text-xs text-[var(--mpa-color-text-secondary)]">{item.group}</span>
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
