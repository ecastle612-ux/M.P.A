import type { InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-[var(--mpa-radius-sm)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 text-sm text-[var(--mpa-color-text-primary)] shadow-none outline-none transition-[border-color,box-shadow,background-color] duration-[var(--mpa-motion-fast)] ease-[var(--mpa-ease-standard)] placeholder:text-[var(--mpa-color-text-muted)] hover:border-[var(--mpa-color-border-strong)] focus-visible:border-[var(--mpa-color-border-focus)] focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-brand-primary)]/25 disabled:cursor-not-allowed disabled:bg-[var(--mpa-color-interactive-disabled-bg)] disabled:text-[var(--mpa-color-interactive-disabled-text)]",
        className,
      )}
      {...props}
    />
  );
}
