import { NextResponse } from "next/server";
import { COM_002_FLAGS } from "@mpa/shared";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import {
  getProvisioningJob,
  loadProvisioningJobFromDb
} from "../../../../../lib/saas-provisioning/jobs-store";
import { bindTokenValid } from "../../../../../lib/saas-provisioning/tokens";
import { getSaasPurchaseBySessionId } from "../../../../../lib/saas-stripe/purchase-store";
import { ensurePurchaseFromStripeSession } from "../../../../../lib/saas-stripe/ensure-purchase-from-stripe";
import { startOrAdvanceProvisioningFromPurchase } from "../../../../../lib/saas-provisioning/run-provisioning";
import {
  authorizedProvisionStatusPayload,
  minimalProvisionStatusPayload,
  publicProvisioningSteps
} from "../../../../../lib/saas-commerce/session-privacy";
import {
  clientLookupKey,
  consumeCommerceSessionLookupRateLimit
} from "../../../../../lib/saas-commerce/session-lookup-rate-limit";

export const runtime = "nodejs";

/**
 * STAB-009 — provisioning status for post-Checkout continue page.
 * Session ID alone yields progress-only data (no email/org/user IDs).
 * Valid bind_token or matching authenticated purchase email unlocks masked email.
 */
export async function GET(request: Request) {
  if (!COM_002_FLAGS.sliceD_automaticProvisioning) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id")?.trim() ?? "";
  const bindToken = url.searchParams.get("bind_token")?.trim() ?? "";

  if (!sessionId) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (!consumeCommerceSessionLookupRateLimit(clientLookupKey(request, sessionId))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let job =
    getProvisioningJob(sessionId) ?? (await loadProvisioningJobFromDb(sessionId));
  let purchase =
    getSaasPurchaseBySessionId(sessionId) ?? (await ensurePurchaseFromStripeSession(sessionId));

  if (
    purchase?.status === "checkout_completed" &&
    (!job ||
      ["received", "customer_linked", "org_created", "entitled"].includes(job.checkpoint))
  ) {
    job = (await startOrAdvanceProvisioningFromPurchase(purchase)) ?? job;
    purchase = getSaasPurchaseBySessionId(sessionId) ?? purchase;
  }

  if (!job) {
    if (purchase?.status === "checkout_completed") {
      return NextResponse.json(
        minimalProvisionStatusPayload({
          checkpoint: "received",
          steps: [],
          hasTemporaryIssue: false,
          awaitingProvisioner: true
        })
      );
    }
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Invalid bind credential must never unlock metadata (and must fail closed).
  if (bindToken) {
    if (!job.bindTokenHash || !bindTokenValid(job, bindToken)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  let authorized = false;
  if (bindToken && job.bindTokenHash && bindTokenValid(job, bindToken)) {
    authorized = true;
  } else {
    try {
      const supabase = await createAuthServerClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      const userEmail = user?.email?.toLowerCase() ?? null;
      if (userEmail && userEmail === job.ownerEmail.toLowerCase()) {
        authorized = true;
      }
    } catch {
      // Unauthenticated / auth unavailable → public minimal view.
    }
  }

  if (authorized) {
    return NextResponse.json(
      authorizedProvisionStatusPayload({
        job,
        productSku: job.productSku
      })
    );
  }

  return NextResponse.json(
    minimalProvisionStatusPayload({
      checkpoint: job.checkpoint,
      steps: publicProvisioningSteps(job),
      hasTemporaryIssue: Boolean(job.lastError),
      awaitingProvisioner: false
    })
  );
}
