"use client";

import Link from "next/link";
import { BrandLogo } from "../branding/brand-logo";

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
      className={[
        "flex w-full items-center py-1",
        collapsed ? "justify-start" : "justify-center"
      ].join(" ")}
    >
      <BrandLogo purpose="drawer" collapsed={collapsed} decorative priority />
    </Link>
  );
}
