import { NextResponse } from "next/server";
import { COM_002_FLAGS } from "@mpa/shared";
import { isPlatformOperatorUser } from "../../../../../../lib/commercial/server";
import { createAuthServerClient } from "../../../../../../lib/auth/server";
import { retryProvisioningJob } from "../../../../../../lib/saas-provisioning/run-provisioning";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!COM_002_FLAGS.sliceD_automaticProvisioning) {
    return NextResponse.json({ error: "slice_disabled" }, { status: 404 });
  }
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user || !(await isPlatformOperatorUser(user))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = (await request.json().catch(() => ({}))) as { sessionId?: string };
  if (!body.sessionId) {
    return NextResponse.json({ error: "missing_session_id" }, { status: 400 });
  }
  const job = await retryProvisioningJob(body.sessionId);
  if (!job) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({
    ok: true,
    checkpoint: job.checkpoint,
    attemptCount: job.attemptCount,
    lastError: job.lastError,
    organizationId: job.organizationId
  });
}
