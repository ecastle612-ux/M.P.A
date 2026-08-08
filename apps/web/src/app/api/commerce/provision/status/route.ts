import { NextResponse } from "next/server";
import {
  COM_002_FLAGS,
  canAccessWorkspaceModules,
  isProvisioningComplete,
  operatorStepStatuses
} from "@mpa/shared";
import { getProvisioningJob } from "../../../../../lib/saas-provisioning/jobs-store";
import { getSaasPurchaseBySessionId } from "../../../../../lib/saas-stripe/purchase-store";

export const runtime = "nodejs";

/** Read-only provisioning status (identity-binding: poll does not provision). */
export async function GET(request: Request) {
  if (!COM_002_FLAGS.sliceD_automaticProvisioning) {
    return NextResponse.json({ error: "slice_disabled" }, { status: 404 });
  }
  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "missing_session_id" }, { status: 400 });
  }

  const job = getProvisioningJob(sessionId);
  const purchase = getSaasPurchaseBySessionId(sessionId);
  if (!job) {
    if (purchase?.status === "checkout_completed") {
      return NextResponse.json({
        checkoutSessionId: sessionId,
        checkpoint: "received",
        ready: false,
        canAccessModules: false,
        ownerEmail: purchase.customerEmail ?? "",
        organizationId: null,
        organizationName: null,
        productSku: purchase.productSku,
        planTier: purchase.planTier,
        billingCycle: purchase.billingCycle,
        attemptCount: 0,
        lastError: null,
        steps: [],
        nextPath: null,
        awaitingProvisioner: true
      });
    }
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    checkoutSessionId: job.checkoutSessionId,
    checkpoint: job.checkpoint,
    ready: isProvisioningComplete(job.checkpoint),
    canAccessModules: canAccessWorkspaceModules(job.checkpoint),
    ownerEmail: job.ownerEmail,
    organizationId: job.organizationId,
    organizationName: job.organizationName,
    productSku: job.productSku,
    planTier: job.planTier,
    billingCycle: job.billingCycle,
    attemptCount: job.attemptCount,
    lastError: job.lastError,
    steps: operatorStepStatuses(job),
    nextPath:
      job.checkpoint === "ready" ||
      job.checkpoint === "welcome_sent" ||
      job.checkpoint === "owner_bound"
        ? "/setup"
        : null,
    awaitingProvisioner: false
  });
}
