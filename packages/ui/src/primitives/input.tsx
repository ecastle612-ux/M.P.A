import type { InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3.5 text-sm text-[var(--mpa-color-text-primary)] shadow-[var(--mpa-shadow-xs)] outline-none transition-colors duration-[var(--mpa-duration-fast)] placeholder:text-[var(--mpa-color-text-muted)] focus-visible:border-[var(--mpa-color-border-focus)] focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-interactive-focus-ring)] disabled:cursor-not-allowed disabled:bg-[var(--mpa-color-interactive-disabled-bg)] disabled:text-[var(--mpa-color-interactive-disabled-text)]",
        className
      )}
      {...props}
    />
  );
}
