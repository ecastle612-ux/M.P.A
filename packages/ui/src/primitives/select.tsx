import type { SelectHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 text-sm text-[var(--mpa-color-text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-brand-primary)]/25",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
