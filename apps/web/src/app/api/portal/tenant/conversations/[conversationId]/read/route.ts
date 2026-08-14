import { NextResponse } from "next/server";
import { requireTenantConversationActor } from "../../../../../../../lib/communications/conversation-authz";
import {
  ConversationServiceError,
  markConversationRead
} from "../../../../../../../lib/communications/conversation-service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ conversationId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const authz = await requireTenantConversationActor();
  if ("error" in authz) return authz.error;
  const { conversationId } = await context.params;

  try {
    const result = await markConversationRead(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      "tenant",
      conversationId,
      authz.tenantAccountId
    );
    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof ConversationServiceError ? error.status : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to mark read" },
      { status }
    );
  }
}
