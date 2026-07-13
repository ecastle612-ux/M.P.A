import type { InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-sm border border-[var(--mpa-color-border-default)] bg-white px-3 text-sm text-[var(--mpa-color-text-primary)] shadow-none outline-none placeholder:text-[var(--mpa-color-text-muted)] focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-brand-primary)]/25",
        className,
      )}
      {...props}
    />
  );
}
