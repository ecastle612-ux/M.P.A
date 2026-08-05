"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { UniversalDashboard } from "../dashboard-framework";
import {
  buildUniversalDashboardViewModel,
  permissionQuickActionsFromFlags
} from "../../lib/dashboard/ux016-view-model";
import type { DashboardSnapshot } from "../../lib/dashboard/server";
import type { CommandCenterHomeComposition } from "../../lib/ops/command-center-home";

type OpsPermissions = {
  canCreateProperty: boolean;
  canCreateUnit: boolean;
  canCreateTenant: boolean;
  canCreateApplicant: boolean;
  canReadApplicants: boolean;
  canReadScreening: boolean;
  canReadSignatures: boolean;
  canCreateMaintenance: boolean;
  canReadMaintenance: boolean;
  canCreateVendor: boolean;
  canReadVendors: boolean;
  canCreateLease: boolean;
  canReadLeases: boolean;
  canCreateCommunication: boolean;
  canReadCommunications: boolean;
  canCreateFinancial: boolean;
  canReadFinancials: boolean;
  canReadAi: boolean;
  canUseAi: boolean;
  canReadMigration: boolean;
  canCreateMigration: boolean;
};

export function OpsUniversalDashboard({
  organizationName,
  snapshot,
  commandCenterHome,
  userGreetingName,
  timeGreeting,
  dateLabel,
  permissions
}: {
  organizationName: string | null;
  snapshot: DashboardSnapshot;
  commandCenterHome: CommandCenterHomeComposition | null;
  userGreetingName: string | null;
  timeGreeting: string;
  dateLabel: string;
  permissions: OpsPermissions;
}) {
  const [home, setHome] = useState(commandCenterHome);
  const [liveSnapshot, setLiveSnapshot] = useState(snapshot);

  const refresh = useCallback(async () => {
    try {
      const [ccResponse, dashResponse] = await Promise.all([
        fetch("/api/ops/command-center", { cache: "no-store" }),
        fetch("/api/dashboard", { cache: "no-store" })
      ]);
      if (ccResponse.ok) {
        const payload = (await ccResponse.json()) as { home?: CommandCenterHomeComposition };
        if (payload.home) setHome(payload.home);
      }
      if (dashResponse.ok) {
        const payload = (await dashResponse.json()) as { snapshot?: DashboardSnapshot };
        if (payload.snapshot) setLiveSnapshot(payload.snapshot);
      }
    } catch {
      // keep last good composition
    }
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => void refresh(), 45000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const permissionActions = useMemo(
    () =>
      permissionQuickActionsFromFlags({
        canCreateMaintenance: permissions.canCreateMaintenance,
        canCreateProperty: permissions.canCreateProperty,
        canCreateTenant: permissions.canCreateTenant,
        canCreateLease: permissions.canCreateLease,
        canCreateVendor: permissions.canCreateVendor,
        canCreateCommunication: permissions.canCreateCommunication,
        canCreateFinancial: permissions.canCreateFinancial,
        canCreateApplicant: permissions.canCreateApplicant
      }),
    [permissions]
  );

  const model = useMemo(
    () =>
      buildUniversalDashboardViewModel({
        timeGreeting,
        userGreetingName,
        organizationName,
        dateLabel,
        snapshot: liveSnapshot,
        commandCenterHome: home,
        permissionQuickActions: permissionActions
      }),
    [timeGreeting, userGreetingName, organizationName, dateLabel, liveSnapshot, home, permissionActions]
  );

  async function onQuickAction(actionId: string, href?: string) {
    const response = await fetch("/api/ops/quick-actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionId })
    });
    const payload = (await response.json()) as {
      ok?: boolean;
      href?: string;
      error?: string;
      message?: string;
    };
    if (!response.ok || payload.ok === false) {
      throw new Error(payload.error ?? payload.message ?? "Action denied");
    }
    const target = payload.href ?? href;
    if (target) {
      window.location.assign(target);
      return;
    }
    await refresh();
  }

  return <UniversalDashboard model={model} onQuickAction={onQuickAction} />;
}
