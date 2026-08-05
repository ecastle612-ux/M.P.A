import type { TextareaHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "min-h-[96px] w-full rounded-[var(--mpa-radius-sm)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm text-[var(--mpa-color-text-primary)] outline-none transition-[border-color,box-shadow,background-color] duration-[var(--mpa-motion-fast)] ease-[var(--mpa-ease-standard)] placeholder:text-[var(--mpa-color-text-muted)] hover:border-[var(--mpa-color-border-strong)] focus-visible:border-[var(--mpa-color-border-focus)] focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-brand-primary)]/25 disabled:cursor-not-allowed disabled:bg-[var(--mpa-color-interactive-disabled-bg)]",
        className,
      )}
      {...props}
    />
  );
}
