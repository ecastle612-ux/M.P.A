import type { InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded-sm border border-[var(--mpa-color-border-default)] text-[var(--mpa-color-brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-brand-primary)]/25",
        className,
      )}
      {...props}
    />
  );
}
