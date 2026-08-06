import { NextResponse } from "next/server";
import {
  assessLateFeesInputSchema,
  createPaymentArrangementInputSchema,
  sendReminderInputSchema,
  upsertLateFeePolicyInputSchema
} from "@mpa/shared";
import { requireFinancePermission } from "../../../../lib/finance/authz";
import {
  assessLateFees,
  createPaymentArrangement,
  getCollectionsSnapshot,
  sendDelinquencyReminder,
  syncDelinquencyCases,
  upsertLateFeePolicy
} from "../../../../lib/finance/collections-service";

export async function GET() {
  const authz = await requireFinancePermission("pm.finance:read");
  if ("error" in authz) {
    return authz.error;
  }
  try {
    const snapshot = await getCollectionsSnapshot(authz.supabase, authz.organizationId);
    const { data: policies } = await authz.supabase
      .from("financial_late_fee_policies")
      .select("*")
      .eq("organization_id", authz.organizationId)
      .order("created_at", { ascending: false });
    return NextResponse.json({ snapshot, policies: policies ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load collections" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const kind = payload?.kind as string | undefined;

  try {
    if (kind === "policy") {
      const authz = await requireFinancePermission("pm.finance:late_fee.manage");
      if ("error" in authz) {
        return authz.error;
      }
      const parsed = upsertLateFeePolicyInputSchema.safeParse(payload);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
      }
      const policy = await upsertLateFeePolicy(
        authz.supabase,
        authz.organizationId,
        authz.user.id,
        parsed.data
      );
      return NextResponse.json({ policy }, { status: 201 });
    }

    if (kind === "assess_late_fees") {
      const authz = await requireFinancePermission("pm.finance:late_fee.manage");
      if ("error" in authz) {
        return authz.error;
      }
      const parsed = assessLateFeesInputSchema.safeParse(payload ?? {});
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
      }
      const result = await assessLateFees(authz.supabase, authz.organizationId, authz.user.id, {
        ...(parsed.data.propertyId ? { propertyId: parsed.data.propertyId } : {}),
        ...(parsed.data.leaseId ? { leaseId: parsed.data.leaseId } : {}),
        ...(parsed.data.asOfDate ? { asOfDate: parsed.data.asOfDate } : {})
      });
      return NextResponse.json(result, { status: 201 });
    }

    if (kind === "sync_delinquency") {
      const authz = await requireFinancePermission("pm.finance:read");
      if ("error" in authz) {
        return authz.error;
      }
      const cases = await syncDelinquencyCases(authz.supabase, authz.organizationId);
      return NextResponse.json({ cases });
    }

    if (kind === "reminder") {
      const authz = await requireFinancePermission("pm.finance:charge.write");
      if ("error" in authz) {
        return authz.error;
      }
      const parsed = sendReminderInputSchema.safeParse(payload);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
      }
      const delinquencyCase = await sendDelinquencyReminder(
        authz.supabase,
        authz.organizationId,
        authz.user.id,
        parsed.data.caseId
      );
      return NextResponse.json({ case: delinquencyCase });
    }

    if (kind === "arrangement") {
      const authz = await requireFinancePermission("pm.finance:charge.write");
      if ("error" in authz) {
        return authz.error;
      }
      const parsed = createPaymentArrangementInputSchema.safeParse(payload);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
      }
      const arrangement = await createPaymentArrangement(
        authz.supabase,
        authz.organizationId,
        authz.user.id,
        parsed.data
      );
      return NextResponse.json({ arrangement }, { status: 201 });
    }

    return NextResponse.json({ error: "Unknown collections kind" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Collections action failed" },
      { status: 400 }
    );
  }
}
