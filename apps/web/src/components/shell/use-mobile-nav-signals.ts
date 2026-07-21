"use client";

import { useEffect, useState } from "react";
import type { MobileNavBadgeKey } from "./navigation-config";

type DashboardSnapshotLite = {
  occupancyRate?: number;
  operationalTasks?: Array<{ priority: string }>;
  maintenance?: {
    openWorkOrders?: number;
    highPriorityWorkOrders?: number;
    overdueWorkOrders?: number;
  } | null;
  leases?: {
    renewalNeeded?: number;
    upcomingExpirations?: number;
  } | null;
  communications?: {
    unreadMessages?: number;
  } | null;
};

export type OpsHealthSnapshot = {
  scorePercent: number | null;
  urgentCount: number;
  openWorkOrders: number;
  occupancyPercent: number | null;
  ready: boolean;
};

export type MobileNavBadges = Partial<Record<MobileNavBadgeKey, number>>;

export function useMobileNavSignals(enabled: boolean) {
  const [badges, setBadges] = useState<MobileNavBadges>({});
  const [health, setHealth] = useState<OpsHealthSnapshot>({
    scorePercent: null,
    urgentCount: 0,
    openWorkOrders: 0,
    occupancyPercent: null,
    ready: false
  });

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function load() {
      try {
        const [notificationsRes, dashboardRes] = await Promise.all([
          fetch("/api/notifications?limit=1", { cache: "no-store" }),
          fetch("/api/dashboard", { cache: "no-store" })
        ]);

        let unreadNotifications = 0;
        if (notificationsRes.ok) {
          const payload = (await notificationsRes.json()) as { unreadCount?: number };
          unreadNotifications = payload.unreadCount ?? 0;
        }

        let snapshot: DashboardSnapshotLite | null = null;
        if (dashboardRes.ok) {
          const payload = (await dashboardRes.json()) as { snapshot?: DashboardSnapshotLite };
          snapshot = payload.snapshot ?? null;
        }

        if (cancelled) return;

        const openWorkOrders = snapshot?.maintenance?.openWorkOrders ?? 0;
        const urgentFromMaintenance =
          (snapshot?.maintenance?.highPriorityWorkOrders ?? 0) + (snapshot?.maintenance?.overdueWorkOrders ?? 0);
        const urgentFromTasks = (snapshot?.operationalTasks ?? []).filter((task) => task.priority === "high").length;
        const urgentCount = Math.max(urgentFromMaintenance, urgentFromTasks);
        const occupancy = typeof snapshot?.occupancyRate === "number" ? snapshot.occupancyRate : null;
        const leaseAttention =
          (snapshot?.leases?.renewalNeeded ?? 0) + (snapshot?.leases?.upcomingExpirations ?? 0);
        const unreadMessages = snapshot?.communications?.unreadMessages ?? 0;

        const nextBadges: MobileNavBadges = {};
        const messagesCount = unreadMessages > 0 ? unreadMessages : unreadNotifications;
        if (messagesCount > 0) nextBadges.messages = messagesCount;
        if (unreadNotifications > 0) nextBadges.notifications = unreadNotifications;
        if (openWorkOrders > 0) nextBadges.maintenance = openWorkOrders;
        if (leaseAttention > 0) nextBadges.leases = leaseAttention;
        // Approvals: omit until a reliable count source exists (never invent).

        setBadges(nextBadges);

        const hasDashboard = Boolean(snapshot);
        // Lightweight health glance from existing metrics — not a committed scoring product.
        const scorePercent =
          hasDashboard && occupancy != null
            ? Math.max(
                0,
                Math.min(
                  100,
                  Math.round(occupancy * 0.7 + (100 - Math.min(30, urgentCount * 3 + openWorkOrders)) * 0.3)
                )
              )
            : null;

        setHealth({
          scorePercent,
          urgentCount,
          openWorkOrders,
          occupancyPercent: occupancy,
          ready: hasDashboard
        });
      } catch {
        if (!cancelled) {
          setHealth((prev) => ({ ...prev, ready: false }));
        }
      }
    }

    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [enabled]);

  return { badges, health };
}
