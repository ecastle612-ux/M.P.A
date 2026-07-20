"use client";

import { useEffect, useState } from "react";
import { Avatar, Skeleton } from "@mpa/ui";
import type { MediaVariant } from "../../lib/media/constants";

export function MediaImage({
  mediaAssetId,
  variant = "small",
  alt,
  className,
  fallback
}: {
  mediaAssetId: string | null | undefined;
  variant?: MediaVariant;
  alt: string;
  className?: string;
  fallback?: string;
}) {
  const [resolved, setResolved] = useState<{ assetId: string; url: string | null } | null>(null);

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
    return <Avatar src={undefined} fallback={fallback ?? "MP"} className={className} />;
  }

  const ready = resolved?.assetId === mediaAssetId;
  if (!ready) {
    return <Skeleton className={className ?? "h-10 w-10 rounded-full"} />;
  }

  return (
    <Avatar src={resolved.url ?? undefined} fallback={fallback ?? "MP"} className={className} alt={alt} />
  );
}
