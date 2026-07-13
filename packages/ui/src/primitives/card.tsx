import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg border border-[var(--mpa-color-border-default)] bg-white p-4", className)}
      {...props}
    />
  );
}
