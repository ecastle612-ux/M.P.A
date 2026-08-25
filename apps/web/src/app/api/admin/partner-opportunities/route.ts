import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../lib/commercial/server";
import { handleAdminOpportunityOversight } from "../../../../lib/partners/opportunity-api";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!(await isPlatformOperatorUser(user))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return handleAdminOpportunityOversight();
}
