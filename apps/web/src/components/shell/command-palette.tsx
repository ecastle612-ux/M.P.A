"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authorizedQuickCreateActions } from "@mpa/shared";
import { CommandPaletteEmptyState, CommandPaletteShell } from "@mpa/ui";
import { readRecentItems } from "../../lib/simplicity/recent-items-client";
import { useCommercialContext } from "./commercial-context";
import { useOrganizationContext } from "./organization-context";
import { useProfileContext } from "./profile-provider";

type SearchHit = {
  domain: string;
  recordId: string;
  kind: string;
  title: string;
  subtitle: string;
  matchReason: string;
  href: string;
};

type CreateAction = {
  id: string;
  label: string;
  description: string;
  href: string;
};

type SearchPayload = {
  results?: SearchHit[];
  destinations?: Array<{ href: string; label: string; group?: string }>;
  creates?: CreateAction[];
  suggestedCreates?: CreateAction[];
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

export function CommandPalette({
  open: openProp,
  onOpenChange,
  trigger = "search"
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: "search" | "create" | "none";
}) {
  const router = useRouter();
  const { productSku } = useCommercialContext();
  const { activeOrganizationId } = useOrganizationContext();
  const { userId } = useProfileContext();
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [payload, setPayload] = useState<SearchPayload>({});
  const [recent, setRecent] = useState<SearchHit[]>([]);
  const open = openProp ?? internalOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      onOpenChange?.(next);
      if (openProp === undefined) {
        setInternalOpen(next);
      }
      if (!next) {
        setQuery("");
      }
    },
    [onOpenChange, openProp]
  );

  useEffect(() => {
    if (trigger !== "search") return;
    function handler(event: KeyboardEvent) {
      const isCommandK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (isCommandK) {
        event.preventDefault();
        setOpen(!open);
        return;
      }
      if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey && !isTypingTarget(event.target)) {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, setOpen, trigger]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/shared/search?q=${encodeURIComponent(query.trim())}`);
          if (!response.ok || cancelled) {
            if (!cancelled && response.status === 403) {
              setPayload({});
            }
            return;
          }
          const body = (await response.json()) as SearchPayload;
          if (!cancelled) setPayload(body);
        } catch {
          if (!cancelled) setPayload({});
        }
      })();
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, query, productSku, activeOrganizationId]);

  useEffect(() => {
    if (!open || query.trim() || !activeOrganizationId || !userId) {
      return;
    }
    const refs = readRecentItems(activeOrganizationId, userId);
    let cancelled = false;
    void (async () => {
      if (refs.length === 0) {
        if (!cancelled) setRecent([]);
        return;
      }
      const response = await fetch("/api/shared/search/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: refs.map((item) => ({ type: item.type, id: item.id })) })
      });
      if (!response.ok || cancelled) {
        if (!cancelled) setRecent([]);
        return;
      }
      const body = (await response.json()) as { results?: SearchHit[] };
      if (!cancelled) setRecent(body.results ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeOrganizationId, open, query, userId]);

  const sections = useMemo(() => {
    const next: Array<{
      title: string;
      items: Array<{ id: string; label: string; description?: string; kind?: string }>;
    }> = [];
    const item = (value: { id: string; label: string; description?: string; kind?: string }) => value;
    const trimmed = query.trim();
    const visibleRecent = trimmed ? [] : recent;
    if (!trimmed && visibleRecent.length > 0) {
      next.push({
        title: "Recent",
        items: visibleRecent.map((hit) =>
          item({
            id: hit.href,
            label: hit.title,
            description: [hit.subtitle, hit.matchReason].filter(Boolean).join(" · "),
            kind: hit.kind
          })
        )
      });
    }
    if ((payload.creates ?? []).length > 0 && (!trimmed || (payload.suggestedCreates ?? []).length > 0)) {
      const creates = trimmed ? (payload.suggestedCreates ?? []) : (payload.creates ?? []);
      if (creates.length > 0) {
        next.push({
          title: trimmed ? "Create" : "Quick Create",
          items: creates.map((create) =>
            item({
              id: create.href,
              label: create.label,
              description: create.description,
              kind: "Create"
            })
          )
        });
      }
    }
    if ((payload.results ?? []).length > 0) {
      next.push({
        title: "Records",
        items: (payload.results ?? []).map((hit) =>
          item({
            id: hit.href,
            label: hit.title,
            description: [hit.subtitle, hit.matchReason].filter(Boolean).join(" · "),
            kind: hit.kind
          })
        )
      });
    }
    if ((payload.destinations ?? []).length > 0) {
      next.push({
        title: "Go to",
        items: (payload.destinations ?? []).map((destination) =>
          item({
            id: destination.href,
            label: destination.label,
            ...(destination.group ? { description: destination.group } : {}),
            kind: "Page"
          })
        )
      });
    }
    return next;
  }, [payload, query, recent]);

  let emptyState: ReactNode = (
    <CommandPaletteEmptyState message="Search records you can open, or pick a create action." />
  );
  if (query.trim()) {
    emptyState = (
      <CommandPaletteEmptyState
        message={`No results for '${query.trim()}'.${
          (payload.suggestedCreates ?? []).length === 0 ? " Try a name, tag, or request number." : ""
        }`}
      />
    );
  }

  return (
    <>
      {trigger === "search" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label="Search workspace"
          className="flex min-h-11 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-left text-sm text-[var(--mpa-color-text-secondary)] hover:bg-[var(--mpa-color-bg-subtle,#F7F8FA)]"
        >
          <span className="truncate">Search workspace…</span>
          <kbd className="hidden shrink-0 text-xs sm:inline">⌘K</kbd>
        </button>
      ) : null}
      {trigger === "create" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label="Create"
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md bg-[var(--mpa-color-brand-primary)] px-3 text-sm font-medium text-white hover:opacity-95"
        >
          + Create
        </button>
      ) : null}
      <CommandPaletteShell
        open={open}
        query={query}
        onQueryChange={setQuery}
        sections={sections}
        emptyState={emptyState}
        labelledBy={trigger === "create" ? "Quick Create" : "Global Search"}
        onClose={() => setOpen(false)}
        onSelect={(id) => {
          setOpen(false);
          router.push(id);
        }}
      />
    </>
  );
}

export function QuickCreateButton() {
  const { productSku, roles, operatingScope } = useCommercialContext();
  const actions = authorizedQuickCreateActions({
    sku: productSku,
    roles,
    storedScope: operatingScope
  });
  if (actions.length === 0) {
    return null;
  }
  return <CommandPalette trigger="create" />;
}
