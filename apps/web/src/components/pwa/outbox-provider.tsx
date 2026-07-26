"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  flushOutbox,
  isOutboxPausedForAuth,
  isOutboxSyncing,
  listActiveOutboxItems,
  resumeOutboxAfterAuth,
  type OutboxItem,
  type OutboxSnapshot
} from "../../lib/pwa/outbox";
import { requestOutboxBackgroundSync } from "../../lib/pwa/sw-client";
import { useOrganizationContext } from "../shell/organization-context";

type OutboxContextValue = OutboxSnapshot & {
  refresh: () => Promise<void>;
  flush: () => Promise<void>;
  organizationId: string | null;
};

const OutboxContext = createContext<OutboxContextValue | null>(null);

async function readSnapshot(): Promise<Pick<OutboxSnapshot, "pendingCount" | "failedCount" | "items">> {
  const items = await listActiveOutboxItems();
  return {
    items,
    pendingCount: items.filter((item) => item.status === "pending" || item.status === "syncing").length,
    failedCount: items.filter((item) => item.status === "failed").length
  };
}

export function OutboxProvider({ children }: { children: ReactNode }) {
  const { activeOrganizationId } = useOrganizationContext();
  const [items, setItems] = useState<OutboxItem[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [pausedForAuth, setPausedForAuth] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const snapshot = await readSnapshot();
      setItems(snapshot.items);
      setPendingCount(snapshot.pendingCount);
      setFailedCount(snapshot.failedCount);
      setSyncing(isOutboxSyncing());
      setPausedForAuth(isOutboxPausedForAuth());
    } catch {
      // IndexedDB may be unavailable — degrade silently.
    }
  }, []);

  const flush = useCallback(async () => {
    await flushOutbox(activeOrganizationId);
    await refresh();
  }, [activeOrganizationId, refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh, activeOrganizationId]);

  useEffect(() => {
    function onChanged() {
      void refresh();
    }
    function onOnline() {
      if (isOutboxPausedForAuth()) {
        resumeOutboxAfterAuth();
      }
      void flush();
    }
    function onVisibility() {
      if (document.visibilityState === "visible" && navigator.onLine) {
        void flush();
      }
    }
    function onSwMessage(event: MessageEvent<{ type?: string }>) {
      if (event.data?.type === "MPA_SYNC_REQUEST") {
        void flush();
      }
    }

    window.addEventListener("mpa:outbox-changed", onChanged);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibility);
    navigator.serviceWorker?.addEventListener("message", onSwMessage);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("mpa-outbox");
      channel.onmessage = () => onChanged();
    } catch {
      channel = null;
    }

    void requestOutboxBackgroundSync();

    return () => {
      window.removeEventListener("mpa:outbox-changed", onChanged);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibility);
      navigator.serviceWorker?.removeEventListener("message", onSwMessage);
      channel?.close();
    };
  }, [flush, refresh]);

  const value = useMemo<OutboxContextValue>(
    () => ({
      items,
      pendingCount,
      failedCount,
      syncing,
      pausedForAuth,
      refresh,
      flush,
      organizationId: activeOrganizationId
    }),
    [
      items,
      pendingCount,
      failedCount,
      syncing,
      pausedForAuth,
      refresh,
      flush,
      activeOrganizationId
    ]
  );

  return <OutboxContext.Provider value={value}>{children}</OutboxContext.Provider>;
}

export function useOutbox(): OutboxContextValue {
  const value = useContext(OutboxContext);
  if (!value) {
    return {
      items: [],
      pendingCount: 0,
      failedCount: 0,
      syncing: false,
      pausedForAuth: false,
      refresh: async () => undefined,
      flush: async () => undefined,
      organizationId: null
    };
  }
  return value;
}
