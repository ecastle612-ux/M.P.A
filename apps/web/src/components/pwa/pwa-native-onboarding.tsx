"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@mpa/ui";
import {
  captureBeforeInstallPrompt,
  getDeferredInstallPrompt,
  promptInstall,
  subscribeDeferredInstallPrompt,
  type BeforeInstallPromptEvent
} from "../../lib/pwa/before-install-prompt";
import {
  markCameraReadyFromIntent,
  syncCameraReadyFromPermissions
} from "../../lib/pwa/camera-readiness";
import { emitPwaFunnelEvent, PWA_FUNNEL_EVENTS } from "../../lib/pwa/funnel";
import { subscribeOfflineReady } from "../../lib/pwa/offline-ready";
import {
  completeOnboardingIdempotent,
  dismissOnboardingWithBackoff,
  isForceOpenInstallHelp,
  isSetupComplete,
  markChecklist,
  readOnboardingRecord,
  setForceOpenInstallHelp,
  shouldShowOnboardingUi,
  type PwaOnboardingRecord
} from "../../lib/pwa/onboarding-storage";
import { detectPwaPlatform, isInstallCoachingEligible } from "../../lib/pwa/platform";
import { isStandaloneDisplay, subscribeStandaloneChange } from "../../lib/pwa/standalone";
import {
  clearEnrollmentSuppression,
  markEnrollmentCompleted,
  suppressEnrollmentDenied,
  suppressEnrollmentNotNow
} from "../../lib/notifications/enrollment-suppression";
import {
  loadOneSignalSdkScript,
  obtainPushSubscription,
  registerDeviceWithServer
} from "../../lib/notifications/client-push";
import { useOrganizationContext } from "../shell/organization-context";
import { useRoleContext } from "../shell/role-context";
import { InstallChecklist } from "./install-checklist";
import { IosA2hsSheet } from "./ios-a2hs-sheet";

type Surface = "banner" | "checklist" | "notify" | "hidden";

/**
 * PMX-004 Phase 2 — Native Installation Experience (non-blocking).
 * Mount inside AuthenticatedContextProviders (ops + portal shells).
 */
