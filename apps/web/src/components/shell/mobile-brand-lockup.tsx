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
      className="flex w-full items-center justify-start py-1"
    >
      <BrandLogo purpose="drawer" collapsed={collapsed} decorative priority />
    </Link>
  );
}
