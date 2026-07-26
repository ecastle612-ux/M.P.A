import { cn } from "@mpa/ui/cn";
import type { PwaChecklistState } from "../../lib/pwa/onboarding-storage";

const ITEMS: Array<{ key: keyof PwaChecklistState; label: string; hint: string }> = [
  { key: "installed", label: "Installed", hint: "App opens from Home Screen / installed PWA" },
  { key: "notifications", label: "Notifications enabled", hint: "Alerts after install (Settings anytime)" },
  { key: "offlineReady", label: "Offline ready", hint: "Service worker offline shell available" },
  { key: "cameraReady", label: "Camera ready", hint: "Marked on first camera use — not required to finish setup" }
];

export function InstallChecklist({
  checklist,
  className
}: {
  checklist: PwaChecklistState;
  className?: string;
}) {
  return (
    <ul className={cn("space-y-[var(--mpa-space-2)]", className)} aria-label="Install setup checklist">
      {ITEMS.map((item) => {
        const done = checklist[item.key];
        return (
          <li
            key={item.key}
            className="flex items-start gap-[var(--mpa-space-3)] rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-[var(--mpa-space-3)] py-[var(--mpa-space-2)]"
          >
            <span
              className={cn(
                "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[var(--mpa-font-size-micro)] font-[var(--mpa-font-weight-semibold)]",
                done
                  ? "bg-[var(--mpa-color-status-success-subtle)] text-[var(--mpa-color-status-success)]"
                  : "bg-[var(--mpa-color-bg-surface-muted)] text-[var(--mpa-color-text-muted)]"
              )}
              aria-hidden
            >
              {done ? "✓" : "·"}
            </span>
            <div className="min-w-0">
              <p className="mpa-text-body font-[var(--mpa-font-weight-medium)] text-[var(--mpa-color-text-primary)]">
                {item.label}
                <span className="sr-only">{done ? " complete" : " incomplete"}</span>
              </p>
              <p className="mpa-text-caption text-[var(--mpa-color-text-secondary)]">{item.hint}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
