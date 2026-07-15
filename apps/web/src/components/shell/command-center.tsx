"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CommandPaletteShell, type CommandPaletteItem } from "@mpa/ui";
import { searchCommandCenter } from "../../lib/command-center/registry";
import {
  buildStorageKey,
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

      if (result.href) {
        recordRecentItem({
          key: result.favoriteKey ?? buildStorageKey(result.kind, result.id),
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
        className="flex w-full items-center justify-between rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-left text-sm text-[var(--mpa-color-text-secondary)] transition-colors hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mpa-color-brand-primary)]"
      >
        <span>Search anything — properties, units, tenants, actions…</span>
        <kbd className="hidden rounded border border-[var(--mpa-color-border-default)] px-1.5 py-0.5 text-[10px] sm:inline">
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
        footerHint="↑↓ navigate · Enter open · Esc close"
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
