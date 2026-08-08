"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { toDemoProductLabel, type DemoProductId } from "@mpa/shared";

function bootStorageKey(product: DemoProductId, surface: string): string {
  return `mpa_demo_boot:${product}:${surface}`;
}

function subscribeNoop(): () => void {
  return () => undefined;
}

function readBootFailed(product: DemoProductId, surface: string): boolean {
  try {
    return sessionStorage.getItem(bootStorageKey(product, surface)) === "1";
  } catch {
    return false;
  }
}

/**
 * Client bootstrap when the RSC surface cannot resolve a durable demo session.
 * Navigates through /api/demo/start (sets cookies) instead of leaving a blank page.
 */
export function DemoSessionBootstrap({
  product,
  surface
}: {
  product: DemoProductId;
  surface: string;
}) {
  const failed = useSyncExternalStore(
    subscribeNoop,
    () => readBootFailed(product, surface),
    () => false
  );

  useEffect(() => {
    if (failed) return;
    try {
      sessionStorage.setItem(bootStorageKey(product, surface), "1");
    } catch {
      // ignore storage failures
    }
    const target = `/api/demo/start?product=${encodeURIComponent(product)}&surface=${encodeURIComponent(surface)}`;
    window.location.replace(target);
  }, [failed, product, surface]);

  if (failed) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 px-4 py-16">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
          Live Demo
        </p>
        <h1 className="font-display text-2xl font-semibold">We couldn&apos;t start this demo</h1>
        <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
          The {toDemoProductLabel(product)} demonstration session failed to initialize. No account
          is required — please try again.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            className="rounded-md bg-[var(--mpa-color-brand-primary)] px-4 py-2 text-sm font-semibold text-white"
            onClick={() => {
              try {
                sessionStorage.removeItem(bootStorageKey(product, surface));
              } catch {
                // ignore
              }
              window.location.replace(
                `/api/demo/start?product=${encodeURIComponent(product)}&surface=${encodeURIComponent(surface)}`
              );
            }}
          >
            Try again
          </button>
          <Link
            href="/demo"
            className="rounded-md border border-[var(--mpa-color-border-default)] px-4 py-2 text-sm font-medium"
          >
            All demos
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-3 px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
        Live Demo
      </p>
      <h1 className="font-display text-2xl font-semibold">Preparing your demo…</h1>
      <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
        Loading the {toDemoProductLabel(product)} experience. No account or payment needed.
      </p>
      <div
        className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-[var(--mpa-color-bg-subtle,#F7F8FA)]"
        aria-hidden
      >
        <div className="h-full w-1/2 animate-pulse rounded-full bg-[var(--mpa-color-brand-primary)]" />
      </div>
    </main>
  );
}
