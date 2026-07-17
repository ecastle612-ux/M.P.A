import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { getSetupStatus } from "../../../../lib/setup/server";

export async function GET(request: Request) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const url = new URL(request.url);
  const inviteSkipped = url.searchParams.get("inviteSkipped") === "true";

  const status = await getSetupStatus(user.id, inviteSkipped, {
    email: user.email ?? null,
    appMetadata: user.app_metadata
  });
  return NextResponse.json({ status });
}
