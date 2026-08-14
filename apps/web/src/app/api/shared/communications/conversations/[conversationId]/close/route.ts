import { NextResponse } from "next/server";
import { requireStaffConversationPermission } from "../../../../../../../lib/communications/conversation-authz";
import {
  ConversationServiceError,
  closeConversation
} from "../../../../../../../lib/communications/conversation-service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ conversationId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const authz = await requireStaffConversationPermission("platform.communications:write");
  if ("error" in authz) return authz.error;
  const { conversationId } = await context.params;

  try {
    const result = await closeConversation(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      conversationId
    );
    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof ConversationServiceError ? error.status : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to close conversation" },
      { status }
    );
  }
}
