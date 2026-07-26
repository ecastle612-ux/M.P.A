"use client";

import { useTheme } from "@mpa/ui";

/**
 * Always-visible theme escape hatch for every ops/portal shell (including Master Admin HQ).
 * Uses the same ThemeProvider instance as root AppProviders (`@mpa/ui`).
 */
export function ThemeModeToggle() {
  const { mode, setPreference, darkModeEnabled } = useTheme();

  if (!darkModeEnabled) return null;

  const next = mode === "dark" ? "light" : "dark";
  const label = mode === "dark" ? "Light mode" : "Dark mode";

  return (
    <button
      type="button"
      onClick={() => setPreference(next)}
      aria-label={`Switch to ${next} mode`}
      title={label}
      className="mpa-chrome-control mpa-touch-target inline-flex shrink-0 items-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-2.5 text-xs font-semibold text-[var(--mpa-color-text-primary)] transition-colors hover:bg-[var(--mpa-color-interactive-row-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mpa-color-border-focus)]"
    >
      {label}
    </button>
  );
}
