import { cn } from "./cn";

/**
 * Shared selected-state recipes for tabs / segmented controls / nav pills.
 * Always use semantic tokens so light and dark themes keep contrast.
 */

/** Track behind a segmented control (TabsList). */
export const segmentedTrackClassName =
  "inline-flex rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-bg-surface-muted)] p-1";

/** Base classes for a segmented / tab / pill trigger (all states). */
export const segmentedTriggerBaseClassName = [
  "rounded-[var(--mpa-radius-sm)] px-3 py-1.5 text-sm font-medium transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--mpa-color-bg-app)]",
  "disabled:cursor-not-allowed disabled:bg-[var(--mpa-color-interactive-disabled-bg)] disabled:text-[var(--mpa-color-interactive-disabled-text)] disabled:opacity-100"
].join(" ");

/** Soft selected pill (elevated surface on muted track) — preferred for Tabs. */
export function segmentedTriggerClassName(selected: boolean, className?: string): string {
  return cn(
    segmentedTriggerBaseClassName,
    selected
      ? "bg-[var(--mpa-color-bg-surface)] text-[var(--mpa-color-text-primary)] shadow-[var(--mpa-shadow-xs)]"
      : "text-[var(--mpa-color-text-secondary)] hover:bg-[var(--mpa-color-interactive-row-hover)] hover:text-[var(--mpa-color-text-primary)]",
    className
  );
}

/**
 * Inline nav pills (subnav links without a track).
 * Selected uses interactive-selected so it never becomes light-on-light in dark mode.
 */
export function navPillClassName(selected: boolean, className?: string): string {
  return cn(
    "rounded-[var(--mpa-radius-md)] px-3 py-1.5 text-sm transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--mpa-color-bg-app)]",
    selected
      ? "bg-[var(--mpa-color-interactive-selected)] font-medium text-[var(--mpa-color-text-primary)]"
      : "text-[var(--mpa-color-text-secondary)] hover:bg-[var(--mpa-color-interactive-row-hover)] hover:text-[var(--mpa-color-text-primary)]",
    className
  );
}

/** Strong filled pill (workspace switchers) — brand fill + inverse text. */
export function filledPillClassName(selected: boolean, className?: string): string {
  return cn(
    "shrink-0 rounded-[var(--mpa-radius-md)] px-3 py-1.5 text-sm font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--mpa-color-bg-app)]",
    "disabled:cursor-not-allowed disabled:bg-[var(--mpa-color-interactive-disabled-bg)] disabled:text-[var(--mpa-color-interactive-disabled-text)]",
    selected
      ? "bg-[var(--mpa-color-brand-primary)] text-[var(--mpa-color-text-inverse)]"
      : "border border-[var(--mpa-color-border-default)] text-[var(--mpa-color-text-secondary)] hover:bg-[var(--mpa-color-interactive-row-hover)] hover:text-[var(--mpa-color-text-primary)]",
    className
  );
}
