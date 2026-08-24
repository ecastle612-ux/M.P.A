import { NextResponse } from "next/server";
import { resolveMediaActorForMediaId } from "../../../../../../lib/media/authz";
import { createSignedDownloadUrl } from "../../../../../../lib/media/media-service";

type RouteContext = { params: Promise<{ mediaId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { mediaId } = await context.params;
  const authz = await resolveMediaActorForMediaId("read", mediaId);
  if ("error" in authz) return authz.error;

  const media = authz.media;
  if (media["status"] !== "ready") {
    return NextResponse.json({ error: "Media is not ready" }, { status: 409 });
  }

  const storageReference = media["storage_reference"];
  if (typeof storageReference !== "string") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const signed = await createSignedDownloadUrl({
    organizationId: authz.organizationId,
    storageReference
  });
  if ("error" in signed) {
    return NextResponse.json({ error: signed.error }, { status: signed.status ?? 400 });
  }

  return NextResponse.json({
    url: signed.url,
    expiresIn: signed.expiresIn,
    fileType: media["file_type"],
    mimeType: media["mime_type"],
    fileName:
      media["metadata"] &&
      typeof media["metadata"] === "object" &&
      media["metadata"] !== null &&
      "original_filename" in media["metadata"] &&
      typeof (media["metadata"] as { original_filename?: unknown }).original_filename === "string"
        ? (media["metadata"] as { original_filename: string }).original_filename
        : null
  });
}
