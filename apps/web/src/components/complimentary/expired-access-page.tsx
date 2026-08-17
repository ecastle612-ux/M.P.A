"use client";

import { buttonClassName } from "@mpa/ui";
import { complimentaryExpiredPageCopy } from "@mpa/shared";
import Link from "next/link";

export function ComplimentaryExpiredAccessPage() {
  const copy = complimentaryExpiredPageCopy();
  return (
    <main className="mx-auto max-w-xl space-y-4 p-6">
      <h1 className="font-display text-2xl font-semibold">{copy.title}</h1>
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">{copy.body}</p>
      <p className="text-sm">{copy.dataLine}</p>
      <Link href={copy.convertPath} className={buttonClassName()}>
        {copy.ctaLabel}
      </Link>
    </main>
  );
}
