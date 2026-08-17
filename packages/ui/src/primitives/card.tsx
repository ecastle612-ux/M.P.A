import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mpa-lift rounded-lg border border-[var(--mpa-color-border-default)] bg-white p-5 shadow-[0_1px_0_rgba(18,21,26,0.04)]",
        className
      )}
      {...props}
    />
  );
}
