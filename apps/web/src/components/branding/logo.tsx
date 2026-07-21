"use client";

/**
 * @deprecated BR-001 — import BrandLogo / BrandSurfaceTone from "./brand-logo".
 * This file remains a compatibility shim during cutover.
 */

export { BrandLogo, BrandSurfaceTone, useBrandSurfaceTone } from "./brand-logo";
export type { BrandLogoProps } from "./brand-logo";

import { BrandLogo } from "./brand-logo";
import type { BrandLogoPurpose } from "../../lib/branding";

type LegacySize =
  | "sidebarCollapsed"
  | "sidebarExpanded"
  | "navigation"
  | "login"
  | "loading"
  | "mobile"
  | "email"
  | "pdf"
  | "inline";

/** @deprecated Use <BrandLogo purpose="…" /> */
export function Logo({
  size = "sidebarExpanded",
  priority = false,
  decorative = false,
  className,
  "aria-hidden": ariaHidden
}: {
  size?: LegacySize;
  tone?: unknown;
  className?: string;
  priority?: boolean;
  decorative?: boolean;
  "aria-hidden"?: boolean | undefined;
}) {
  const { purpose, collapsed } = mapLegacySize(size);
  return (
    <BrandLogo
      purpose={purpose}
      {...(collapsed ? { collapsed: true } : {})}
      priority={priority}
      decorative={decorative}
      {...(className ? { className } : {})}
      {...(ariaHidden !== undefined ? { "aria-hidden": ariaHidden } : {})}
    />
  );
}

function mapLegacySize(size: LegacySize): { purpose: BrandLogoPurpose; collapsed?: boolean } {
  switch (size) {
    case "login":
      return { purpose: "login" };
    case "loading":
      return { purpose: "loading" };
    case "navigation":
    case "mobile":
    case "inline":
      return { purpose: "drawer" };
    case "sidebarCollapsed":
      return { purpose: "sidebar", collapsed: true };
    case "sidebarExpanded":
      return { purpose: "sidebar" };
    case "email":
      return { purpose: "email" };
    case "pdf":
      return { purpose: "pdf" };
    default:
      return { purpose: "header" };
  }
}

export type LogoSize = LegacySize;
