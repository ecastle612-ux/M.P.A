/**
 * PMX-004 Phase 2 — beforeinstallprompt typing + capture helpers.
 */

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<(event: BeforeInstallPromptEvent | null) => void>();

export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

export function setDeferredInstallPrompt(event: BeforeInstallPromptEvent | null): void {
  deferredPrompt = event;
  for (const listener of listeners) listener(event);
}

export function subscribeDeferredInstallPrompt(
  listener: (event: BeforeInstallPromptEvent | null) => void
): () => void {
  listeners.add(listener);
  listener(deferredPrompt);
  return () => {
    listeners.delete(listener);
  };
}

export function captureBeforeInstallPrompt(event: Event): void {
  event.preventDefault();
  setDeferredInstallPrompt(event as BeforeInstallPromptEvent);
}

export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  const promptEvent = deferredPrompt;
  if (!promptEvent) return "unavailable";
  await promptEvent.prompt();
  const choice = await promptEvent.userChoice;
  setDeferredInstallPrompt(null);
  return choice.outcome === "accepted" ? "accepted" : "dismissed";
}
