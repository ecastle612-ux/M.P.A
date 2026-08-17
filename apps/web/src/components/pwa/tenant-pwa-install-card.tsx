"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@mpa/ui";
import { appleInstallSteps, detectPwaInstallSurface, type PwaInstallSurface } from "../../lib/pwa/install-experience";

const DISMISS_KEY = "mpa.pwa.install.dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function subscribeDismissed(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getDismissedSnapshot() {
  return window.localStorage.getItem(DISMISS_KEY) === "1";
}

function getServerDismissedSnapshot() {
  return false;
}

function readStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export function TenantPwaInstallCard() {
  const dismissed = useSyncExternalStore(subscribeDismissed, getDismissedSnapshot, getServerDismissedSnapshot);
  const [surface, setSurface] = useState<PwaInstallSurface | null>(null);
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const standalone = readStandalone();
    const onPrompt = (event: Event) => {
      event.preventDefault();
      const pending = event as BeforeInstallPromptEvent;
      setPromptEvent(pending);
      setSurface(
        detectPwaInstallSurface({
          userAgent: window.navigator.userAgent,
          standalone,
          displayModeStandalone: window.matchMedia("(display-mode: standalone)").matches,
          canPrompt: true
        })
      );
    };
    const onInstalled = () => {
      setSurface("standalone");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    const frame = window.requestAnimationFrame(() => {
      setSurface(
        detectPwaInstallSurface({
          userAgent: window.navigator.userAgent,
          standalone,
          displayModeStandalone: window.matchMedia("(display-mode: standalone)").matches,
          canPrompt: false
        })
      );
    });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!surface || surface === "standalone" || surface === "unsupported" || dismissed) {
    return null;
  }

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    window.dispatchEvent(new Event("storage"));
  }

  async function installAndroid() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    setPromptEvent(null);
  }

  return (
    <section className="rounded-2xl border border-[var(--mpa-color-border-default)] bg-white p-4 shadow-[0_1px_0_rgba(18,21,26,0.04)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
        Optional
      </p>
      <h2 className="mt-1 font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
        Add M.P.A. to this device
      </h2>
      <p className="mt-1 text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
        Installation is optional. You can keep using M.P.A. in the browser.
      </p>
      {surface === "apple" ? (
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
          {appleInstallSteps().map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      ) : null}
      {surface === "android" && promptEvent ? (
        <div className="mt-3">
          <Button type="button" onClick={() => void installAndroid()}>
            Install M.P.A.
          </Button>
        </div>
      ) : null}
      {surface === "android" && !promptEvent ? (
        <p className="mt-3 text-sm text-[var(--mpa-color-text-secondary)]">
          Use your browser menu to install or add M.P.A. to the Home screen.
        </p>
      ) : null}
      {surface === "desktop" ? (
        <p className="mt-3 text-sm text-[var(--mpa-color-text-secondary)]">
          {promptEvent
            ? "Your browser can install M.P.A. as an app window."
            : "You can keep working in this browser tab."}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {surface === "desktop" && promptEvent ? (
          <Button type="button" onClick={() => void installAndroid()}>
            Install M.P.A.
          </Button>
        ) : null}
        <Button type="button" variant="secondary" onClick={dismiss}>
          Continue in browser
        </Button>
      </div>
    </section>
  );
}
