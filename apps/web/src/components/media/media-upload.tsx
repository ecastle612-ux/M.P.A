"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Button, Spinner } from "@mpa/ui";
import {
  IMAGE_MIME_TYPES,
  MAX_IMAGE_BYTES,
  type MediaKind,
  type MediaStatus
} from "../../lib/media/constants";
import { ImageEditorModal } from "./image-editor-modal";
import { MediaImage } from "./media-image";

export type MediaUploadIntentConfig = {
  kind: MediaKind;
  organizationId?: string | null;
  entityType?: string;
  entityId?: string;
  accept?: string[];
  maxBytes?: number;
  imageEditor?: "none" | "optional" | "required";
  cropAspect?: number;
  capture?: boolean;
  multiple?: boolean;
};

type UploadPhase = "idle" | "editing" | "uploading" | "processing" | "ready" | "failed";

type IntentResponse = {
  asset: { id: string; status: MediaStatus };
  uploadUrl: string;
  uploadToken: string;
  path: string;
};

async function sha256Hex(file: Blob): Promise<string | undefined> {
  try {
    const buffer = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  } catch {
    return undefined;
  }
}

function normalizeMime(file: File): string {
  const type = file.type.toLowerCase();
  if (type) return type;
  const name = file.name.toLowerCase();
  if (name.endsWith(".heic") || name.endsWith(".heif")) return "image/heic";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  return type;
}

