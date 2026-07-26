"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Skeleton } from "@mpa/ui";
import type { MediaVariant } from "../../lib/media/constants";

const VARIANT_SIZE: Record<MediaVariant, number> = {
  thumb: 48,
  small: 96,
  medium: 320,
  large: 960,
  original: 1280
};

function FallbackAvatar({
  fallback,
  className,
  alt
}: {
  fallback: string;
  className?: string;
  alt: string;
}) {
  return (
    <span
      aria-label={alt || fallback}
      className={
        className ??
        "inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mpa-color-bg-surface-muted)] text-xs font-semibold text-[var(--mpa-color-text-secondary)]"
      }
    >
      {fallback.slice(0, 2).toUpperCase()}
    </span>
  );
}

/**
 * PMX-004 Phase 8 — MediaImage resolves signed URLs then renders via next/image.
 * BrandLogo / QR / blob previews intentionally stay outside this path.
 */
export function MediaImage({
  mediaAssetId,
  variant = "small",
  alt,
  className,
  fallback,
  priority = false
}: {
  mediaAssetId: string | null | undefined;
  variant?: MediaVariant;
  alt: string;
  className?: string;
  fallback?: string;
  priority?: boolean;
}) {
  const [resolved, setResolved] = useState<{ assetId: string; url: string | null } | null>(null);
  const label = fallback ?? "MP";
  const pixelSize = VARIANT_SIZE[variant] ?? VARIANT_SIZE.small;

  useEffect(() => {
    if (!mediaAssetId) {
      return;
    }
    const assetId = mediaAssetId;
    let cancelled = false;
    void (async () => {
      const response = await fetch(`/api/media/${assetId}?variant=${variant}`);
      if (cancelled) return;
      if (!response.ok) {
        setResolved({ assetId, url: null });
        return;
      }
      const payload = (await response.json()) as { url?: string };
      if (!cancelled) {
        setResolved({ assetId, url: payload.url ?? null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mediaAssetId, variant]);

  if (!mediaAssetId) {
    return (
      <FallbackAvatar
        fallback={label}
        alt={alt}
        {...(className ? { className } : {})}
      />
    );
  }

  const ready = resolved?.assetId === mediaAssetId;
  if (!ready) {
    return <Skeleton className={className ?? "h-10 w-10 rounded-full"} />;
  }

  if (!resolved.url) {
    return (
      <FallbackAvatar
        fallback={label}
        alt={alt}
        {...(className ? { className } : {})}
      />
    );
  }

  return (
    <Image
      src={resolved.url}
      alt={alt}
      width={pixelSize}
      height={pixelSize}
      sizes={`${pixelSize}px`}
      priority={priority}
      className={className ?? "h-10 w-10 rounded-full object-cover"}
      // Signed Supabase URLs are short-lived; avoid optimizer cache of expired URLs.
      unoptimized
    />
  );
}
