import type { TextareaHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "w-full rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3.5 py-2.5 text-sm text-[var(--mpa-color-text-primary)] shadow-[var(--mpa-shadow-xs)] outline-none transition-colors placeholder:text-[var(--mpa-color-text-muted)] focus-visible:border-[var(--mpa-color-border-focus)] focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-interactive-focus-ring)] disabled:cursor-not-allowed disabled:bg-[var(--mpa-color-interactive-disabled-bg)]",
        className
      )}
      {...props}
    />
  );
}
