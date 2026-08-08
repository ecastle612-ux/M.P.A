import { NextResponse } from "next/server";
import { COM_002_FLAGS } from "@mpa/shared";
import { ensurePurchaseFromStripeSession } from "../../../../../lib/saas-stripe/ensure-purchase-from-stripe";
import { loadProvisioningJobFromDb } from "../../../../../lib/saas-provisioning/jobs-store";
import { startOrAdvanceProvisioningFromPurchase } from "../../../../../lib/saas-provisioning/run-provisioning";
import { serverEnv } from "../../../../../lib/env/server-env";

export const runtime = "nodejs";

/**
 * Sets password + confirms email for a provisioned checkout owner.
 * Needed because Slice D creates the auth user before the customer chooses a password.
 */
export async function POST(request: Request) {
  if (!COM_002_FLAGS.sliceD_automaticProvisioning) {
    return NextResponse.json({ error: "slice_disabled" }, { status: 404 });
  }
  if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "service_role_unavailable" }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    sessionId?: string;
    email?: string;
    password?: string;
  };
  const sessionId = body.sessionId?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  if (!sessionId || !email || password.length < 8) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const purchase = await ensurePurchaseFromStripeSession(sessionId);
  if (!purchase || purchase.status !== "checkout_completed") {
    return NextResponse.json({ error: "purchase_not_completed" }, { status: 409 });
  }
  if ((purchase.customerEmail ?? "").toLowerCase() !== email) {
    return NextResponse.json({ error: "email_mismatch" }, { status: 409 });
  }

  let job = await loadProvisioningJobFromDb(sessionId);
  if (!job || job.checkpoint !== "owner_pending") {
    job = (await startOrAdvanceProvisioningFromPurchase(purchase)) ?? job;
  }
  if (!job) {
    return NextResponse.json({ error: "provisioning_not_found" }, { status: 404 });
  }
  if (job.ownerEmail.toLowerCase() !== email) {
    return NextResponse.json({ error: "email_mismatch" }, { status: 409 });
  }

  const { createServiceRoleClient } = await import("../../../../../lib/supabase/service-role");
  const admin = createServiceRoleClient();
  let userId = job.ownerUserId;
  if (!userId || userId.startsWith("pending_user_")) {
    const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = listed.data.users.find((u) => u.email?.toLowerCase() === email);
    userId = existing?.id ?? null;
  }
  if (!userId) {
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { mpa_provisioning: true }
    });
    if (created.error || !created.data.user) {
      return NextResponse.json(
        { error: created.error?.message ?? "auth_user_create_failed" },
        { status: 502 }
      );
    }
    userId = created.data.user.id;
  } else {
    const updated = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true
    });
    if (updated.error) {
      return NextResponse.json({ error: updated.error.message }, { status: 502 });
    }
  }

  return NextResponse.json({
    ok: true,
    userId,
    checkpoint: job.checkpoint,
    continuePath: `/commerce/continue?session_id=${encodeURIComponent(sessionId)}`
  });
}
