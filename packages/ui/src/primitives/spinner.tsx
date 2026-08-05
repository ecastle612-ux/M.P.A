import { cn } from "../lib/cn";

export function Spinner({ className }: { className?: string }) {
  return (
    <span role="status" aria-live="polite" className="inline-flex items-center">
      <span
        aria-label="Loading"
        className={cn(
          "inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--mpa-color-border-default)] border-t-[var(--mpa-color-brand-primary)]",
          className,
        )}
      />
      <span className="sr-only">Loading</span>
    </span>
  );
}
