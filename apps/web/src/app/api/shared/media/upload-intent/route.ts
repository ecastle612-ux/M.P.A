import { NextResponse } from "next/server";
import { isMediaEntityType } from "@mpa/shared";
import { requireConversationMediaActor } from "../../../../../lib/communications/conversation-authz";
import {
  assertCanAccessConversation,
  assertPropertyInOrg,
  loadConversation,
  loadMessageableResident
} from "../../../../../lib/communications/conversation-service";
import { assertMediaEntityAccess, requireMediaActor } from "../../../../../lib/media/authz";
import { createUploadIntent } from "../../../../../lib/media/media-service";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as {
    mimeType?: unknown;
    fileSize?: unknown;
    relatedEntityType?: unknown;
    relatedEntityId?: unknown;
    originalFileName?: unknown;
    conversationId?: unknown;
    tenantAccountId?: unknown;
  } | null;

  if (!payload || !isMediaEntityType(payload.relatedEntityType)) {
    return NextResponse.json({ error: "relatedEntityType is required" }, { status: 400 });
  }

  const conversationMedia = payload.relatedEntityType === "conversation_message";
  const mediaAuthz = conversationMedia ? null : await requireMediaActor("write");
  const conversationAuthz = conversationMedia ? await requireConversationMediaActor("write") : null;
  const authz = conversationAuthz ?? mediaAuthz;
  if (!authz || "error" in authz) return authz?.error ?? NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const relatedEntityId =
    typeof payload.relatedEntityId === "string" ? payload.relatedEntityId : null;
  if (conversationMedia) {
    const conversationId =
      typeof payload.conversationId === "string"
        ? payload.conversationId
        : relatedEntityId;
    const tenantAccountId =
      typeof payload.tenantAccountId === "string" ? payload.tenantAccountId : null;
    try {
      if (conversationId) {
        const conversation = await loadConversation(authz.supabase, authz.organizationId, conversationId);
        await assertCanAccessConversation(conversation, {
          organizationId: authz.organizationId,
          plane: conversationAuthz && !("error" in conversationAuthz) ? conversationAuthz.plane : "staff",
          tenantAccountId:
            conversationAuthz && !("error" in conversationAuthz)
              ? conversationAuthz.tenantAccountId
              : null
        });
      } else if (conversationAuthz && !("error" in conversationAuthz) && conversationAuthz.plane === "staff" && tenantAccountId) {
        const resident = await loadMessageableResident(
          authz.supabase,
          authz.organizationId,
          tenantAccountId
        );
        await assertPropertyInOrg(authz.supabase, authz.organizationId, resident.property_id);
      } else {
        return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const entityAccess = await assertMediaEntityAccess({
    supabase: authz.supabase,
    organizationId: authz.organizationId,
    relatedEntityType: payload.relatedEntityType,
    relatedEntityId: conversationMedia ? null : relatedEntityId,
    ...(conversationMedia && "plane" in authz
      ? { conversationActor: { plane: authz.plane, tenantAccountId: authz.tenantAccountId } }
      : {})
  });
  if ("error" in entityAccess) return entityAccess.error;

  const result = await createUploadIntent({
    supabase: authz.supabase,
    organizationId: authz.organizationId,
    userId: authz.user.id,
    mimeType: payload.mimeType,
    fileSize: payload.fileSize,
    relatedEntityType: payload.relatedEntityType,
    relatedEntityId: conversationMedia ? null : relatedEntityId,
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
