import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "info";

export function Badge({
  className,
  variant = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium",
        variant === "neutral" && "bg-gray-100 text-gray-700",
        variant === "success" && "bg-[#E3F5EE] text-[#0E7A57]",
        variant === "warning" && "bg-[#FEF3C7] text-[#B45309]",
        variant === "danger" && "bg-[#FCE8E6] text-[#C0392B]",
        variant === "info" && "bg-[#E5F1FA] text-[#1D6AA5]",
        className,
      )}
      {...props}
    />
  );
}
