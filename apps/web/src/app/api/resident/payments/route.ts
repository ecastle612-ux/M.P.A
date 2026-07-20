import { NextResponse } from "next/server";
import { createAuthServerClient, createServiceRoleServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../lib/api/http";
import {
  attachResidentPaymentMethod,
  disableAutopay,
  enrollAutopay,
  getResidentPaymentDashboard,
  initiateResidentPayment
} from "../../../../lib/billing/server";
import { AUTOPAY_CONSENT_VERSION } from "../../../../lib/billing/contracts";

async function resolveTenantIdForUser(
  organizationId: string,
  userId: string,
  email: string | undefined
): Promise<string | null> {
  const admin = createServiceRoleServerClient();
  const client = admin ?? (await createAuthServerClient());

  const { data: byUser } = await client
    .from("tenants")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  if (byUser?.id) return byUser.id as string;

  if (!email) return null;
  const { data: byEmail } = await client
    .from("tenants")
    .select("id")
    .eq("organization_id", organizationId)
    .ilike("email", email)
    .is("deleted_at", null)
    .maybeSingle();
  return byEmail?.id ? (byEmail.id as string) : null;
}

export async function GET() {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return NextResponse.json({ dashboard: null }, { headers: { "Cache-Control": "no-store" } });

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "financial:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const tenantId = await resolveTenantIdForUser(organizationId, user.id, user.email);
    if (!tenantId) {
      return NextResponse.json(
        { dashboard: null, message: "No tenant profile linked" },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const admin = createServiceRoleServerClient();
    const dashboard = await getResidentPaymentDashboard(organizationId, tenantId, admin ?? supabase);
    return NextResponse.json(
      { dashboard, tenantId, consentVersion: AUTOPAY_CONSENT_VERSION },
      { headers: { "Cache-Control": "no-store" } }
    );
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
    if (!evaluatePermission(authorization, "financial:create")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const tenantId = await resolveTenantIdForUser(organizationId, user.id, user.email);
    if (!tenantId) return apiError(400, "NO_TENANT", "No tenant profile linked to this account");

    const parsed = await parseJsonBody(request);
    if (!parsed.ok) return parsed.response;
    const payload = parsed.payload as Record<string, unknown>;
    const action = typeof payload["action"] === "string" ? payload["action"] : "";
    const admin = createServiceRoleServerClient();
    const db = admin ?? supabase;

    if (action === "attach_method") {
      const externalPaymentMethodId = String(payload["externalPaymentMethodId"] ?? "");
      if (!externalPaymentMethodId) return apiError(400, "INVALID_PAYLOAD", "externalPaymentMethodId required");
      const method = await attachResidentPaymentMethod(
        organizationId,
        user.id,
        {
          tenantId,
          externalPaymentMethodId,
          setDefault: payload["setDefault"] !== false
        },
        db
      );
      return NextResponse.json({ method });
    }

    if (action === "pay") {
      const chargeIds = Array.isArray(payload["chargeIds"])
        ? payload["chargeIds"].filter((id): id is string => typeof id === "string")
        : [];
      if (!chargeIds.length) return apiError(400, "INVALID_PAYLOAD", "chargeIds required");
      const attempt = await initiateResidentPayment(
        organizationId,
        user.id,
        {
          tenantId,
          leaseId: typeof payload["leaseId"] === "string" ? payload["leaseId"] : null,
          chargeIds,
          ...(typeof payload["amount"] === "number" ? { amount: payload["amount"] } : {}),
          paymentMethodId: typeof payload["paymentMethodId"] === "string" ? payload["paymentMethodId"] : null,
          source: "one_time"
        },
        db
      );
      return NextResponse.json({
        attempt,
        friendlyError: attempt.failureMessage
      });
    }

    if (action === "enroll_autopay") {
      const leaseId = String(payload["leaseId"] ?? "");
      const paymentMethodId = String(payload["paymentMethodId"] ?? "");
      if (!leaseId || !paymentMethodId) return apiError(400, "INVALID_PAYLOAD", "leaseId and paymentMethodId required");
      const enrollment = await enrollAutopay(
        organizationId,
        user.id,
        {
          tenantId,
          leaseId,
          paymentMethodId,
          consentVersion: typeof payload["consentVersion"] === "string" ? payload["consentVersion"] : AUTOPAY_CONSENT_VERSION
        },
        db
      );
      return NextResponse.json({ enrollment });
    }

    if (action === "disable_autopay") {
      const leaseId = String(payload["leaseId"] ?? "");
      if (!leaseId) return apiError(400, "INVALID_PAYLOAD", "leaseId required");
      const enrollment = await disableAutopay(organizationId, user.id, leaseId, db);
      return NextResponse.json({ enrollment });
    }

    return apiError(400, "UNKNOWN_ACTION", `Unknown action: ${action}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Resident billing failed";
    return apiError(400, "BILLING_FAILED", message);
  }
}
