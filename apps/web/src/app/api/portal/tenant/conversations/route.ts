import { NextResponse } from "next/server";
import { requireTenantConversationActor } from "../../../../../lib/communications/conversation-authz";
import { listConversationInbox } from "../../../../../lib/communications/conversation-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const authz = await requireTenantConversationActor();
  if ("error" in authz) return authz.error;

  try {
    const conversations = await listConversationInbox(authz.supabase, authz.organizationId, {
      userId: authz.user.id,
      plane: "tenant",
      tenantAccountId: authz.tenantAccountId
    });
    return NextResponse.json({ conversations });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load inbox" },
      { status: 400 }
    );
  }
}
