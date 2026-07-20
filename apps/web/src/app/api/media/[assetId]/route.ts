import { after } from "next/server";
import { NextResponse } from "next/server";
import { apiError } from "../../../../lib/api/http";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { processMediaAsset } from "../../../../lib/media/processor";
import { confirmUpload, deleteMediaAsset, getMediaAsset, getSignedMediaUrl } from "../../../../lib/media/server";
import { isMediaVariant } from "../../../../lib/media/constants";

type RouteContext = { params: Promise<{ assetId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { assetId } = await context.params;
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return apiError(401, "UNAUTHENTICATED", "Unauthenticated");
  }

  const url = new URL(request.url);
  const variantRaw = url.searchParams.get("variant") ?? "small";
  const wantUrl = url.searchParams.get("signedUrl") !== "false";

  try {
    if (wantUrl) {
      if (!isMediaVariant(variantRaw)) {
        return apiError(400, "INVALID_VARIANT", "Invalid media variant");
      }
      const signed = await getSignedMediaUrl(user, assetId, variantRaw);
      return NextResponse.json(signed);
    }
    const asset = await getMediaAsset(user, assetId);
    return NextResponse.json({ asset });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load media";
    if (message === "FORBIDDEN") {
      return apiError(403, "FORBIDDEN", "You do not have permission to view this media.");
    }
    if (message === "Media asset not found") {
      return apiError(404, "NOT_FOUND", message);
    }
    return apiError(400, "MEDIA_READ_FAILED", message);
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { assetId } = await context.params;
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return apiError(401, "UNAUTHENTICATED", "Unauthenticated");
  }

  const url = new URL(request.url);
  const action = url.searchParams.get("action") ?? "confirm";

  try {
    if (action === "confirm") {
      const asset = await confirmUpload(user, assetId);
      after(() => {
        void processMediaAsset(assetId);
      });
      return NextResponse.json({ asset });
    }
    if (action === "reprocess") {
      const asset = await getMediaAsset(user, assetId);
      after(() => {
        void processMediaAsset(assetId);
      });
      return NextResponse.json({ asset, reprocessQueued: true });
    }
    return apiError(400, "INVALID_ACTION", "Unsupported action");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not confirm upload";
    if (message === "FORBIDDEN") {
      return apiError(403, "FORBIDDEN", "You do not have permission to update this media.");
    }
    return apiError(400, "CONFIRM_FAILED", message);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { assetId } = await context.params;
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return apiError(401, "UNAUTHENTICATED", "Unauthenticated");
  }

  try {
    await deleteMediaAsset(user, assetId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete media";
    if (message === "FORBIDDEN") {
      return apiError(403, "FORBIDDEN", "You do not have permission to delete this media.");
    }
    if (message === "Media asset not found") {
      return apiError(404, "NOT_FOUND", message);
    }
    return apiError(400, "DELETE_FAILED", message);
  }
}
