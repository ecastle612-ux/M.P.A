import type { TextareaHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: boolean;
};

/**
 * UX-012 Slice B — Textarea primitive.
 * States: default / focus / error / disabled.
 */
export function Textarea({ className, error = false, ...props }: TextareaProps) {
  return (
    <textarea
      aria-invalid={error || undefined}
      className={cn(
        "w-full rounded-[var(--mpa-radius-md)] border bg-[var(--mpa-color-bg-surface)] px-[var(--mpa-space-3)] py-[var(--mpa-space-2)] text-[var(--mpa-font-size-body)] text-[var(--mpa-color-text-primary)] shadow-[var(--mpa-shadow-xs)] outline-none transition-colors duration-[var(--mpa-duration-fast)] placeholder:text-[var(--mpa-color-text-muted)] focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-interactive-focus-ring)] disabled:cursor-not-allowed disabled:bg-[var(--mpa-color-interactive-disabled-bg)]",
        error
          ? "border-[var(--mpa-color-status-danger)] focus-visible:border-[var(--mpa-color-status-danger)]"
          : "border-[var(--mpa-color-border-default)] focus-visible:border-[var(--mpa-color-border-focus)]",
        className
      )}
      {...props}
    />
  );
}
