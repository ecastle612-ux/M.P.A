import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-5 transition-[border-color,box-shadow] duration-[var(--mpa-motion-fast)] ease-[var(--mpa-ease-standard)]",
        className,
      )}
      {...props}
    />
  );
}
