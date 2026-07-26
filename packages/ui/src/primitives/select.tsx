import type { SelectHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  error?: boolean;
};

/**
 * UX-012 Slice B — Select primitive (native).
 * States: default / focus / error / disabled.
 */
export function Select({ className, error = false, children, ...props }: SelectProps) {
  return (
    <select
      aria-invalid={error || undefined}
      className={cn(
        "h-10 w-full appearance-none rounded-[var(--mpa-radius-md)] border bg-[var(--mpa-color-bg-surface)] px-[var(--mpa-space-3)] text-[var(--mpa-font-size-body)] text-[var(--mpa-color-text-primary)] shadow-[var(--mpa-shadow-xs)] outline-none transition-colors duration-[var(--mpa-duration-fast)] focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-interactive-focus-ring)] disabled:cursor-not-allowed disabled:bg-[var(--mpa-color-interactive-disabled-bg)]",
        error
          ? "border-[var(--mpa-color-status-danger)] focus-visible:border-[var(--mpa-color-status-danger)]"
          : "border-[var(--mpa-color-border-default)] focus-visible:border-[var(--mpa-color-border-focus)]",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
