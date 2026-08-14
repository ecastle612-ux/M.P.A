import { NextResponse } from "next/server";
import { requireTenantConversationActor } from "../../../../../../lib/communications/conversation-authz";
import {
  ConversationServiceError,
  getConversationThread
} from "../../../../../../lib/communications/conversation-service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ conversationId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const authz = await requireTenantConversationActor();
  if ("error" in authz) return authz.error;
  const { conversationId } = await context.params;

  try {
    const thread = await getConversationThread(
      authz.supabase,
      authz.organizationId,
      { userId: authz.user.id, plane: "tenant", tenantAccountId: authz.tenantAccountId },
      conversationId
    );
    return NextResponse.json(thread);
  } catch (error) {
    const status = error instanceof ConversationServiceError ? error.status : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load thread" },
      { status }
    );
  }
}
