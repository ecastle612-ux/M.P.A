import { NextResponse } from "next/server";
import { requireTenantConversationActor } from "../../../../../../../lib/communications/conversation-authz";
import {
  ConversationServiceError,
  sendConversationMessage
} from "../../../../../../../lib/communications/conversation-service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ conversationId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const authz = await requireTenantConversationActor();
  if ("error" in authz) return authz.error;
  const { conversationId } = await context.params;

  try {
    const body = (await request.json()) as {
      body?: string;
      mediaIds?: string[];
      linkedDocumentId?: string;
      idempotencyKey?: string;
    };
    const result = await sendConversationMessage(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      "tenant",
      conversationId,
      {
        body: body.body,
        mediaIds: body.mediaIds,
        linkedDocumentId: body.linkedDocumentId,
        idempotencyKey: body.idempotencyKey,
        tenantAccountId: authz.tenantAccountId
      }
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const status = error instanceof ConversationServiceError ? error.status : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send message" },
      { status }
    );
  }
}
