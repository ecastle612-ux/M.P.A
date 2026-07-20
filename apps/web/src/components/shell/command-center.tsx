"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CommandPaletteShell, type CommandPaletteItem } from "@mpa/ui";
import { searchCommandCenter } from "../../lib/command-center/registry";
import {
  buildStorageKey,
  recordActionUsage,
  recordRecentItem
} from "../../lib/command-center/storage";
import type { CommandCenterResult, CommandCenterSection } from "../../lib/command-center/types";
import { useOrganizationContext } from "./organization-context";

const OPEN_EVENT = "mpa:open-command-center";
const LEGACY_OPEN_EVENT = "mpa:open-global-search";

export function CommandCenter() {
  const router = useRouter();
  const { organizations, setActiveOrganization } = useOrganizationContext();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sections, setSections] = useState<CommandCenterSection[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const resultMapRef = useRef<Map<string, CommandCenterResult>>(new Map());

  const openCenter = useCallback(() => setOpen(true), []);

  const closeCenter = useCallback(() => {
    setOpen(false);
    setQuery("");
    setSections([]);
    resultMapRef.current = new Map();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    function onOpenEvent() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_EVENT, onOpenEvent);
    window.addEventListener(LEGACY_OPEN_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_EVENT, onOpenEvent);
      window.removeEventListener(LEGACY_OPEN_EVENT, onOpenEvent);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          identity?: { permissions?: string[] };
        };
        if (!cancelled) {
          setPermissions(payload.identity?.permissions ?? []);
          setPermissionsLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setPermissions([]);
          setPermissionsLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !permissionsLoaded) return;

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchCommandCenter({
          query,
          organizations,
          permissions,
          signal: controller.signal
        });
        const nextMap = new Map<string, CommandCenterResult>();
        for (const section of results) {
          for (const item of section.items) {
            nextMap.set(item.id, item);
          }
        }
        resultMapRef.current = nextMap;
        setSections(results);
      } catch {
        if (!controller.signal.aborted) {
          setSections([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 180);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [open, organizations, permissions, permissionsLoaded, query]);

  const paletteSections = useMemo(
    () =>
      sections.map((section) => ({
        title: section.title,
        items: section.items.map(toPaletteItem)
      })),
    [sections]
  );

  const handleSelect = useCallback(
    async (item: CommandPaletteItem) => {
      const result = resultMapRef.current.get(item.id);
      if (!result) {
        closeCenter();
        return;
      }

      const usageKey = result.favoriteKey ?? buildStorageKey(result.kind, result.id);
      recordActionUsage(usageKey);

      if (result.href) {
        recordRecentItem({
          key: usageKey,
          kind: result.kind,
          label: result.label,
          subtitle: result.subtitle,
          context: result.context,
          badge: result.badge,
          status: result.status,
          href: result.href
        });
      }

      closeCenter();

      if (result.kind === "organization") {
        const organizationId = result.id.replace("organization-", "");
        await setActiveOrganization(organizationId);
        return;
      }

      if (result.onSelect) {
        await result.onSelect();
        return;
      }

      if (result.href) {
        router.push(result.href);
      }
    },
    [closeCenter, router, setActiveOrganization]
  );

  return (
    <>
      <button
        type="button"
        onClick={openCenter}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Open Universal Command Center"
        className="group flex w-full items-center gap-3 rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface-muted)]/60 px-4 py-2.5 text-left text-sm text-[var(--mpa-color-text-muted)] shadow-[var(--mpa-shadow-xs)] transition-all duration-[var(--mpa-duration-fast)] hover:border-[var(--mpa-color-border-default)] hover:bg-[var(--mpa-color-bg-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mpa-color-border-focus)]"
      >
        <svg
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-[var(--mpa-color-text-muted)] group-hover:text-[var(--mpa-color-brand-primary)]"
          viewBox="0 0 16 16"
          fill="none"
        >
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="flex-1 truncate">Start work, continue jobs, search records…</span>
        <kbd className="pointer-events-none hidden shrink-0 rounded-[var(--mpa-radius-sm)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--mpa-color-text-muted)] opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 md:inline">
          ⌘K
        </kbd>
      </button>
      <CommandPaletteShell
        open={open}
        query={query}
        onQueryChange={setQuery}
        sections={paletteSections}
        onClose={closeCenter}
        onSelectItem={handleSelect}
        isLoading={isSearching || (open && !permissionsLoaded)}
        footerHint="↑↓ navigate · Enter run · Esc close · type ? for shortcuts"
      />
    </>
  );
}

function toPaletteItem(item: CommandCenterResult): CommandPaletteItem {
  const paletteItem: CommandPaletteItem = {
    id: item.id,
    label: item.label,
    badge: item.badge,
    icon: item.icon
  };

  if (item.subtitle) paletteItem.subtitle = item.subtitle;
  if (item.context) paletteItem.context = item.context;
  if (item.status) paletteItem.status = item.status;
  if (item.statusVariant) paletteItem.statusVariant = item.statusVariant;
  if (item.href) paletteItem.href = item.href;
  if (item.shortcut) paletteItem.shortcut = item.shortcut;

  return paletteItem;
}

export function dispatchOpenCommandCenter(): void {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}
