import { NextResponse } from "next/server";
import { apiError, parseJsonBody } from "../../../../lib/api/http";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { parseCreateMediaIntentInput } from "../../../../lib/media/contracts";
import { createUploadIntent } from "../../../../lib/media/server";

export async function POST(request: Request) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return apiError(401, "UNAUTHENTICATED", "Unauthenticated");
  }

  const body = await parseJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = parseCreateMediaIntentInput(body.payload);
  if ("error" in parsed) {
    return apiError(400, "INVALID_INPUT", parsed.error);
  }

  try {
    const result = await createUploadIntent(user, parsed);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create upload intent";
    if (message === "FORBIDDEN") {
      return apiError(403, "FORBIDDEN", "You do not have permission to upload this media.");
    }
    return apiError(400, "UPLOAD_INTENT_FAILED", message);
  }
}
