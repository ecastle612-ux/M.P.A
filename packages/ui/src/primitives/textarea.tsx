import type { TextareaHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "w-full rounded-sm border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm text-[var(--mpa-color-text-primary)] outline-none placeholder:text-[var(--mpa-color-text-muted)] focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-brand-primary)]/25",
        className,
      )}
      {...props}
    />
  );
}
