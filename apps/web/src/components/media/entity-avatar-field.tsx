"use client";

import { Avatar } from "@mpa/ui";
import { MediaUpload, profilePhotoUploadIntent } from "./media-upload";

export function EntityAvatarField({
  label = "Profile photo",
  initials,
  avatarUrl,
  avatarMediaAssetId,
  onMediaChange
}: {
  label?: string;
  initials: string;
  avatarUrl?: string | null;
  avatarMediaAssetId: string | null;
  onMediaChange: (mediaAssetId: string | null) => void;
}) {
  return (
    <div className="space-y-3 rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface-muted)] p-4">
      <div className="flex items-center gap-3">
        <Avatar src={avatarUrl || undefined} fallback={initials.slice(0, 2).toUpperCase() || "MP"} />
        <div>
          <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{label}</p>
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">
            Upload, crop, and save. Initials are used when no photo is set.
          </p>
        </div>
      </div>
      <MediaUpload
        label="Upload image"
        intent={profilePhotoUploadIntent}
        value={avatarMediaAssetId}
        onChange={onMediaChange}
        onClear={() => onMediaChange(null)}
      />
    </div>
  );
}
