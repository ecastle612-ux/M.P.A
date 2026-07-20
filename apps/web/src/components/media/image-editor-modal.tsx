"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button, Modal } from "@mpa/ui";

async function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });
}

async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: Area,
  rotation: number
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create canvas context");
  }

  const rotRad = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rotRad));
  const cos = Math.abs(Math.cos(rotRad));
  const boundingWidth = image.width * cos + image.height * sin;
  const boundingHeight = image.width * sin + image.height * cos;

  canvas.width = boundingWidth;
  canvas.height = boundingHeight;
  ctx.translate(boundingWidth / 2, boundingHeight / 2);
  ctx.rotate(rotRad);
  ctx.drawImage(image, -image.width / 2, -image.height / 2);

  const cropped = document.createElement("canvas");
  cropped.width = pixelCrop.width;
  cropped.height = pixelCrop.height;
  const croppedCtx = cropped.getContext("2d");
  if (!croppedCtx) {
    throw new Error("Could not create cropped canvas context");
  }
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    cropped.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not export cropped image"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.92
    );
  });
}

export function ImageEditorModal({
  open,
  imageSrc,
  aspect = 1,
  onCancel,
  onConfirm
}: {
  open: boolean;
  imageSrc: string;
  aspect?: number;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels, rotation);
      onConfirm(blob);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not crop image");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Adjust photo"
      className="max-w-xl"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleConfirm()} disabled={busy || !croppedAreaPixels}>
            {busy ? "Applying…" : "Use photo"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="relative h-72 overflow-hidden rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-bg-muted)]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-[var(--mpa-color-text-secondary)]">
            Zoom
            <input
              aria-label="Zoom"
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="mt-1 w-full"
            />
          </label>
          <label className="block text-sm text-[var(--mpa-color-text-secondary)]">
            Rotate
            <div className="mt-1 flex items-center gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => setRotation((value) => value - 90)}>
                −90°
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => setRotation((value) => value + 90)}>
                +90°
              </Button>
            </div>
          </label>
        </div>
        {error ? <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}
      </div>
    </Modal>
  );
}
