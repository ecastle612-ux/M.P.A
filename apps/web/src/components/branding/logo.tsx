import { cn } from "@mpa/ui";
import {
  MPA_BRAND_NAME,
  MPA_BRAND_TAGLINE,
  MPA_LOGO_ASPECT_RATIO,
  MPA_LOGO_PATH,
  MPA_LOGO_WIDTH
} from "../../lib/branding";

export type LogoSize = keyof typeof MPA_LOGO_WIDTH;

export function Logo({
  size,
  width,
  className,
  priority = false,
  "aria-hidden": ariaHidden
}: {
  /** Preset width from PX-005 sizing rules. */
  size?: LogoSize;
  /** Explicit pixel width override (height follows aspect ratio). */
  width?: number;
  className?: string;
  priority?: boolean;
  "aria-hidden"?: boolean;
}) {
  const displayWidth = width ?? (size ? MPA_LOGO_WIDTH[size] : MPA_LOGO_WIDTH.sidebarExpanded);
  const displayHeight = Math.round(displayWidth * MPA_LOGO_ASPECT_RATIO);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- official SVG asset; wrapper only, no artwork recreation
    <img
      src={MPA_LOGO_PATH}
      alt={ariaHidden ? "" : `${MPA_BRAND_NAME} ${MPA_BRAND_TAGLINE}`}
      width={displayWidth}
      height={displayHeight}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      aria-hidden={ariaHidden}
      className={cn("block h-auto max-w-full shrink-0 object-contain", className)}
    />
  );
}
