import type { InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded-[var(--mpa-radius-sm)] border border-[var(--mpa-color-border-default)] text-[var(--mpa-color-brand-primary)] transition-colors duration-[var(--mpa-motion-fast)] focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-brand-primary)]/25 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
