"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Input } from "@mpa/ui";

type Hit = {
  id: string;
  kind: string;
  title: string;
  detail: string;
  href: string;
};

export function OwnerGlobalSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [hits, setHits] = useState<Hit[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmed = query.trim();
  const searchActive = trimmed.length >= 2;

  useEffect(() => {
    if (!searchActive) return;

    const handle = window.setTimeout(() => {
      void (async () => {
        setBusy(true);
        setError(null);
        try {
          const response = await fetch(`/api/admin/search?q=${encodeURIComponent(trimmed)}`);
          const body = (await response.json()) as { hits?: Hit[]; error?: string };
          if (!response.ok) throw new Error(body.error ?? "Search failed");
          setHits(body.hits ?? []);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Search failed");
          setHits([]);
        } finally {
          setBusy(false);
        }
      })();
    }, 250);
    return () => window.clearTimeout(handle);
  }, [searchActive, trimmed]);

  const visibleHits = searchActive ? hits : [];
  const visibleError = searchActive ? error : null;

  return (
    <section className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
      <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
        Customer search
      </h2>
      <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
        Search organization, email, property, resident, applicant, user id, subscription, document.
      </p>
      <div className="mt-3">
        <label className="sr-only" htmlFor="owner-global-search">
          Global search
        </label>
        <Input
          id="owner-global-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search customers…"
          autoComplete="off"
        />
      </div>
      {searchActive && busy ? (
        <p className="mt-2 text-xs text-[var(--mpa-color-text-secondary)]">Searching…</p>
      ) : null}
      {visibleError ? (
        <p className="mt-2 text-sm text-[var(--mpa-color-danger)]" role="alert">
          {visibleError}
        </p>
      ) : null}
      {visibleHits.length > 0 ? (
        <ul className="mt-3 divide-y divide-[var(--mpa-color-border-subtle)]">
          {visibleHits.map((hit) => (
            <li key={hit.id} className="py-2">
              <Link href={hit.href} className="block hover:text-[var(--mpa-color-brand-primary)]">
                <span className="text-[10px] uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                  {hit.kind}
                </span>
                <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{hit.title}</p>
                <p className="text-xs text-[var(--mpa-color-text-secondary)]">{hit.detail}</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : searchActive && !busy ? (
        <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">No matches.</p>
      ) : null}
    </section>
  );
}
