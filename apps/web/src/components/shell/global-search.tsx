"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { searchCatalogForSku, type SearchResultItem } from "@mpa/shared";
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
  const [propertyResults, setPropertyResults] = useState<SearchResultItem[]>([]);
  const [residentResults, setResidentResults] = useState<SearchResultItem[]>([]);

  const catalogResults = useMemo(() => searchCatalogForSku(productSku, query), [productSku, query]);
  const results = useMemo(() => {
    if (!query.trim()) {
      return catalogResults;
    }
    return [...residentResults, ...propertyResults, ...catalogResults];
  }, [catalogResults, propertyResults, query, residentResults]);
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

  useEffect(() => {
    const normalized = query.trim();
    if (!productSku || !normalized) {
      return;
    }
    let cancelled = false;
    const handle = window.setTimeout(() => {
      void (async () => {
        try {
          const [propertyResponse, residentResponse] = await Promise.all([
            fetch(`/api/pm/properties/search?q=${encodeURIComponent(normalized)}`),
            fetch(`/api/pm/residents/search?q=${encodeURIComponent(normalized)}`)
          ]);
          if (cancelled) {
            return;
          }
          if (propertyResponse.ok) {
            const payload = (await propertyResponse.json()) as {
              results?: Array<{ id: string; label: string; href: string; group: string }>;
            };
            setPropertyResults(
              (payload.results ?? []).map((item) => ({
                id: `property:${item.id}`,
                label: item.label,
                href: item.href,
                group: item.group,
                entitlement: "pm.properties"
              }))
            );
          }
          if (residentResponse.ok) {
            const payload = (await residentResponse.json()) as {
              results?: Array<{ id: string; label: string; href: string; group: string }>;
            };
            setResidentResults(
              (payload.results ?? []).map((item) => ({
                id: `resident:${item.id}`,
                label: item.label,
                href: item.href,
                group: item.group,
                entitlement: "pm.residents"
              }))
            );
          }
        } catch {
          // Keep last successful live results; catalog still works.
        }
      })();
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [productSku, query]);

  function navigateTo(href: string) {
    setOpen(false);
    setQuery("");
    setPropertyResults([]);
    setResidentResults([]);
    router.push(href);
  }

  return (
    <div ref={containerRef} className="relative hidden min-w-[240px] flex-1 md:block">
      <Input
        aria-label="Search entitled workspaces, properties, and residents"
        aria-controls={listId}
        aria-expanded={open}
        aria-autocomplete="list"
        role="combobox"
        placeholder="Search workspaces, properties, residents..."
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          const next = event.target.value;
          setQuery(next);
          if (!next.trim()) {
            setPropertyResults([]);
            setResidentResults([]);
          }
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
              No entitled workspaces, properties, or residents match.
            </p>
          ) : (
            <ul>
              {results.map((item, index) => (
                <li key={item.id} role="option" aria-selected={index === safeActiveIndex}>
                  <button
                    type="button"
                    className={`flex w-full flex-col px-3 py-2 text-left text-sm ${
                      index === safeActiveIndex
                        ? "bg-[var(--mpa-color-bg-app)]"
                        : "hover:bg-[var(--mpa-color-bg-app)]"
                    }`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => navigateTo(item.href)}
                  >
                    <span className="font-medium text-[var(--mpa-color-text-primary)]">
                      {item.label}
                    </span>
                    <span className="text-xs text-[var(--mpa-color-text-secondary)]">
                      {item.group}
                    </span>
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
