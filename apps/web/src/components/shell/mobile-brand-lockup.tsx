"use client";

import Link from "next/link";
import { MPA_BRAND_NAME, MPA_BRAND_TAGLINE } from "@mpa/shared";
import { Logo } from "../branding/logo";

const PRODUCT_LINE = "Property Operations OS";

export function MobileBrandLockup({
  collapsed,
  onNavigate
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href="/dashboard"
      {...(onNavigate ? { onClick: onNavigate } : {})}
      aria-label={`${MPA_BRAND_NAME} ${MPA_BRAND_TAGLINE}`}
      className={[
        "flex w-full items-center transition-[gap,padding] duration-[var(--mpa-duration-fast)]",
        collapsed ? "justify-start gap-2.5 py-1" : "flex-col justify-center gap-2 py-2 text-center"
      ].join(" ")}
    >
      <Logo size={collapsed ? "mobile" : "navigation"} decorative priority />
      {collapsed ? (
        <span className="font-display text-base font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">
          {MPA_BRAND_NAME}
        </span>
      ) : (
        <span className="space-y-0.5">
          <span className="block font-display text-xl font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">
            {MPA_BRAND_NAME}
          </span>
          <span className="block text-xs text-[var(--mpa-color-text-secondary)]">{MPA_BRAND_TAGLINE}</span>
          <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--mpa-color-text-muted)]">
            {PRODUCT_LINE}
          </span>
        </span>
      )}
    </Link>
  );
}