export function MediaUpload({
  intent,
  value,
  onChange,
  onClear,
  disabled,
  label = "Upload photo"
}: {
  intent: MediaUploadIntentConfig;
  value: string | null;
  onChange: (mediaAssetId: string | null) => void;
  onClear?: () => void;
  disabled?: boolean;
  label?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [phase, setPhase] = useState<UploadPhase>(() => (value ? "ready" : "idle"));
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [editorSrc, setEditorSrc] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  const accept = useMemo(() => intent.accept ?? [...IMAGE_MIME_TYPES], [intent.accept]);
  const maxBytes = intent.maxBytes ?? MAX_IMAGE_BYTES;
  const editorMode = intent.imageEditor ?? (intent.kind === "profile_photo" ? "required" : "optional");
  const displayPhase: UploadPhase =
    phase === "uploading" || phase === "processing" || phase === "editing" || phase === "failed"
      ? phase
      : value
        ? "ready"
        : "idle";

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (editorSrc) URL.revokeObjectURL(editorSrc);
    };
  }, [editorSrc]);

  const validateFile = useCallback(
    (file: File): string | null => {
      const mime = normalizeMime(file);
      if (!accept.includes(mime)) {
        return "Unsupported file type. Use JPEG, PNG, WEBP, or HEIC.";
      }
      if (file.size > maxBytes) {
        return `File is too large. Maximum size is ${Math.round(maxBytes / (1024 * 1024))} MB.`;
      }
      return null;
    },
    [accept, maxBytes]
  );

  const uploadBlob = useCallback(
    async (blob: Blob, filename: string, mimeType: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setPhase("uploading");
      setProgress(0);
      setError(null);
      setStatusMessage("Preparing upload…");

      const contentHash = await sha256Hex(blob);
      const intentResponse = await fetch("/api/media/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          kind: intent.kind,
          mimeType,
          byteSize: blob.size,
          originalFilename: filename,
          contentHash,
          organizationId: intent.organizationId ?? null,
          entityType: intent.entityType,
          entityId: intent.entityId,
          replaceAssetId: value
        })
      });

      if (!intentResponse.ok) {
        const payload = (await intentResponse.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Could not start upload");
      }

      const intentPayload = (await intentResponse.json()) as IntentResponse;
      setProgress(15);
      setStatusMessage("Uploading…");

      const uploadResponse = await fetch(intentPayload.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": mimeType,
          "x-upsert": "true"
        },
        body: blob,
        signal: controller.signal
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed (HTTP ${uploadResponse.status})`);
      }

      setProgress(70);
      setStatusMessage("Confirming…");

      const confirmResponse = await fetch(`/api/media/${intentPayload.asset.id}?action=confirm`, {
        method: "POST",
        signal: controller.signal
      });
      if (!confirmResponse.ok) {
        const payload = (await confirmResponse.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Could not confirm upload");
      }

      setProgress(100);
      setPhase("processing");
      setStatusMessage("Optimizing image…");
      onChange(intentPayload.asset.id);

      // Poll until ready/failed (async processing)
      for (let attempt = 0; attempt < 40; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (controller.signal.aborted) return;
        const statusResponse = await fetch(`/api/media/${intentPayload.asset.id}?signedUrl=false`);
        if (!statusResponse.ok) continue;
        const statusPayload = (await statusResponse.json()) as {
          asset?: { status?: MediaStatus };
        };
        const status = statusPayload.asset?.status;
        if (status === "ready") {
          setPhase("ready");
          setStatusMessage("Photo ready");
          return;
        }
        if (status === "failed") {
          setPhase("failed");
          throw new Error("Image processing failed. You can retry.");
        }
      }
      // Still processing — treat as usable (asset id persisted)
      setPhase("ready");
      setStatusMessage("Photo uploaded (still optimizing)");
    },
    [intent, onChange, value]
  );

  const beginWithFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setStatusMessage(validationError);
        return;
      }

      const mime = normalizeMime(file);
      const needsEditor =
        editorMode === "required" ||
        (editorMode === "optional" && mime !== "image/heic" && mime !== "image/heif");

      if (needsEditor && mime !== "image/heic" && mime !== "image/heif") {
        if (editorSrc) URL.revokeObjectURL(editorSrc);
        const objectUrl = URL.createObjectURL(file);
        setPendingFile(file);
        setEditorSrc(objectUrl);
        setPhase("editing");
        setError(null);
        return;
      }

      try {
        await uploadBlob(file, file.name, mime);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setPhase("failed");
        setError(err instanceof Error ? err.message : "Upload failed");
        setStatusMessage(err instanceof Error ? err.message : "Upload failed");
      }
    },
    [editorMode, editorSrc, uploadBlob, validateFile]
  );

  async function handleEditorConfirm(blob: Blob) {
    setEditorSrc((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    const filename = pendingFile?.name?.replace(/\.[^.]+$/, "") ?? "photo";
    setPendingFile(null);
    try {
      await uploadBlob(blob, `${filename}.jpg`, "image/jpeg");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setPhase("failed");
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  function handleCancelUpload() {
    abortRef.current?.abort();
    setPhase(value ? "ready" : "idle");
    setProgress(0);
    setStatusMessage("Upload canceled");
  }

  async function handleRemove() {
    if (!value) {
      onChange(null);
      onClear?.();
      setPhase("idle");
      return;
    }
    setError(null);
    const response = await fetch(`/api/media/${value}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Could not remove photo");
      return;
    }
    onChange(null);
    onClear?.();
    setPhase("idle");
    setStatusMessage("Photo removed");
  }

  async function handleRetry() {
    if (pendingFile) {
      await beginWithFile(pendingFile);
      return;
    }
    setError("Choose a photo again to retry.");
    inputRef.current?.click();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-4">
        <MediaImage mediaAssetId={value} variant="thumb" alt="Profile photo preview" className="h-16 w-16" />
        <div className="min-w-0 flex-1 space-y-2">
          <div
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label={label}
            aria-describedby={`${inputId}-status`}
            onKeyDown={(event) => {
              if (disabled) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragActive(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              const file = event.dataTransfer.files?.[0];
              if (file) void beginWithFile(file);
            }}
            onClick={() => {
              if (!disabled) inputRef.current?.click();
            }}
            className={[
              "cursor-pointer rounded-[var(--mpa-radius-lg)] border border-dashed p-4 transition-colors",
              dragActive
                ? "border-[var(--mpa-color-brand-primary)] bg-[var(--mpa-color-brand-primary-subtle)]"
                : "border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)]",
              disabled ? "pointer-events-none opacity-60" : ""
            ].join(" ")}
          >
            <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{label}</p>
            <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
              Drag & drop, tap to browse{intent.capture ? ", or use camera" : ""}. JPEG, PNG, WEBP, or HEIC
              up to {Math.round(maxBytes / (1024 * 1024))} MB.
            </p>
            {(displayPhase === "uploading" || displayPhase === "processing") && (
              <div className="mt-3 space-y-1">
                <div className="flex items-center gap-2 text-xs text-[var(--mpa-color-text-secondary)]">
                  <Spinner className="h-3.5 w-3.5" />
                  <span>{statusMessage}</span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-[var(--mpa-color-bg-muted)]"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                  aria-label="Upload progress"
                >
                  <div
                    className="h-full bg-[var(--mpa-color-brand-primary)] transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            className="sr-only"
            accept={[...accept, ".heic", ".heif"].join(",")}
            capture={intent.capture ? "environment" : undefined}
            disabled={disabled}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void beginWithFile(file);
            }}
          />
          <div className="flex flex-wrap gap-2">
            {value ? (
              <Button type="button" size="sm" variant="secondary" disabled={disabled} onClick={() => inputRef.current?.click()}>
                Replace
              </Button>
            ) : null}
            {value || displayPhase === "ready" ? (
              <Button type="button" size="sm" variant="ghost" disabled={disabled} onClick={() => void handleRemove()}>
                Remove
              </Button>
            ) : null}
            {displayPhase === "uploading" ? (
              <Button type="button" size="sm" variant="ghost" onClick={handleCancelUpload}>
                Cancel
              </Button>
            ) : null}
            {displayPhase === "failed" ? (
              <Button type="button" size="sm" variant="secondary" onClick={() => void handleRetry()}>
                Retry
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      <p id={`${inputId}-status`} className="sr-only" aria-live="polite">
        {statusMessage}
      </p>
      {error ? <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}
      {editorSrc ? (
        <ImageEditorModal
          open
          imageSrc={editorSrc}
          aspect={intent.cropAspect ?? 1}
          onCancel={() => {
            if (editorSrc) URL.revokeObjectURL(editorSrc);
            setEditorSrc(null);
            setPendingFile(null);
            setPhase(value ? "ready" : "idle");
          }}
          onConfirm={(blob) => void handleEditorConfirm(blob)}
        />
      ) : null}
    </div>
  );
}

export const profilePhotoUploadIntent: MediaUploadIntentConfig = {
  kind: "profile_photo",
  entityType: "user",
  imageEditor: "required",
  cropAspect: 1,
  capture: true,
  accept: [...IMAGE_MIME_TYPES],
  maxBytes: MAX_IMAGE_BYTES
};
