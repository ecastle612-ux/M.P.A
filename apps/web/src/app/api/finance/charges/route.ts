import { NextResponse } from "next/server";
import {
  adjustChargeInputSchema,
  createOneTimeChargeInputSchema,
  createRecurringScheduleInputSchema,
  updateChargeScheduleInputSchema
} from "@mpa/shared";
import { requireFinancePermission } from "../../../../lib/finance/authz";
import {
  adjustChargeAmount,
  createOneTimeCharge,
  createRecurringScheduleAndCharge,
  postDueSchedules,
  updateChargeSchedule,
  voidCharge
} from "../../../../lib/finance/billing-service";

export async function GET(request: Request) {
  const authz = await requireFinancePermission("pm.finance:read");
  if ("error" in authz) {
    return authz.error;
  }

  const url = new URL(request.url);
  const leaseId = url.searchParams.get("leaseId");
  let query = authz.supabase
    .from("financial_charges")
    .select("*")
    .eq("organization_id", authz.organizationId)
    .order("due_at", { ascending: false });

  if (leaseId) {
    query = query.eq("lease_id", leaseId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ charges: data ?? [] });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const kind = payload?.kind as string | undefined;

  try {
    if (kind === "recurring") {
      const authz = await requireFinancePermission("pm.finance:charge.write");
      if ("error" in authz) {
        return authz.error;
      }
      const parsed = createRecurringScheduleInputSchema.safeParse(payload);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
      }
      const result = await createRecurringScheduleAndCharge(
        authz.supabase,
        authz.organizationId,
        authz.user.id,
        parsed.data
      );
      return NextResponse.json(result, { status: 201 });
    }

    if (kind === "one_time") {
      const parsed = createOneTimeChargeInputSchema.safeParse(payload);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
      }
      const capability =
        parsed.data.chargeType === "late_fee" ? "pm.finance:late_fee.manage" : "pm.finance:charge.write";
      const authz = await requireFinancePermission(capability);
      if ("error" in authz) {
        return authz.error;
      }
      const charge = await createOneTimeCharge(
        authz.supabase,
        authz.organizationId,
        authz.user.id,
        parsed.data
      );
      return NextResponse.json({ charge }, { status: 201 });
    }

    if (kind === "schedule") {
      const authz = await requireFinancePermission("pm.finance:charge.write");
      if ("error" in authz) {
        return authz.error;
      }
      const parsed = updateChargeScheduleInputSchema.safeParse(payload);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
      }
      const schedule = await updateChargeSchedule(
        authz.supabase,
        authz.organizationId,
        authz.user.id,
        parsed.data
      );
      return NextResponse.json({ schedule });
    }

    if (kind === "run_schedules") {
      const authz = await requireFinancePermission("pm.finance:charge.write");
      if ("error" in authz) {
        return authz.error;
      }
      const result = await postDueSchedules(authz.supabase, authz.organizationId, authz.user.id, {
        asOfDate: payload?.asOfDate,
        leaseId: payload?.leaseId
      });
      return NextResponse.json(result);
    }

    if (kind === "adjust") {
      const authz = await requireFinancePermission("pm.finance:charge.write");
      if ("error" in authz) {
        return authz.error;
      }
      const parsed = adjustChargeInputSchema.safeParse(payload);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
      }
      if (parsed.data.action === "void") {
        const charge = await voidCharge(
          authz.supabase,
          authz.organizationId,
          authz.user.id,
          parsed.data.chargeId,
          parsed.data.reason
        );
        return NextResponse.json({ charge });
      }
      if (parsed.data.action === "adjust_amount" && parsed.data.amount) {
        const charge = await adjustChargeAmount(
          authz.supabase,
          authz.organizationId,
          authz.user.id,
          parsed.data.chargeId,
          parsed.data.amount,
          parsed.data.reason
        );
        return NextResponse.json({ charge });
      }
    }

    const authz = await requireFinancePermission("pm.finance:charge.write");
    if ("error" in authz) {
      return authz.error;
    }
    return NextResponse.json({ error: "Unknown charge kind" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Charge operation failed" },
      { status: 400 }
    );
  }
}
