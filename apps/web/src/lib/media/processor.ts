import { createRequire } from "node:module";
import sharp from "sharp";
import {
  isImageMimeType,
  VARIANT_MAX_EDGE,
  type MediaVariant
} from "./constants";
import { buildVariantStoragePath } from "./paths";
import { requireServiceClient, writeAudit } from "./server";

const require = createRequire(import.meta.url);
const heicConvert = require("heic-convert") as (options: {
  buffer: Buffer;
  format: "JPEG" | "PNG";
  quality: number;
}) => Promise<ArrayBuffer>;

async function normalizeToProcessableBuffer(input: Buffer, mimeType: string): Promise<{ buffer: Buffer; mimeType: string }> {
  if (mimeType === "image/heic" || mimeType === "image/heif") {
    const output = await heicConvert({
      buffer: input,
      format: "JPEG",
      quality: 0.92
    });
    return { buffer: Buffer.from(output), mimeType: "image/jpeg" };
  }
  return { buffer: input, mimeType };
}

export async function processMediaAsset(assetId: string): Promise<void> {
  const supabase = requireServiceClient();
  const { data: asset, error } = await supabase.from("media_assets").select("*").eq("id", assetId).maybeSingle();
  if (error || !asset || asset.deleted_at) {
    return;
  }

  if (!isImageMimeType(asset.mime_type) && asset.kind === "document") {
    await supabase.from("media_assets").update({ status: "ready" }).eq("id", assetId);
    await writeAudit({
      mediaAssetId: assetId,
      actorUserId: null,
      organizationId: asset.organization_id,
      eventType: "processing_completed",
      details: { reason: "document_no_variants" }
    });
    return;
  }

  try {
    const { data: file, error: downloadError } = await supabase.storage
      .from(asset.storage_bucket)
      .download(asset.storage_path);
    if (downloadError || !file) {
      throw new Error(downloadError?.message ?? "Could not download original");
    }

    const originalBytes = Buffer.from(await file.arrayBuffer());
    const normalized = await normalizeToProcessableBuffer(originalBytes, asset.mime_type);
    const image = sharp(normalized.buffer).rotate();
    const metadata = await image.metadata();

    await supabase
      .from("media_assets")
      .update({
        width: metadata.width ?? null,
        height: metadata.height ?? null,
        metadata: {
          ...(typeof asset.metadata === "object" && asset.metadata && !Array.isArray(asset.metadata)
            ? asset.metadata
            : {}),
          orientationNormalized: true,
          gpsStripped: true,
          sourceMimeType: asset.mime_type,
          processedMimeType: normalized.mimeType
        }
      })
      .eq("id", assetId);

    await supabase.from("media_asset_variants").upsert(
      {
        media_asset_id: assetId,
        variant: "original",
        storage_path: asset.storage_path,
        mime_type: asset.mime_type,
        byte_size: asset.byte_size,
        width: metadata.width ?? null,
        height: metadata.height ?? null
      },
      { onConflict: "media_asset_id,variant" }
    );

    const variants: Array<Exclude<MediaVariant, "original">> = ["thumb", "small", "medium", "large"];
    for (const variant of variants) {
      const maxEdge = VARIANT_MAX_EDGE[variant];
      const quality = variant === "thumb" ? 70 : variant === "small" ? 75 : 80;
      const output = await sharp(normalized.buffer)
        .rotate()
        .resize({
          width: maxEdge,
          height: maxEdge,
          fit: "inside",
          withoutEnlargement: true
        })
        .webp({ quality })
        .toBuffer({ resolveWithObject: true });

      const storagePath = buildVariantStoragePath({
        originalPath: asset.storage_path,
        variant,
        ext: "webp"
      });

      const { error: uploadError } = await supabase.storage
        .from(asset.storage_bucket)
        .upload(storagePath, output.data, {
          contentType: "image/webp",
          upsert: true
        });
      if (uploadError) {
        throw new Error(uploadError.message);
      }

      await supabase.from("media_asset_variants").upsert(
        {
          media_asset_id: assetId,
          variant,
          storage_path: storagePath,
          mime_type: "image/webp",
          byte_size: output.info.size,
          width: output.info.width,
          height: output.info.height
        },
        { onConflict: "media_asset_id,variant" }
      );
    }

    await supabase.from("media_assets").update({ status: "ready" }).eq("id", assetId);
    await writeAudit({
      mediaAssetId: assetId,
      actorUserId: null,
      organizationId: asset.organization_id,
      eventType: "processing_completed"
    });
  } catch (error) {
    await supabase.from("media_assets").update({ status: "failed" }).eq("id", assetId);
    await writeAudit({
      mediaAssetId: assetId,
      actorUserId: null,
      organizationId: asset.organization_id,
      eventType: "processing_failed",
      details: { message: error instanceof Error ? error.message : "Processing failed" }
    });
  }
}
