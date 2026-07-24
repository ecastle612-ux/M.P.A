import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../lib/api/http";
import {
  applyBillingAdjustment,
  assessLateFeesForOrganization,
  generateRecurringChargesForOrganization,
  getBillingOpsSnapshot,
  getCollectionsQueue,
  getResidentLedger,
  initiateResidentPayment,
  publishInvoiceForCharges,
  reconcileAwaitingPayments,
  refundPaymentAttempt,
  getMoneyInSettlementReconcile,
  applyMoneyInSettlementReconcile,
  upsertBillingSchedule
} from "../../../lib/billing/server";

export async function GET(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return NextResponse.json({ ops: null }, { headers: { "Cache-Control": "no-store" } });

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "financial:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const url = new URL(request.url);
    if (url.searchParams.get("ops") === "1") {
      const ops = await getBillingOpsSnapshot(organizationId, supabase);
      return NextResponse.json({ ops }, { headers: { "Cache-Control": "no-store" } });
    }
    if (url.searchParams.get("collections") === "1") {
      const items = await getCollectionsQueue(organizationId, supabase);
      return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
    }
    const tenantId = url.searchParams.get("tenantId");
    if (tenantId && url.searchParams.get("ledger") === "1") {
      const entries = await getResidentLedger(organizationId, tenantId, supabase);
      return NextResponse.json({ entries }, { headers: { "Cache-Control": "no-store" } });
    }

    const settlementAttemptId = url.searchParams.get("settlementAttemptId");
    if (settlementAttemptId && url.searchParams.get("reconcile") === "1") {
      const report = await getMoneyInSettlementReconcile(
        organizationId,
        settlementAttemptId,
        supabase
      );
      return NextResponse.json({ reconcile: report }, { headers: { "Cache-Control": "no-store" } });
    }

    const ops = await getBillingOpsSnapshot(organizationId, supabase);
    return NextResponse.json({ ops }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    const parsed = await parseJsonBody(request);
    if (!parsed.ok) return parsed.response;
    const payload = parsed.payload as Record<string, unknown>;
    const action = typeof payload["action"] === "string" ? payload["action"] : "";

    if (action === "generate_charges") {
      if (!evaluatePermission(authorization, "financial:create")) return apiError(403, "FORBIDDEN", "Forbidden");
      const created = await generateRecurringChargesForOrganization(organizationId, user.id, supabase);
      return NextResponse.json({ created });
    }

    if (action === "assess_late_fees") {
      if (!evaluatePermission(authorization, "financial:create")) return apiError(403, "FORBIDDEN", "Forbidden");
      const assessed = await assessLateFeesForOrganization(organizationId, user.id, supabase);
      return NextResponse.json({ assessed });
    }

    if (action === "reconcile") {
      if (!evaluatePermission(authorization, "financial:admin") && !evaluatePermission(authorization, "financial:update")) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
      const results = await reconcileAwaitingPayments(organizationId);
      return NextResponse.json({ results });
    }

    if (action === "upsert_schedule") {
      if (!evaluatePermission(authorization, "financial:create")) return apiError(403, "FORBIDDEN", "Forbidden");
      const leaseId = String(payload["leaseId"] ?? "");
      const amount = Number(payload["amount"] ?? 0);
      if (!leaseId) return apiError(400, "INVALID_PAYLOAD", "leaseId required");
      const schedule = await upsertBillingSchedule(organizationId, user.id, { leaseId, amount }, supabase);
      return NextResponse.json({ schedule });
    }

    if (action === "publish_invoice") {
      if (!evaluatePermission(authorization, "financial:create")) return apiError(403, "FORBIDDEN", "Forbidden");
      const leaseId = String(payload["leaseId"] ?? "");
      const chargeIds = Array.isArray(payload["chargeIds"])
        ? payload["chargeIds"].filter((id): id is string => typeof id === "string")
        : [];
      const dueDate = String(payload["dueDate"] ?? new Date().toISOString().slice(0, 10));
      if (!leaseId || !chargeIds.length) return apiError(400, "INVALID_PAYLOAD", "leaseId and chargeIds required");
      const invoice = await publishInvoiceForCharges(
        organizationId,
        user.id,
        { leaseId, chargeIds, dueDate },
        supabase
      );
      return NextResponse.json({ invoice });
    }

    if (action === "adjust") {
      if (!evaluatePermission(authorization, "financial:update")) return apiError(403, "FORBIDDEN", "Forbidden");
      const tenantId = String(payload["tenantId"] ?? "");
      const amount = Number(payload["amount"] ?? 0);
      const reason = String(payload["reason"] ?? "");
      const adjustmentType = String(payload["adjustmentType"] ?? "credit") as "credit" | "adjustment" | "waive";
      if (!tenantId || amount <= 0 || !reason) return apiError(400, "INVALID_PAYLOAD", "Invalid adjustment");
      const adjustment = await applyBillingAdjustment(
        organizationId,
        user.id,
        {
          tenantId,
          leaseId: typeof payload["leaseId"] === "string" ? payload["leaseId"] : null,
          rentChargeId: typeof payload["rentChargeId"] === "string" ? payload["rentChargeId"] : null,
          adjustmentType,
          amount,
          reason
        },
        supabase
      );
      return NextResponse.json({ adjustment });
    }

    if (action === "refund") {
      if (!evaluatePermission(authorization, "financial:admin") && !evaluatePermission(authorization, "financial:update")) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
      const attemptId = String(payload["attemptId"] ?? "");
      if (!attemptId) return apiError(400, "INVALID_PAYLOAD", "attemptId required");
      const refund = await refundPaymentAttempt(
        organizationId,
        user.id,
        attemptId,
        typeof payload["amount"] === "number" ? payload["amount"] : undefined,
        typeof payload["reason"] === "string" ? payload["reason"] : undefined,
        supabase
      );
      return NextResponse.json({ refund });
    }

    if (action === "settlement_reconcile_apply") {
      if (!evaluatePermission(authorization, "financial:admin")) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
      const attemptId = String(payload["attemptId"] ?? "");
      const summary = String(payload["summary"] ?? "");
      const ledgerNote = String(payload["ledgerNote"] ?? "");
      const amountCents = typeof payload["amountCents"] === "number" ? payload["amountCents"] : 0;
      if (!attemptId || !summary || !ledgerNote || !amountCents) {
        return apiError(400, "INVALID_PAYLOAD", "attemptId, summary, ledgerNote, amountCents required");
      }
      const result = await applyMoneyInSettlementReconcile(organizationId, user.id, {
        paymentAttemptId: attemptId,
        summary,
        ledgerNote,
        amountCents
      });
      return NextResponse.json(result);
    }

    if (action === "pay") {
      if (!evaluatePermission(authorization, "financial:create")) return apiError(403, "FORBIDDEN", "Forbidden");
      const tenantId = String(payload["tenantId"] ?? "");
      const chargeIds = Array.isArray(payload["chargeIds"])
        ? payload["chargeIds"].filter((id): id is string => typeof id === "string")
        : [];
      if (!tenantId || !chargeIds.length) return apiError(400, "INVALID_PAYLOAD", "tenantId and chargeIds required");
      const attempt = await initiateResidentPayment(
        organizationId,
        user.id,
        {
          tenantId,
          leaseId: typeof payload["leaseId"] === "string" ? payload["leaseId"] : null,
          chargeIds,
          ...(typeof payload["amount"] === "number" ? { amount: payload["amount"] } : {}),
          paymentMethodId: typeof payload["paymentMethodId"] === "string" ? payload["paymentMethodId"] : null,
          source: "pm_recorded"
        },
        supabase
      );
      return NextResponse.json({ attempt });
    }

    return apiError(400, "UNKNOWN_ACTION", `Unknown action: ${action}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Billing action failed";
    return apiError(400, "BILLING_FAILED", message);
  }
}
