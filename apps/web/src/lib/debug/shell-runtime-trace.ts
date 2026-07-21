/**
 * SH-003 runtime instrumentation.
 * Enable: localStorage.setItem("mpaDebugShell", "1") or ?mpaDebugShell=1
 * Dump: window.__MPA_SHELL_TRACE__ / copy(JSON.stringify(window.__MPA_SHELL_TRACE__))
 */

export type ShellTraceEvent = {
  t: number;
  type: string;
  /** Present only when a payload was supplied — never `detail: undefined` (exactOptionalPropertyTypes). */
  detail?: Record<string, unknown>;
};

const MAX_EVENTS = 2000;
const events: ShellTraceEvent[] = [];
let enabled = false;

function now() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

/**
 * Build a ShellTraceEvent without assigning `detail: undefined`.
 * With exactOptionalPropertyTypes, optional props must be omitted when absent.
 */
function appendTraceEvent(type: string, detail?: Record<string, unknown>): void {
  const event: ShellTraceEvent =
    detail === undefined ? { t: now(), type } : { t: now(), type, detail };
  events.push(event);
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
}

export function isShellTraceEnabled(): boolean {
  return enabled;
}

export function initShellRuntimeTrace(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  enabled =
    params.get("mpaDebugShell") === "1" || window.localStorage.getItem("mpaDebugShell") === "1";
  if (!enabled) return;

  const w = window as Window & { __MPA_SHELL_TRACE__?: ShellTraceEvent[] };
  w.__MPA_SHELL_TRACE__ = events;

  document.addEventListener(
    "focusin",
    (event) => {
      const target = event.target as HTMLElement | null;
      appendTraceEvent("focusin", {
        tag: target?.tagName,
        id: target?.id,
        name: (target as HTMLInputElement | null)?.name,
        placeholder: (target as HTMLInputElement | null)?.placeholder
      });
    },
    true
  );

  document.addEventListener(
    "focusout",
    (event) => {
      const target = event.target as HTMLElement | null;
      const related = event.relatedTarget as HTMLElement | null;
      appendTraceEvent("focusout", {
        tag: target?.tagName,
        placeholder: (target as HTMLInputElement | null)?.placeholder,
        relatedTag: related?.tagName,
        relatedPlaceholder: (related as HTMLInputElement | null)?.placeholder
      });
    },
    true
  );

  document.addEventListener(
    "visibilitychange",
    () => appendTraceEvent("visibilitychange", { state: document.visibilityState }),
    true
  );

  window.addEventListener(
    "resize",
    () => appendTraceEvent("resize", { w: window.innerWidth, h: window.innerHeight }),
    { passive: true }
  );

  appendTraceEvent("trace-init", { href: window.location.href, ua: navigator.userAgent });
}

export function shellTrace(type: string, detail?: Record<string, unknown>): void {
  if (!enabled || typeof window === "undefined") return;
  appendTraceEvent(type, detail);
}
