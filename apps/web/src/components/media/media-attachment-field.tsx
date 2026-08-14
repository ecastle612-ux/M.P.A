"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@mpa/ui";
import type { MediaEntityType, MediaFileType } from "@mpa/shared";

export type MediaAttachmentItem = {
  id: string;
  fileType: MediaFileType;
  mimeType: string;
  fileSize: number;
  status: string;
  createdAt?: string;
  uploadedByUserId?: string;
  localPreviewUrl?: string | null;
  remoteUrl?: string | null;
  fileName?: string | null;
  progress?: number;
};

type Props = {
  relatedEntityType: MediaEntityType;
  relatedEntityId?: string | null;
  conversationId?: string | null;
  tenantAccountId?: string | null;
  value?: string[];
  onChange?: (mediaIds: string[]) => void;
  readOnly?: boolean;
  label?: string;
};

async function uploadViaSignedUrl(uploadUrl: string, file: File) {
  if (uploadUrl.startsWith("signed://")) {
    return;
  }
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type
    },
    body: file
  });
  if (!response.ok) {
    throw new Error("Upload failed");
  }
}

function FilePickerButton(props: {
  label: string;
  accept: string;
  capture?: boolean;
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: FileList | null) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer">
      <input
        type="file"
        accept={props.accept}
        capture={props.capture ? "environment" : undefined}
        multiple={props.multiple}
        className="sr-only"
        disabled={props.disabled}
        onChange={(event) => {
          props.onFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <span className="inline-flex min-h-10 items-center rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 text-sm text-[var(--mpa-color-text-primary)]">
        {props.label}
      </span>
    </label>
  );
}

export function MediaAttachmentField({
  relatedEntityType,
  relatedEntityId = null,
  conversationId = null,
  tenantAccountId = null,
  value,
  onChange,
  readOnly = false,
  label = "Photos & video"
}: Props) {
  const [items, setItems] = useState<MediaAttachmentItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaIds = useMemo(() => value ?? items.map((item) => item.id), [value, items]);

  useEffect(() => {
    if (!relatedEntityId || !readOnly) return;
    let cancelled = false;
    void (async () => {
      setBusy(true);
      setError(null);
      const response = await fetch(
        `/api/shared/media?relatedEntityType=${encodeURIComponent(relatedEntityType)}&relatedEntityId=${encodeURIComponent(relatedEntityId)}`
      );
      const payload = (await response.json()) as {
        media?: MediaAttachmentItem[];
        error?: string;
      };
      if (cancelled) return;
      if (!response.ok) {
        setBusy(false);
        setError(payload.error ?? "Failed to load media");
        return;
      }
      const rows = payload.media ?? [];
      const withUrls: MediaAttachmentItem[] = [];
      for (const row of rows) {
        const urlResponse = await fetch(`/api/shared/media/${row.id}/url`);
        const urlPayload = (await urlResponse.json()) as { url?: string };
        withUrls.push({
          ...row,
          remoteUrl: urlResponse.ok ? (urlPayload.url ?? null) : null
        });
      }
      if (!cancelled) {
        setItems(withUrls);
        setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [relatedEntityId, relatedEntityType, readOnly]);

  async function addFiles(fileList: FileList | null) {
    if (!fileList || readOnly) return;
    setBusy(true);
    setError(null);
    const nextIds = [...mediaIds];
    for (const file of Array.from(fileList)) {
      const localPreviewUrl = URL.createObjectURL(file);
      try {
        const intentResponse = await fetch("/api/shared/media/upload-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mimeType: file.type,
            fileSize: file.size,
            relatedEntityType,
            relatedEntityId: relatedEntityId ?? undefined,
            originalFileName: file.name,
            ...(conversationId ? { conversationId } : {}),
            ...(tenantAccountId ? { tenantAccountId } : {})
          })
        });
        const intent = (await intentResponse.json()) as {
          mediaId?: string;
          uploadUrl?: string;
          fileType?: MediaFileType;
          mimeType?: string;
          error?: string;
        };
        if (!intentResponse.ok || !intent.mediaId || !intent.uploadUrl) {
          throw new Error(intent.error ?? "Failed to start upload");
        }

        setItems((current) => [
          ...current,
          {
            id: intent.mediaId!,
            fileType: intent.fileType ?? "image",
            mimeType: intent.mimeType ?? file.type,
            fileSize: file.size,
            status: "pending",
            localPreviewUrl,
            fileName: file.name,
            progress: 50
          }
        ]);

        await uploadViaSignedUrl(intent.uploadUrl, file);

        const confirmResponse = await fetch(`/api/shared/media/${intent.mediaId}/confirm`, {
          method: "POST"
        });
        const confirmPayload = (await confirmResponse.json()) as { error?: string };
        if (!confirmResponse.ok) {
          throw new Error(confirmPayload.error ?? "Failed to confirm upload");
        }

        nextIds.push(intent.mediaId);
        setItems((current) =>
          current.map((item) =>
            item.id === intent.mediaId ? { ...item, status: "ready", progress: 100 } : item
          )
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        URL.revokeObjectURL(localPreviewUrl);
      }
    }
    onChange?.(nextIds);
    setBusy(false);
  }

  async function removeItem(mediaId: string) {
    if (readOnly) return;
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/shared/media/${mediaId}`, { method: "DELETE" });
    const payload = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(payload.error ?? "Failed to remove attachment");
      return;
    }
    setItems((current) => {
      const target = current.find((item) => item.id === mediaId);
      if (target?.localPreviewUrl) URL.revokeObjectURL(target.localPreviewUrl);
      return current.filter((item) => item.id !== mediaId);
    });
    onChange?.(mediaIds.filter((id) => id !== mediaId));
  }

  return (
    <div className="space-y-2 text-xs md:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-[var(--mpa-color-text-primary)]">{label}</p>
        {!readOnly ? (
          <div className="flex flex-wrap gap-2">
            <FilePickerButton
              label="Take photo"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              capture
              disabled={busy}
              onFiles={(files) => void addFiles(files)}
            />
            <FilePickerButton
              label="Record video"
              accept="video/mp4,video/quicktime"
              capture
              disabled={busy}
              onFiles={(files) => void addFiles(files)}
            />
            <FilePickerButton
              label="Upload file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime"
              multiple
              disabled={busy}
              onFiles={(files) => void addFiles(files)}
            />
          </div>
        ) : null}
      </div>

      {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}
      {busy ? <p className="text-[var(--mpa-color-text-secondary)]">Working…</p> : null}

      {items.length === 0 ? (
        <p className="text-[var(--mpa-color-text-secondary)]">
          {readOnly ? "No media attached." : "Attach photos or a short video of the issue."}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item) => {
            const src = item.localPreviewUrl ?? item.remoteUrl;
            return (
              <li
                key={item.id}
                className="relative overflow-hidden rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-surface-muted,#F7F7F5)]"
              >
                {item.fileType === "video" ? (
                  src ? (
                    <video
                      src={src}
                      className="aspect-square h-full w-full object-cover"
                      controls={readOnly || Boolean(item.remoteUrl)}
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center text-[11px]">
                      Video
                    </div>
                  )
                ) : src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={item.fileName ?? "Attachment"}
                    className="aspect-square h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-square items-center justify-center text-[11px]">
                    Image
                  </div>
                )}
                <div className="space-y-0.5 p-2">
                  <p className="truncate text-[11px] text-[var(--mpa-color-text-secondary)]">
                    {item.fileName ?? item.fileType}
                  </p>
                  {item.createdAt ? (
                    <p className="text-[10px] text-[var(--mpa-color-text-secondary)]">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  ) : null}
                  {!readOnly ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="mt-1 min-h-8 w-full text-xs"
                      disabled={busy}
                      onClick={() => void removeItem(item.id)}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
