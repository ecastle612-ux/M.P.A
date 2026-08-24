"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@mpa/ui";
import type { MediaEntityType, MediaFileType } from "@mpa/shared";

const RECEIPT_ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf,.jpg,.jpeg,.png,.webp,.heic,.pdf";

export type ReceiptAttachmentItem = {
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
  relatedEntityType: Extract<MediaEntityType, "vendor_invoice" | "maintenance">;
  relatedEntityId?: string | null;
  value?: string[];
  onChange?: (mediaIds: string[]) => void;
  readOnly?: boolean;
};

function inferReceiptMime(file: File): string | undefined {
  if (file.type) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".heic") || name.endsWith(".heif")) return "image/heic";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  return undefined;
}

async function uploadViaSignedUrl(uploadUrl: string, file: File) {
  if (uploadUrl.startsWith("signed://")) {
    return;
  }
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream"
    },
    body: file
  });
  if (!response.ok) {
    throw new Error("Upload failed. Try again.");
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

function fileTypeLabel(item: ReceiptAttachmentItem) {
  if (item.mimeType === "application/pdf" || item.fileType === "document") return "PDF";
  if (item.mimeType === "image/png") return "PNG";
  if (item.mimeType === "image/webp") return "WebP";
  if (item.mimeType.includes("heic") || item.mimeType.includes("heif")) return "HEIC";
  if (item.fileType === "image") return "JPG";
  return "File";
}

export function ReceiptAttachmentField({
  relatedEntityType,
  relatedEntityId = null,
  value,
  onChange,
  readOnly = false
}: Props) {
  const [items, setItems] = useState<ReceiptAttachmentItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const mediaIds = useMemo(() => value ?? items.map((item) => item.id), [value, items]);
  const preview = items.find((item) => item.id === previewId) ?? null;

  useEffect(() => {
    if (!relatedEntityId) return;
    let cancelled = false;
    void (async () => {
      setBusy(true);
      setError(null);
      const response = await fetch(
        `/api/shared/media?relatedEntityType=${encodeURIComponent(relatedEntityType)}&relatedEntityId=${encodeURIComponent(relatedEntityId)}&attachmentCategory=receipt`
      );
      const payload = (await response.json()) as {
        media?: ReceiptAttachmentItem[];
        error?: string;
      };
      if (cancelled) return;
      if (!response.ok) {
        setBusy(false);
        setError(payload.error ?? "Failed to load receipts");
        return;
      }
      const rows = payload.media ?? [];
      const withUrls: ReceiptAttachmentItem[] = [];
      for (const row of rows) {
        if (row.fileType === "image") {
          const urlResponse = await fetch(`/api/shared/media/${row.id}/url`);
          const urlPayload = (await urlResponse.json()) as { url?: string };
          withUrls.push({
            ...row,
            remoteUrl: urlResponse.ok ? (urlPayload.url ?? null) : null
          });
        } else {
          withUrls.push(row);
        }
      }
      if (!cancelled) {
        setItems(withUrls);
        setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [relatedEntityId, relatedEntityType]);

  async function addFiles(fileList: FileList | null) {
    if (!fileList || readOnly) return;
    setBusy(true);
    setError(null);
    const nextIds = [...mediaIds];
    for (const file of Array.from(fileList)) {
      const localPreviewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
      try {
        const intentResponse = await fetch("/api/shared/media/upload-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mimeType: inferReceiptMime(file),
            fileSize: file.size,
            relatedEntityType,
            relatedEntityId: relatedEntityId ?? undefined,
            originalFileName: file.name,
            attachmentCategory: "receipt"
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
            progress: 40
          }
        ]);

        await uploadViaSignedUrl(intent.uploadUrl, file);

        setItems((current) =>
          current.map((item) => (item.id === intent.mediaId ? { ...item, progress: 80 } : item))
        );

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
        if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
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
      setError(payload.error ?? "Failed to remove receipt");
      return;
    }
    setItems((current) => {
      const target = current.find((item) => item.id === mediaId);
      if (target?.localPreviewUrl) URL.revokeObjectURL(target.localPreviewUrl);
      return current.filter((item) => item.id !== mediaId);
    });
    if (previewId === mediaId) setPreviewId(null);
    onChange?.(mediaIds.filter((id) => id !== mediaId));
  }

  async function openReceipt(item: ReceiptAttachmentItem) {
    const response = await fetch(`/api/shared/media/${item.id}/url`);
    const payload = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !payload.url) {
      setError(payload.error ?? "Could not open receipt");
      return;
    }
    window.open(payload.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-2 text-xs md:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-[var(--mpa-color-text-primary)]">Receipts & Attachments</p>
        {!readOnly ? (
          <div className="flex flex-wrap gap-2">
            <FilePickerButton
              label="Take Photo"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              capture
              disabled={busy}
              onFiles={(files) => void addFiles(files)}
            />
            <FilePickerButton
              label="Add Receipt"
              accept={RECEIPT_ACCEPT}
              multiple
              disabled={busy}
              onFiles={(files) => void addFiles(files)}
            />
            <FilePickerButton
              label="Choose File"
              accept={RECEIPT_ACCEPT}
              multiple
              disabled={busy}
              onFiles={(files) => void addFiles(files)}
            />
          </div>
        ) : null}
      </div>
      <p className="text-[var(--mpa-color-text-secondary)]">
        Optional. Photos or PDF receipts. You can add more than one.
      </p>

      {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}
      {busy ? <p className="text-[var(--mpa-color-text-secondary)]">Uploading…</p> : null}

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-[var(--mpa-color-border-default)] px-3 py-4">
          <p className="text-sm text-[var(--mpa-color-text-primary)]">No receipts attached</p>
          {!readOnly ? (
            <p className="mt-1 text-[var(--mpa-color-text-secondary)]">
              Use Add Receipt to take a photo or choose a file.
            </p>
          ) : null}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const src = item.localPreviewUrl ?? item.remoteUrl;
            const isImage = item.fileType === "image";
            return (
              <li
                key={item.id}
                className="flex flex-wrap gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-3"
              >
                {isImage && src ? (
                  <button
                    type="button"
                    className="h-20 w-20 overflow-hidden rounded-md border border-[var(--mpa-color-border-subtle)]"
                    onClick={() => setPreviewId(item.id)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={item.fileName ?? "Receipt"} className="h-full w-full object-contain" />
                  </button>
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-surface-muted,#F7F7F5)] text-[11px] font-medium">
                    {fileTypeLabel(item)}
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-sm font-medium text-[var(--mpa-color-text-primary)]">
                    {item.fileName ?? "Receipt"}
                  </p>
                  <p className="text-[var(--mpa-color-text-secondary)]">
                    {fileTypeLabel(item)}
                    {item.createdAt ? ` · ${new Date(item.createdAt).toLocaleString()}` : ""}
                    {item.uploadedByUserId ? " · Uploaded by team member" : ""}
                  </p>
                  {item.status === "pending" ? (
                    <p className="text-[var(--mpa-color-text-secondary)]">
                      Upload progress {item.progress ?? 0}%
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {isImage && src ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="min-h-8 text-xs"
                        onClick={() => setPreviewId(item.id)}
                      >
                        Preview
                      </Button>
                    ) : null}
                    {item.status === "ready" || item.remoteUrl ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="min-h-8 text-xs"
                        onClick={() => void openReceipt(item)}
                      >
                        Open Receipt
                      </Button>
                    ) : null}
                    {!readOnly ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="min-h-8 text-xs"
                        disabled={busy}
                        onClick={() => void removeItem(item.id)}
                      >
                        Remove Receipt
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {preview && (preview.localPreviewUrl || preview.remoteUrl) ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-label="Receipt preview"
          onClick={() => setPreviewId(null)}
        >
          <div
            className="max-h-[90vh] max-w-[90vw] overflow-auto rounded-md bg-white p-3"
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview.localPreviewUrl ?? preview.remoteUrl ?? ""}
              alt={preview.fileName ?? "Receipt preview"}
              className="max-h-[80vh] w-auto max-w-full object-contain"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => setPreviewId(null)}>
                Close
              </Button>
              {preview.status === "ready" ? (
                <Button type="button" onClick={() => void openReceipt(preview)}>
                  Open Receipt
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
