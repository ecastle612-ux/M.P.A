import { NextResponse } from "next/server";
import { requireStaffConversationPermission } from "../../../../../lib/communications/conversation-authz";
import {
  ConversationServiceError,
  listConversationInbox,
  listMessageableTenants,
  startConversation
} from "../../../../../lib/communications/conversation-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authz = await requireStaffConversationPermission("platform.communications:read");
  if ("error" in authz) return authz.error;

  const { searchParams } = new URL(request.url);
  if (searchParams.get("targets") === "1") {
    try {
      const targets = await listMessageableTenants(authz.supabase, authz.organizationId);
      return NextResponse.json({ targets });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to load tenants" },
        { status: 400 }
      );
    }
  }

  try {
    const conversations = await listConversationInbox(authz.supabase, authz.organizationId, {
      userId: authz.user.id,
      plane: "staff",
      tenantAccountId: null
    });
    return NextResponse.json({ conversations });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load conversations" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const authz = await requireStaffConversationPermission("platform.communications:write");
  if ("error" in authz) return authz.error;

  try {
    const body = (await request.json()) as {
      tenantAccountId?: string;
      body?: string;
      mediaIds?: string[];
      subject?: string;
      linkedEntityType?: string;
      linkedEntityId?: string;
      linkedDocumentId?: string;
      idempotencyKey?: string;
    };
    if (!body.tenantAccountId) {
      return NextResponse.json({ error: "tenantAccountId is required" }, { status: 400 });
    }
    const result = await startConversation(authz.supabase, authz.organizationId, authz.user.id, {
      tenantAccountId: body.tenantAccountId,
      body: body.body,
      mediaIds: body.mediaIds,
      subject: body.subject,
      linkedEntityType: body.linkedEntityType,
      linkedEntityId: body.linkedEntityId,
      linkedDocumentId: body.linkedDocumentId,
      idempotencyKey: body.idempotencyKey
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const status = error instanceof ConversationServiceError ? error.status : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start conversation" },
      { status }
    );
  }
}
