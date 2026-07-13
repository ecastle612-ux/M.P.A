import { NextResponse } from "next/server";
import { extractRolesFromMetadata } from "@mpa/shared";
import { createAuthServerClient } from "../../../../lib/auth/server";

export async function GET() {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { authenticated: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        roles: extractRolesFromMetadata(user.app_metadata)
      }
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
