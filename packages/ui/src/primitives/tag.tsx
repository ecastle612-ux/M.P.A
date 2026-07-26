import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";
import { Badge, type BadgeProps } from "./badge";

export type TagProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeProps["variant"];
};

/**
 * UX-012 Slice B — Tag (alias of Badge semantic family; same token system).
 */
export function Tag({ className, variant = "neutral", ...props }: TagProps) {
  return <Badge variant={variant} className={cn(className)} {...props} />;
}