export function PwaNativeOnboarding({ settingsHref }: { settingsHref: string }) {
  const { activeOrganizationId } = useOrganizationContext();
  const { activeRole } = useRoleContext();
  const organizationId = activeOrganizationId;
  const platform = useMemo(() => detectPwaPlatform(), []);

  const [standalone, setStandalone] = useState(false);
  const [bip, setBip] = useState<BeforeInstallPromptEvent | null>(null);
  const [record, setRecord] = useState<PwaOnboardingRecord>(() =>
    readOnboardingRecord(organizationId)
  );
  const [iosSheetOpen, setIosSheetOpen] = useState(false);
  const [notifyWorking, setNotifyWorking] = useState(false);
  const [shellReady, setShellReady] = useState(false);
  const [forceOpen, setForceOpen] = useState(false);

  const funnelBase = useMemo(
    () => ({
      platform,
      standalone,
      role: activeRole,
      organizationId
    }),
    [platform, standalone, activeRole, organizationId]
  );

  const refreshRecord = useCallback(() => {
    setRecord(readOnboardingRecord(organizationId));
  }, [organizationId]);

  useEffect(() => {
    setStandalone(isStandaloneDisplay());
    return subscribeStandaloneChange(setStandalone);
  }, []);

  useEffect(() => {
    refreshRecord();
    setForceOpen(isForceOpenInstallHelp());
    function onOpenHelp() {
      setForceOpen(true);
    }
    window.addEventListener("mpa:pwa-open-install-help", onOpenHelp);
    return () => window.removeEventListener("mpa:pwa-open-install-help", onOpenHelp);
  }, [organizationId, refreshRecord]);

  useEffect(() => {
    const timer = window.setTimeout(() => setShellReady(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  // Capture BIP early (even before banner shows).
  useEffect(() => {
    const onBip = (event: Event) => {
      captureBeforeInstallPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    setBip(getDeferredInstallPrompt());
    const unsub = subscribeDeferredInstallPrompt(setBip);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      unsub();
    };
  }, []);

  useEffect(() => {
    return subscribeOfflineReady((ready) => {
      if (!ready) return;
      const next = markChecklist(organizationId, { offlineReady: true });
      setRecord(next);
    });
  }, [organizationId]);

  // Standalone / installed transitions.
  useEffect(() => {
    if (!standalone) return;
    const next = markChecklist(organizationId, { installed: true });
    setRecord(next);
    emitPwaFunnelEvent(PWA_FUNNEL_EVENTS.installed, { ...funnelBase, standalone: true });
  }, [standalone, organizationId, funnelBase]);

  // Landing + camera sync (no prompt).
  useEffect(() => {
    if (!shellReady) return;
    if (!isInstallCoachingEligible(platform, standalone) && !standalone) return;
    emitPwaFunnelEvent(PWA_FUNNEL_EVENTS.landing, funnelBase);
    void syncCameraReadyFromPermissions({
      organizationId,
      platform,
      standalone,
      role: activeRole
    }).then((granted) => {
      if (granted) refreshRecord();
    });
  }, [shellReady, platform, standalone, organizationId, activeRole, funnelBase, refreshRecord]);

  // Notification permission already granted → checklist.
  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    const next = markChecklist(organizationId, { notifications: true });
    setRecord(next);
  }, [organizationId, standalone]);

  // Complete when setup criteria met.
  useEffect(() => {
    if (!isSetupComplete(record.checklist)) return;
    if (record.completed) return;
    const next = completeOnboardingIdempotent(organizationId);
    setRecord(next);
    emitPwaFunnelEvent(PWA_FUNNEL_EVENTS.setupCompleted, funnelBase);
    setForceOpenInstallHelp(false);
    setForceOpen(false);
  }, [record.checklist, record.completed, organizationId, funnelBase]);

  const showUi =
    shellReady &&
    shouldShowOnboardingUi(organizationId, { forceOpen }) &&
    (isInstallCoachingEligible(platform, standalone) || forceOpen || standalone);

  const surface: Surface = useMemo(() => {
    if (!showUi) return "hidden";
    if (forceOpen) return "checklist";
    if (!record.checklist.installed && !standalone) {
      if (platform === "ios-safari") return "banner";
      if (platform === "android-chrome" || platform === "desktop") {
        return bip || platform === "desktop" ? "banner" : "banner";
      }
      return "banner";
    }
    if (record.checklist.installed && !record.checklist.notifications) return "notify";
    if (!record.completed) return "checklist";
    return "hidden";
  }, [showUi, forceOpen, record, standalone, platform, bip]);

  async function handleAndroidInstall() {
    emitPwaFunnelEvent(PWA_FUNNEL_EVENTS.installPromptViewed, funnelBase);
    const outcome = await promptInstall();
    if (outcome === "accepted") {
      emitPwaFunnelEvent(PWA_FUNNEL_EVENTS.installAccepted, funnelBase);
      const next = markChecklist(organizationId, { installed: true });
      setRecord(next);
      return;
    }
    if (outcome === "unavailable" && platform === "desktop") {
      // Desktop without BIP: open checklist / help.
      setForceOpen(true);
    }
  }

  function handleOpenIosSheet() {
    emitPwaFunnelEvent(PWA_FUNNEL_EVENTS.installPromptViewed, funnelBase);
    setIosSheetOpen(true);
  }

  function handleIosConfirm() {
    emitPwaFunnelEvent(PWA_FUNNEL_EVENTS.installAccepted, funnelBase);
    setIosSheetOpen(false);
    // Success confirmed when standalone returns; optimistic mark if already standalone.
    if (isStandaloneDisplay()) {
      const next = markChecklist(organizationId, { installed: true });
      setRecord(next);
    }
  }

  function handleRemindLater() {
    const next = dismissOnboardingWithBackoff(organizationId);
    setRecord(next);
    setIosSheetOpen(false);
    setForceOpenInstallHelp(false);
    setForceOpen(false);
  }

  async function handleEnableNotifications() {
    if (!record.checklist.installed && !standalone) return;
    setNotifyWorking(true);
    clearEnrollmentSuppression();
    try {
      loadOneSignalSdkScript();
      const result = await obtainPushSubscription();
      if (result.status === "denied") {
        suppressEnrollmentDenied();
        setNotifyWorking(false);
        return;
      }
      if (result.status === "error") {
        setNotifyWorking(false);
        return;
      }
      const registered = await registerDeviceWithServer({
        subscriptionId: result.subscriptionId,
        enrolledVia: "pwa",
        deviceLabel: "Installed PWA"
      });
      if (!registered.ok) {
        setNotifyWorking(false);
        return;
      }
      markEnrollmentCompleted();
      const next = markChecklist(organizationId, { notifications: true });
      setRecord(next);
      emitPwaFunnelEvent(PWA_FUNNEL_EVENTS.notificationsGranted, funnelBase);
    } catch {
      /* retry-safe: leave checklist open */
    } finally {
      setNotifyWorking(false);
    }
  }

  function handleNotifyNotNow() {
    suppressEnrollmentNotNow();
    handleRemindLater();
  }

  function handleFinishHelp() {
    setForceOpenInstallHelp(false);
    setForceOpen(false);
    if (isSetupComplete(record.checklist)) {
      setRecord(completeOnboardingIdempotent(organizationId));
    } else {
      handleRemindLater();
    }
  }

  // Expose camera intent for media upload without mounting extra UI.
  useEffect(() => {
    function onCameraIntent() {
      markCameraReadyFromIntent({
        organizationId,
        platform,
        standalone,
        role: activeRole
      });
      refreshRecord();
    }
    window.addEventListener("mpa:pwa-camera-intent", onCameraIntent);
    return () => window.removeEventListener("mpa:pwa-camera-intent", onCameraIntent);
  }, [organizationId, platform, standalone, activeRole, refreshRecord]);

  if (surface === "hidden" && !iosSheetOpen) return null;

  return (
    <>
      <IosA2hsSheet
        open={iosSheetOpen}
        onDismiss={handleRemindLater}
        onConfirmAdded={handleIosConfirm}
      />

      {surface === "banner" ? (
        <div
          role="region"
          aria-label="Install M.P.A."
          className="border-b border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-[var(--mpa-space-4)] py-[var(--mpa-space-3)]"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-[var(--mpa-space-3)] sm:flex-row sm:items-center sm:justify-between">
            <p className="mpa-text-body text-[var(--mpa-color-text-secondary)]">
              {platform === "ios-safari"
                ? "Install M.P.A. on your Home Screen for a faster, app-like experience."
                : bip
                  ? "Install M.P.A. for quicker access and a native feel."
                  : "Install M.P.A. when your browser offers it — or open install help anytime in Settings."}
            </p>
            <div className="flex flex-wrap gap-[var(--mpa-space-2)]">
              {platform === "ios-safari" ? (
                <Button type="button" size="sm" onClick={handleOpenIosSheet}>
                  How to install
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  disabled={!bip && platform === "android-chrome"}
                  onClick={() => void handleAndroidInstall()}
                >
                  Install app
                </Button>
              )}
              <Button type="button" size="sm" variant="secondary" onClick={handleRemindLater}>
                Remind me later
              </Button>
              <Link
                href={settingsHref}
                className="inline-flex items-center mpa-text-caption font-[var(--mpa-font-weight-medium)] text-[var(--mpa-color-brand-primary)] hover:underline"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {surface === "notify" ? (
        <div
          role="region"
          aria-label="Enable notifications after install"
          className="border-b border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-[var(--mpa-space-4)] py-[var(--mpa-space-3)]"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-[var(--mpa-space-3)] sm:flex-row sm:items-center sm:justify-between">
            <p className="mpa-text-body text-[var(--mpa-color-text-secondary)]">
              App installed. Enable notifications for maintenance, leases, and emergencies.
            </p>
            <div className="flex flex-wrap gap-[var(--mpa-space-2)]">
              <Button
                type="button"
                size="sm"
                disabled={notifyWorking}
                onClick={() => void handleEnableNotifications()}
              >
                {notifyWorking ? "Enabling…" : "Enable notifications"}
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={handleNotifyNotNow}>
                Not now
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {surface === "checklist" ? (
        <div
          role="region"
          aria-label="Install setup checklist"
          className="border-b border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface-muted)] px-[var(--mpa-space-4)] py-[var(--mpa-space-4)]"
        >
          <div className="mx-auto max-w-7xl space-y-[var(--mpa-space-3)]">
            <div className="flex flex-wrap items-start justify-between gap-[var(--mpa-space-3)]">
              <div>
                <p className="font-display text-[var(--mpa-font-size-subheading)] font-[var(--mpa-font-weight-semibold)] text-[var(--mpa-color-text-primary)]">
                  Finish install setup
                </p>
                <p className="mpa-text-caption text-[var(--mpa-color-text-secondary)]">
                  Non-blocking — continue working anytime. Camera is optional until you use it.
                </p>
              </div>
              <Button type="button" size="sm" variant="secondary" onClick={handleFinishHelp}>
                {record.completed || isSetupComplete(record.checklist) ? "Done" : "Remind me later"}
              </Button>
            </div>
            <InstallChecklist checklist={record.checklist} />
            {!record.checklist.installed && platform === "ios-safari" ? (
              <Button type="button" size="sm" onClick={handleOpenIosSheet}>
                Show install steps
              </Button>
            ) : null}
            {!record.checklist.installed && bip ? (
              <Button type="button" size="sm" onClick={() => void handleAndroidInstall()}>
                Install app
              </Button>
            ) : null}
            {record.checklist.installed && !record.checklist.notifications ? (
              <Button
                type="button"
                size="sm"
                disabled={notifyWorking}
                onClick={() => void handleEnableNotifications()}
              >
                Enable notifications
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
