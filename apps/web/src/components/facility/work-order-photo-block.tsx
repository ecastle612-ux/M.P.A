"use client";

import { MediaImage } from "../media/media-image";

export function WorkOrderPhotoBlock({
  photoPlaceholder
}: {
  photoPlaceholder: string | null;
}) {
  if (photoPlaceholder?.startsWith("media:")) {
    const mediaAssetId = photoPlaceholder.slice("media:".length);
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Photos</p>
        <MediaImage
          mediaAssetId={mediaAssetId}
          variant="small"
          alt="Work order photo"
          className="max-h-64 w-full max-w-md rounded-md object-cover"
        />
        <p className="text-xs text-[var(--mpa-color-text-secondary)]">
          Open Edit details to replace or update the image.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Photos</p>
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">
        {photoPlaceholder?.trim() || "No photo yet. Use Edit details to attach one."}
      </p>
    </div>
  );
}
