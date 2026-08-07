import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[var(--mpa-color-bg-sunken,#E5E7EB)]",
        className
      )}
      {...props}
    />
  );
}
