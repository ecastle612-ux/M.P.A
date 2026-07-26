"use client";

import { useMemo, useState } from "react";
import { Button, Card, CardDescription, CardHeader, CardTitle } from "@mpa/ui";
import { InstallChecklist } from "./install-checklist";
import {
  readOnboardingRecord,
  setForceOpenInstallHelp
} from "../../lib/pwa/onboarding-storage";
import { detectPwaPlatform } from "../../lib/pwa/platform";
import { isStandaloneDisplay } from "../../lib/pwa/standalone";
import { useOrganizationContext } from "../shell/organization-context";

/**
 * PMX-004 Phase 2 — Settings re-entry for install help / checklist.
 */
export function PwaInstallSettingsPanel() {
  const { activeOrganizationId } = useOrganizationContext();
  const [record, setRecord] = useState(() => readOnboardingRecord(activeOrganizationId));
  const platform = useMemo(() => detectPwaPlatform(), []);
  const standalone = isStandaloneDisplay();

  function refresh() {
    setRecord(readOnboardingRecord(activeOrganizationId));
  }

  function openHelp() {
    setForceOpenInstallHelp(true);
    // Soft navigation cue — user returns to any shell and sees checklist.
    window.dispatchEvent(new CustomEvent("mpa:pwa-open-install-help"));
    refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Install &amp; Home Screen</CardTitle>
        <CardDescription>
          Install coaching for {platform}
          {standalone ? " · currently running as installed app" : " · browser tab"}. Re-open the
          checklist anytime without blocking your work.
        </CardDescription>
      </CardHeader>
      <div className="space-y-[var(--mpa-space-3)]">
        <InstallChecklist checklist={record.checklist} />
        <div className="flex flex-wrap gap-[var(--mpa-space-2)]">
          <Button type="button" size="sm" onClick={openHelp}>
            Show install help
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={refresh}>
            Refresh status
          </Button>
        </div>
      </div>
    </Card>
  );
}
