import { NextResponse } from "next/server";
import { COM_002_FLAGS } from "@mpa/shared";
import { isPlatformOperatorUser } from "../../../../../../lib/commercial/server";
import { createAuthServerClient } from "../../../../../../lib/auth/server";
import { enforceGraceExpirations } from "../../../../../../lib/saas-lifecycle/apply-lifecycle";

export const runtime = "nodejs";

export async function POST() {
  if (!COM_002_FLAGS.sliceE_subscriptionLifecycle) {
    return NextResponse.json({ error: "slice_disabled" }, { status: 404 });
  }
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user || !(await isPlatformOperatorUser(user))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const expired = await enforceGraceExpirations();
  return NextResponse.json({ ok: true, expired });
}
