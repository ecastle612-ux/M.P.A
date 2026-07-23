"use client";

import { Card, useTheme } from "@mpa/ui";

const OPTIONS = [
  { value: "light" as const, label: "Light", description: "Bright surfaces for daytime work" },
  { value: "dark" as const, label: "Dark", description: "Lower glare for evening use" },
  { value: "system" as const, label: "System", description: "Match your device setting" }
];

export function AppearanceSettingsPanel() {
  const { preference, mode, setPreference, darkModeEnabled } = useTheme();

  if (!darkModeEnabled) {
    return (
      <Card className="space-y-2 p-5">
        <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">Appearance</h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">Dark mode is not enabled in this environment.</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">Appearance</h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Choose light or dark mode. Current view: <span className="font-medium text-[var(--mpa-color-text-primary)]">{mode}</span>.
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="Color mode"
        className="grid gap-2 sm:grid-cols-3"
      >
        {OPTIONS.map((option) => {
          const selected = preference === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setPreference(option.value)}
              className={[
                "rounded-[var(--mpa-radius-md)] border px-3 py-3 text-left transition-colors",
                selected
                  ? "border-[var(--mpa-color-brand-primary)] bg-[var(--mpa-color-interactive-selected)] shadow-[var(--mpa-shadow-xs)]"
                  : "border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] hover:bg-[var(--mpa-color-interactive-row-hover)]"
              ].join(" ")}
            >
              <span className="block text-sm font-semibold text-[var(--mpa-color-text-primary)]">{option.label}</span>
              <span className="mt-0.5 block text-xs text-[var(--mpa-color-text-secondary)]">{option.description}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
