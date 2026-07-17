import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { PROMPT_LIBRARY } from "../../../../lib/ai/contracts";
import { parseRunPromptInput } from "../../../../lib/ai/contracts";
import { runAiPrompt } from "../../../../lib/ai/server";
import { apiError, parseJsonBody } from "../../../../lib/api/http";

export async function GET() {
  return NextResponse.json({ prompts: PROMPT_LIBRARY }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "ai:use")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;

    const input = parseRunPromptInput(parsedBody.payload);
    if (!input) return apiError(400, "INVALID_PAYLOAD", "Invalid AI prompt payload");

    const conversation = await runAiPrompt(organizationId, user.id, input, supabase);
    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI prompt failed";
    return apiError(400, "AI_PROMPT_FAILED", message);
  }
}
