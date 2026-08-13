import { NextResponse } from "next/server";
import { isMediaEntityType } from "@mpa/shared";
import { assertMediaEntityAccess, requireMediaActor } from "../../../../../lib/media/authz";
import { createUploadIntent } from "../../../../../lib/media/media-service";

export async function POST(request: Request) {
  const authz = await requireMediaActor("write");
  if ("error" in authz) return authz.error;

  const payload = (await request.json().catch(() => null)) as {
    mimeType?: unknown;
    fileSize?: unknown;
    relatedEntityType?: unknown;
    relatedEntityId?: unknown;
    originalFileName?: unknown;
  } | null;

  if (!payload || !isMediaEntityType(payload.relatedEntityType)) {
    return NextResponse.json({ error: "relatedEntityType is required" }, { status: 400 });
  }

  const relatedEntityId =
    typeof payload.relatedEntityId === "string" ? payload.relatedEntityId : null;
  const entityAccess = await assertMediaEntityAccess({
    supabase: authz.supabase,
    organizationId: authz.organizationId,
    relatedEntityType: payload.relatedEntityType,
    relatedEntityId
  });
  if ("error" in entityAccess) return entityAccess.error;

  const result = await createUploadIntent({
    supabase: authz.supabase,
    organizationId: authz.organizationId,
    userId: authz.user.id,
    mimeType: payload.mimeType,
    fileSize: payload.fileSize,
    relatedEntityType: payload.relatedEntityType,
    relatedEntityId,
    originalFileName: payload.originalFileName
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }

  return NextResponse.json(
    {
      mediaId: result.media.id,
      uploadUrl: result.uploadUrl,
      uploadToken: result.uploadToken,
      path: result.path,
      expiresIn: result.expiresIn,
      fileType: result.media.file_type,
      mimeType: result.media.mime_type
    },
    { status: 201 }
  );
}
