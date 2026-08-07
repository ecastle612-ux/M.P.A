"use client";

import Link from "next/link";
import { useCommercialContext } from "./commercial-context";

export function PlanBadge() {
  const { productLabel, productSku } = useCommercialContext();

  return (
    <Link
      href="/billing"
      className="hidden rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-xs font-medium text-[var(--mpa-color-text-primary)] md:inline-flex"
      title="View commercial plan"
    >
      {productSku ? productLabel : "Select product"}
    </Link>
  );
}
