import type { SupabaseClient } from "@supabase/supabase-js";
import {
  chargeIsImmutableAmount,
  defaultAutopayEligible,
  defaultFeeCategoryForChargeType,
  deriveResidentFinancialStatus,
  formatMoney,
  nextChargeStatus,
  nextSchedulePeriod,
  periodBoundsForDate,
  planPaymentAllocations,
  refundReopenPaid,
  remainingBalance,
  roundMoney,
  type AllocatableCharge,
  type CreateLeaseResidentInput,
  type CreateOneTimeChargeInput,
  type CreatePropertyInput,
  type CreateRecurringScheduleInput,
  type ChargeType,
  type RecordManualPaymentInput,
  type UpdateChargeScheduleInput
} from "@mpa/shared";
import { emitFinanceEvent, writeFinanceAudit, writeFinanceNotification } from "./events-audit";
export { getRentReadiness } from "./rent-readiness";

// Finance tables are ahead of generated Database typings; use a permissive client.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

async function loadLeaseContext(supabase: Db, organizationId: string, leaseId: string) {
  const { data: lease, error } = await supabase
    .from("lease_agreements")
    .select("id, organization_id, property_id, unit_id, status, rent_amount, currency")
    .eq("organization_id", organizationId)
    .eq("id", leaseId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  if (!lease) {
    throw new Error("Lease not found");
  }

  const { data: residents, error: residentsError } = await supabase
    .from("lease_residents")
    .select("id, user_id, display_name, email, is_primary, financial_status")
    .eq("lease_id", leaseId)
    .order("is_primary", { ascending: false });
  if (residentsError) {
    throw new Error(residentsError.message);
  }

  return { lease, residents: residents ?? [] };
}

async function resolveResidentNotifyUserId(
  supabase: Db,
  organizationId: string,
  resident: { user_id?: string | null; email?: string | null } | null
): Promise<string | null> {
  if (resident?.user_id) {
    return resident.user_id;
  }
  const email = resident?.email?.trim().toLowerCase();
  if (!email) {
    return null;
  }
  const { data } = await supabase
    .from("pm_residents")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("email", email)
    .not("user_id", "is", null)
    .limit(1)
    .maybeSingle();
  return (data?.user_id as string | null | undefined) ?? null;
}

async function insertLedgerEntry(
  supabase: Db,
  row: {
    organization_id: string;
    property_id: string | null;
    lease_id: string | null;
    resident_id?: string | null;
    entry_type: string;
    direction: "debit" | "credit";
    amount: number;
    currency: string;
    source_type: string;
    source_id: string;
    description: string;
    idempotency_key: string;
    created_by?: string | null;
    stripe_object_id?: string | null;
  }
) {
  const { error } = await supabase.from("financial_ledger_entries").insert(row);
  if (error && !error.message.toLowerCase().includes("duplicate")) {
    throw new Error(error.message);
  }
}

/**
 * @deprecated Prefer `/api/pm/properties` (J1). Kept for FO compatibility —
 * delegates to the single portfolio create path.
 */
export async function createBillingProperty(
  supabase: Db,
  organizationId: string,
  actorId: string,
  input: CreatePropertyInput
) {
  const { createPortfolioProperty } = await import("../property/property-catalog");
  const result = await createPortfolioProperty(supabase, organizationId, actorId, {
    name: input.name,
    unitCount: 1
  });
  const unit = result.units[0] ?? null;
  if (!unit) {
    throw new Error("Property created without a unit");
  }
  return { property: result.property, unit };
}

export async function createLeaseWithResident(
  supabase: Db,
  organizationId: string,
  _actorId: string,
  input: CreateLeaseResidentInput
) {
  const { data: lease, error } = await supabase
    .from("lease_agreements")
    .insert({
      organization_id: organizationId,
      property_id: input.propertyId,
      unit_id: input.unitId ?? null,
      status: "active",
      start_date: input.startDate ?? new Date().toISOString().slice(0, 10),
      rent_amount: input.rentAmount,
      currency: input.currency
    })
    .select("*")
    .single();
  if (error) {
    throw new Error(error.message);
  }

  if (input.unitId) {
    await supabase.from("property_units").update({ status: "occupied" }).eq("id", input.unitId);
  }

  const { data: resident, error: residentError } = await supabase
    .from("lease_residents")
    .insert({
      organization_id: organizationId,
      lease_id: lease.id,
      user_id: input.userId ?? null,
      display_name: input.displayName,
      email: input.email ?? null,
      is_primary: true,
      financial_status: "current"
    })
    .select("*")
    .single();
  if (residentError) {
    throw new Error(residentError.message);
  }

  return { lease, resident };
}

export async function createRecurringScheduleAndCharge(
  supabase: Db,
  organizationId: string,
  actorId: string | null,
  input: CreateRecurringScheduleInput
) {
  const { lease, residents } = await loadLeaseContext(supabase, organizationId, input.leaseId);
  const bounds = periodBoundsForDate(new Date(), input.dayOfMonth);
  const primary = residents.find((row) => row.is_primary) ?? residents[0] ?? null;
  const notifyUserId = await resolveResidentNotifyUserId(supabase, organizationId, primary);

  const { data: schedule, error } = await supabase
    .from("financial_charge_schedules")
    .insert({
      organization_id: organizationId,
      property_id: lease.property_id,
      lease_id: lease.id,
      charge_type: input.chargeType,
      label: input.label,
      amount: input.amount,
      currency: input.currency,
      day_of_month: input.dayOfMonth,
      next_run_on: bounds.nextRunOn,
      fee_category: input.feeCategory ?? defaultFeeCategoryForChargeType(input.chargeType),
      autopay_eligible: defaultAutopayEligible({
        chargeType: input.chargeType,
        ...(input.feeCategory ? { feeCategory: input.feeCategory } : {}),
        ...(input.autopayEligible != null ? { autopayEligible: input.autopayEligible } : {})
      }),
      created_by: actorId
    })
    .select("*")
    .single();
  if (error) {
    throw new Error(error.message);
  }

  let charge = null;
  if (input.generateCurrentPeriod) {
    charge = await createChargeRecord(supabase, {
      organizationId,
      actorId,
      propertyId: lease.property_id,
      unitId: lease.unit_id,
      leaseId: lease.id,
      residentId: primary?.id ?? null,
      scheduleId: schedule.id,
      chargeType: input.chargeType,
      label: input.label,
      amount: input.amount,
      currency: input.currency,
      dueAt: bounds.dueAt,
      periodStart: bounds.periodStart,
      periodEnd: bounds.periodEnd,
      feeCategory: input.feeCategory ?? defaultFeeCategoryForChargeType(input.chargeType),
      autopayEligible: defaultAutopayEligible({
        chargeType: input.chargeType,
        ...(input.feeCategory ? { feeCategory: input.feeCategory } : {}),
        ...(input.autopayEligible != null ? { autopayEligible: input.autopayEligible } : {})
      }),
      notifyUserId
    });
  }

  return { schedule, charge };
}

export async function createOneTimeCharge(
  supabase: Db,
  organizationId: string,
  actorId: string,
  input: CreateOneTimeChargeInput
) {
  const { lease, residents } = await loadLeaseContext(supabase, organizationId, input.leaseId);
  const primary = residents.find((row) => row.is_primary) ?? residents[0] ?? null;
  const amount = input.chargeType === "credit" ? input.amount : input.amount;

  const notifyUserId = await resolveResidentNotifyUserId(supabase, organizationId, primary);
  return createChargeRecord(supabase, {
    organizationId,
    actorId,
    propertyId: lease.property_id,
    unitId: lease.unit_id,
    leaseId: lease.id,
    residentId: primary?.id ?? null,
    scheduleId: null,
    chargeType: input.chargeType,
    label: input.label,
    amount,
    currency: input.currency,
    dueAt: input.dueAt,
    feeCategory: input.feeCategory ?? defaultFeeCategoryForChargeType(input.chargeType),
    autopayEligible: false,
    ...(input.memo ? { memo: input.memo } : {}),
    notifyUserId
  });
}

async function createChargeRecord(
  supabase: Db,
  args: {
    organizationId: string;
    actorId: string | null;
    propertyId: string;
    unitId: string | null;
    leaseId: string;
    residentId: string | null;
    scheduleId: string | null;
    chargeType: string;
    label: string;
    amount: number;
    currency: string;
    dueAt: string;
    periodStart?: string;
    periodEnd?: string;
    memo?: string;
    notifyUserId?: string | null;
    feeCategory?: string;
    autopayEligible?: boolean;
  }
) {
  const { data: charge, error } = await supabase
    .from("financial_charges")
    .insert({
      organization_id: args.organizationId,
      property_id: args.propertyId,
      unit_id: args.unitId,
      lease_id: args.leaseId,
      resident_id: args.residentId,
      schedule_id: args.scheduleId,
      charge_type: args.chargeType,
      label: args.label,
      memo: args.memo ?? null,
      amount: args.amount,
      currency: args.currency,
      status: "open",
      due_at: args.dueAt,
      period_start: args.periodStart ?? null,
      period_end: args.periodEnd ?? null,
      fee_category: args.feeCategory ?? defaultFeeCategoryForChargeType(args.chargeType as ChargeType),
      autopay_eligible: args.autopayEligible === true && (args.chargeType === "rent" || args.chargeType === "recurring_fee"),
      created_by: args.actorId
    })
    .select("*")
    .single();
  if (error) {
    throw new Error(error.message);
  }

  await insertLedgerEntry(supabase, {
    organization_id: args.organizationId,
    property_id: args.propertyId,
    lease_id: args.leaseId,
    resident_id: args.residentId,
    entry_type: args.chargeType === "credit" ? "credit" : "charge",
    direction: args.chargeType === "credit" ? "credit" : "debit",
    amount: args.amount,
    currency: args.currency,
    source_type: "financial_charges",
    source_id: charge.id,
    description: args.label,
    idempotency_key: `charge:${charge.id}`,
    created_by: args.actorId
  });

  await emitFinanceEvent({
    supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    eventType: "finance.charge.created",
    aggregateType: "financial_charge",
    aggregateId: charge.id,
    payload: { leaseId: args.leaseId, amount: args.amount, label: args.label }
  });

  await writeFinanceAudit({
    supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    action: "finance.charge.created",
    entityType: "financial_charge",
    entityId: charge.id,
    payload: { amount: args.amount, label: args.label }
  });

  await writeFinanceNotification({
    supabase,
    organizationId: args.organizationId,
    userId: args.notifyUserId,
    leaseId: args.leaseId,
    notificationKey: "finance.charge.created",
    title: "New charge on your account",
    body: `${args.label} for ${formatMoney(args.amount, args.currency)} is due ${args.dueAt}.`,
    href: "/portal/tenant/billing"
  });

  await refreshResidentFinancialStatus(supabase, args.organizationId, args.leaseId);
  return charge;
}

export async function voidCharge(
  supabase: Db,
  organizationId: string,
  actorId: string,
  chargeId: string,
  reason: string
) {
  const { data: charge, error } = await supabase
    .from("financial_charges")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", chargeId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  if (!charge) {
    throw new Error("Charge not found");
  }
  if (charge.status === "void") {
    return charge;
  }

  const { data: updated, error: updateError } = await supabase
    .from("financial_charges")
    .update({
      status: "void",
      voided_at: new Date().toISOString(),
      void_reason: reason,
      updated_at: new Date().toISOString()
    })
    .eq("id", chargeId)
    .select("*")
    .single();
  if (updateError) {
    throw new Error(updateError.message);
  }

  await insertLedgerEntry(supabase, {
    organization_id: organizationId,
    property_id: charge.property_id,
    lease_id: charge.lease_id,
    resident_id: charge.resident_id,
    entry_type: "void",
    direction: "credit",
    amount: remainingBalance({ amount: Number(charge.amount), amount_paid: Number(charge.amount_paid) }),
    currency: charge.currency,
    source_type: "financial_charges",
    source_id: charge.id,
    description: `Void: ${charge.label} — ${reason}`,
    idempotency_key: `void:${charge.id}`,
    created_by: actorId
  });

  await emitFinanceEvent({
    supabase,
    organizationId,
    actorId,
    eventType: "finance.charge.voided",
    aggregateType: "financial_charge",
    aggregateId: charge.id,
    payload: { reason }
  });
  await writeFinanceAudit({
    supabase,
    organizationId,
    actorId,
    action: "finance.charge.voided",
    entityType: "financial_charge",
    entityId: charge.id,
    payload: { reason }
  });
  await refreshResidentFinancialStatus(supabase, organizationId, charge.lease_id);
  return updated;
}

export async function adjustChargeAmount(
  supabase: Db,
  organizationId: string,
  actorId: string,
  chargeId: string,
  amount: number,
  reason: string
) {
  const { data: charge, error } = await supabase
    .from("financial_charges")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", chargeId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  if (!charge) {
    throw new Error("Charge not found");
  }
  if (chargeIsImmutableAmount(charge.status)) {
    throw new Error("charge_amount_immutable");
  }

  const { data: updated, error: updateError } = await supabase
    .from("financial_charges")
    .update({
      amount,
      memo: reason,
      updated_at: new Date().toISOString()
    })
    .eq("id", chargeId)
    .eq("organization_id", organizationId)
    .select("*")
    .single();
  if (updateError) {
    throw new Error(updateError.message);
  }

  await writeFinanceAudit({
    supabase,
    organizationId,
    actorId,
    action: "finance.charge.created",
    entityType: "financial_charge",
    entityId: chargeId,
    payload: { action: "adjust_amount", from: charge.amount, to: amount, reason }
  });
  return updated;
}

export async function updateChargeSchedule(
  supabase: Db,
  organizationId: string,
  actorId: string,
  input: UpdateChargeScheduleInput
) {
  const { data: schedule, error } = await supabase
    .from("financial_charge_schedules")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", input.scheduleId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  if (!schedule) {
    throw new Error("Schedule not found");
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.amount != null) {
    patch["amount"] = input.amount;
  }
  if (input.dayOfMonth != null) {
    patch["day_of_month"] = input.dayOfMonth;
  }
  if (input.autopayEligible != null) {
    patch["autopay_eligible"] =
      schedule.charge_type === "rent" || schedule.charge_type === "recurring_fee"
        ? input.autopayEligible
        : false;
  }
  if (input.active != null) {
    patch["active"] = input.active;
  }
  if (input.label) {
    patch["label"] = input.label;
  }

  const { data: updated, error: updateError } = await supabase
    .from("financial_charge_schedules")
    .update(patch)
    .eq("id", input.scheduleId)
    .eq("organization_id", organizationId)
    .select("*")
    .single();
  if (updateError) {
    throw new Error(updateError.message);
  }

  await emitFinanceEvent({
    supabase,
    organizationId,
    actorId,
    eventType: "finance.schedule.updated",
    aggregateType: "financial_charge_schedule",
    aggregateId: input.scheduleId,
    payload: { patch, historicalChargesUnchanged: true }
  });
  await writeFinanceAudit({
    supabase,
    organizationId,
    actorId,
    action: "finance.schedule.updated",
    entityType: "financial_charge_schedule",
    entityId: input.scheduleId,
    payload: { patch, historicalChargesUnchanged: true }
  });
  return updated;
}

export async function postDueSchedules(
  supabase: Db,
  organizationId: string,
  actorId: string | null,
  input?: { asOfDate?: string; leaseId?: string }
) {
  const asOf = input?.asOfDate ?? new Date().toISOString().slice(0, 10);
  let query = supabase
    .from("financial_charge_schedules")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("active", true)
    .lte("next_run_on", asOf);
  if (input?.leaseId) {
    query = query.eq("lease_id", input.leaseId);
  }
  const { data: schedules, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const posted: string[] = [];
  const skipped: string[] = [];
  for (const schedule of schedules ?? []) {
    const period = nextSchedulePeriod(schedule.next_run_on as string, Number(schedule.day_of_month));
    const { data: existing } = await supabase
      .from("financial_charges")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("schedule_id", schedule.id)
      .eq("period_start", period.periodStart)
      .maybeSingle();

    if (!existing) {
      const { lease, residents } = await loadLeaseContext(supabase, organizationId, schedule.lease_id);
      const primary = residents.find((row) => row.is_primary) ?? residents[0] ?? null;
      const notifyUserId = await resolveResidentNotifyUserId(supabase, organizationId, primary);
      await createChargeRecord(supabase, {
        organizationId,
        actorId,
        propertyId: lease.property_id,
        unitId: lease.unit_id,
        leaseId: lease.id,
        residentId: primary?.id ?? null,
        scheduleId: schedule.id,
        chargeType: schedule.charge_type,
        label: schedule.label,
        amount: Number(schedule.amount),
        currency: schedule.currency,
        dueAt: period.dueAt,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        feeCategory: schedule.fee_category,
        autopayEligible: schedule.autopay_eligible === true,
        notifyUserId
      });
      posted.push(schedule.id);
    } else {
      skipped.push(schedule.id);
    }

    await supabase
      .from("financial_charge_schedules")
      .update({ next_run_on: period.followingRunOn, updated_at: new Date().toISOString() })
      .eq("id", schedule.id)
      .eq("organization_id", organizationId);
  }

  await writeFinanceAudit({
    supabase,
    organizationId,
    actorId,
    action: "finance.schedule.updated",
    entityType: "financial_charge_schedule",
    entityId: organizationId,
    payload: { posted, skipped, asOf }
  });
  return { posted: posted.length, skipped: skipped.length, asOf };
}

export async function applySucceededPayment(
  supabase: Db,
  args: {
    organizationId: string;
    actorId: string | null;
    leaseId: string;
    amount: number;
    currency: string;
    method: string;
    paymentId?: string;
    stripeCheckoutSessionId?: string | null;
    stripePaymentIntentId?: string | null;
    paidAt?: string | null;
    correlationId?: string | null;
    chargeIds?: string[] | null;
  }
) {
  const { lease, residents } = await loadLeaseContext(supabase, args.organizationId, args.leaseId);
  const primary = residents.find((row) => row.is_primary) ?? residents[0] ?? null;

  let chargeQuery = supabase
    .from("financial_charges")
    .select("id, due_at, charge_type, amount, amount_paid, status")
    .eq("organization_id", args.organizationId)
    .eq("lease_id", args.leaseId)
    .in("status", ["open", "partially_paid"]);
  if (args.chargeIds?.length) {
    chargeQuery = chargeQuery.in("id", args.chargeIds);
  }
  const { data: openCharges, error: chargesError } = await chargeQuery;
  if (chargesError) {
    throw new Error(chargesError.message);
  }

  const allocatable = (openCharges ?? []).map(
    (charge): AllocatableCharge => ({
      id: charge.id,
      due_at: charge.due_at,
      charge_type: charge.charge_type,
      amount: Number(charge.amount),
      amount_paid: Number(charge.amount_paid),
      status: charge.status
    })
  );
  const { allocations, unapplied } = planPaymentAllocations(allocatable, args.amount);

  let paymentId = args.paymentId;
  if (!paymentId) {
    const { data: payment, error } = await supabase
      .from("financial_payments")
      .insert({
        organization_id: args.organizationId,
        property_id: lease.property_id,
        lease_id: args.leaseId,
        resident_id: primary?.id ?? null,
        amount: args.amount,
        currency: args.currency,
        status: "succeeded",
        method: args.method,
        stripe_checkout_session_id: args.stripeCheckoutSessionId ?? null,
        stripe_payment_intent_id: args.stripePaymentIntentId ?? null,
        recorded_by: args.actorId,
        paid_at: args.paidAt ?? new Date().toISOString()
      })
      .select("*")
      .single();
    if (error) {
      throw new Error(error.message);
    }
    paymentId = payment.id;
  } else {
    const { error } = await supabase
      .from("financial_payments")
      .update({
        status: "succeeded",
        stripe_payment_intent_id: args.stripePaymentIntentId ?? null,
        paid_at: args.paidAt ?? new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", paymentId);
    if (error) {
      throw new Error(error.message);
    }
  }

  for (const allocation of allocations) {
    await supabase.from("financial_payment_allocations").upsert(
      {
        organization_id: args.organizationId,
        payment_id: paymentId,
        charge_id: allocation.chargeId,
        amount: allocation.amount
      },
      { onConflict: "payment_id,charge_id" }
    );

    const charge = allocatable.find((item) => item.id === allocation.chargeId);
    if (!charge) {
      continue;
    }
    const newPaid = roundMoney(charge.amount_paid + allocation.amount);
    await supabase
      .from("financial_charges")
      .update({
        amount_paid: newPaid,
        status: nextChargeStatus(charge.amount, newPaid),
        updated_at: new Date().toISOString()
      })
      .eq("id", allocation.chargeId);
  }

  await insertLedgerEntry(supabase, {
    organization_id: args.organizationId,
    property_id: lease.property_id,
    lease_id: args.leaseId,
    resident_id: primary?.id ?? null,
    entry_type: "payment",
    direction: "credit",
    amount: args.amount,
    currency: args.currency,
    source_type: "financial_payments",
    source_id: paymentId!,
    description: `Payment ${args.method}`,
    idempotency_key: `payment:${paymentId}`,
    created_by: args.actorId,
    stripe_object_id: args.stripePaymentIntentId ?? args.stripeCheckoutSessionId ?? null
  });

  if (unapplied > 0) {
    await insertLedgerEntry(supabase, {
      organization_id: args.organizationId,
      property_id: lease.property_id,
      lease_id: args.leaseId,
      resident_id: primary?.id ?? null,
      entry_type: "credit",
      direction: "credit",
      amount: unapplied,
      currency: args.currency,
      source_type: "financial_payments",
      source_id: paymentId!,
      description: "Unapplied payment credit",
      idempotency_key: `payment-credit:${paymentId}`,
      created_by: args.actorId
    });
  }

  const receiptNumber = `RCPT-${new Date().getUTCFullYear()}-${String(paymentId).slice(0, 8).toUpperCase()}`;
  const { data: receipt, error: receiptError } = await supabase
    .from("financial_receipts")
    .upsert(
      {
        organization_id: args.organizationId,
        payment_id: paymentId,
        lease_id: args.leaseId,
        resident_id: primary?.id ?? null,
        receipt_number: receiptNumber,
        amount: args.amount,
        currency: args.currency,
        payload: {
          allocations,
          unapplied,
          method: args.method
        }
      },
      { onConflict: "payment_id" }
    )
    .select("*")
    .single();
  if (receiptError) {
    throw new Error(receiptError.message);
  }

  const notifyUserId = await resolveResidentNotifyUserId(supabase, args.organizationId, primary);
  const paymentPayload = {
    amount: args.amount,
    leaseId: args.leaseId,
    method: args.method,
    receiptNumber,
    propertyId: lease.property_id
  };

  await emitFinanceEvent({
    supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    eventType: "finance.payment.succeeded",
    aggregateType: "financial_payment",
    aggregateId: paymentId!,
    payload: paymentPayload
  });
  // Property + lease timelines also record collection for Command Centers.
  await emitFinanceEvent({
    supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    eventType: "finance.payment.succeeded",
    aggregateType: "property_properties",
    aggregateId: lease.property_id,
    payload: paymentPayload
  });
  await emitFinanceEvent({
    supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    eventType: "finance.payment.succeeded",
    aggregateType: "lease_agreements",
    aggregateId: args.leaseId,
    payload: paymentPayload
  });
  await writeFinanceAudit({
    supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    action: "finance.payment.succeeded",
    entityType: "financial_payment",
    entityId: paymentId ?? null,
    payload: paymentPayload,
    correlationId: args.correlationId ?? null
  });
  await writeFinanceNotification({
    supabase,
    organizationId: args.organizationId,
    userId: notifyUserId,
    leaseId: args.leaseId,
    notificationKey: "finance.payment.succeeded",
    title: "Payment received",
    body: `We received ${formatMoney(args.amount, args.currency)}. Receipt ${receiptNumber}.`,
    href: "/portal/tenant/billing"
  });

  await refreshResidentFinancialStatus(supabase, args.organizationId, args.leaseId);
  return { paymentId, receipt, allocations, unapplied };
}

/** Staff-triggered rent payment reminder for open charges on a lease (J5). */
export async function sendPaymentReminderForLease(
  supabase: Db,
  organizationId: string,
  actorId: string,
  leaseId: string
) {
  const { lease, residents } = await loadLeaseContext(supabase, organizationId, leaseId);
  const primary = residents.find((row) => row.is_primary) ?? residents[0] ?? null;
  if (!primary) {
    throw new Error("No resident on this lease.");
  }

  const { data: openCharges, error } = await supabase
    .from("financial_charges")
    .select("id, label, amount, amount_paid, due_at, status")
    .eq("organization_id", organizationId)
    .eq("lease_id", leaseId)
    .in("status", ["open", "partially_paid"])
    .order("due_at", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  if (!openCharges || openCharges.length === 0) {
    throw new Error("No open charges to remind about.");
  }

  const openBalance = openCharges.reduce(
    (sum, charge) => sum + (Number(charge.amount) - Number(charge.amount_paid ?? 0)),
    0
  );
  const nextDue = openCharges[0]?.due_at as string;
  const notifyUserId = await resolveResidentNotifyUserId(supabase, organizationId, primary);

  await writeFinanceNotification({
    supabase,
    organizationId,
    userId: notifyUserId,
    leaseId,
    notificationKey: "finance.charge.due_soon",
    title: "Rent payment reminder",
    body: `Friendly reminder: ${formatMoney(openBalance, lease.currency)} is due${
      nextDue ? ` by ${nextDue}` : ""
    }. Pay online in Billing.`,
    href: "/portal/tenant/billing"
  });

  await emitFinanceEvent({
    supabase,
    organizationId,
    actorId,
    eventType: "finance.payment.reminder_sent",
    aggregateType: "lease_agreements",
    aggregateId: leaseId,
    payload: {
      openBalance,
      nextDue,
      chargeCount: openCharges.length,
      residentId: primary.id,
      notifiedUserId: notifyUserId,
      delivery: notifyUserId ? "in_app" : "staff_visible_only"
    }
  });
  await writeFinanceAudit({
    supabase,
    organizationId,
    actorId,
    action: "finance.payment.reminder_sent",
    entityType: "lease_agreements",
    entityId: leaseId,
    payload: {
      openBalance,
      nextDue,
      notified: Boolean(notifyUserId)
    }
  });

  return {
    leaseId,
    openBalance,
    nextDue,
    chargeCount: openCharges.length,
    notified: Boolean(notifyUserId),
    notice: notifyUserId
      ? "Payment reminder delivered to the resident portal inbox."
      : "Reminder recorded. Resident portal inbox needs a linked user — share Billing link or link resident account."
  };
}

export async function recordManualPayment(
  supabase: Db,
  organizationId: string,
  actorId: string,
  input: RecordManualPaymentInput
) {
  return applySucceededPayment(supabase, {
    organizationId,
    actorId,
    leaseId: input.leaseId,
    amount: input.amount,
    currency: input.currency,
    method: input.method,
    paidAt: input.paidAt ?? null
  });
}

export async function markPaymentFailed(
  supabase: Db,
  paymentId: string,
  organizationId: string,
  reason: string,
  correlationId?: string
) {
  const { data: payment, error } = await supabase
    .from("financial_payments")
    .update({
      status: "failed",
      failure_reason: reason,
      updated_at: new Date().toISOString()
    })
    .eq("id", paymentId)
    .eq("organization_id", organizationId)
    .select("*")
    .single();
  if (error) {
    throw new Error(error.message);
  }

  await emitFinanceEvent({
    supabase,
    organizationId,
    actorId: null,
    eventType: "finance.payment.failed",
    aggregateType: "financial_payment",
    aggregateId: paymentId,
    payload: { reason }
  });
  await writeFinanceAudit({
    supabase,
    organizationId,
    actorId: null,
    action: "finance.payment.failed",
    entityType: "financial_payment",
    entityId: paymentId,
    payload: { reason },
    correlationId: correlationId ?? null
  });

  if (payment.resident_id) {
    const { data: resident } = await supabase
      .from("lease_residents")
      .select("user_id")
      .eq("id", payment.resident_id)
      .maybeSingle();
    await writeFinanceNotification({
      supabase,
      organizationId,
      userId: resident?.user_id,
      leaseId: payment.lease_id,
      notificationKey: "finance.payment.failed",
      title: "Payment failed",
      body: "Your online payment did not go through. Please try again or contact your property manager.",
      href: "/portal/tenant/billing"
    });
  }

  return payment;
}

export async function applyPaymentRefund(
  supabase: Db,
  args: {
    organizationId: string;
    paymentId: string;
    refundAmount: number;
    stripeRefundId?: string | null;
    correlationId?: string | null;
  }
) {
  const { data: payment, error } = await supabase
    .from("financial_payments")
    .select("*")
    .eq("id", args.paymentId)
    .eq("organization_id", args.organizationId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  if (!payment) {
    throw new Error("Payment not found");
  }
  if (payment.status !== "succeeded" && payment.status !== "partially_refunded") {
    throw new Error("payment_not_refundable");
  }

  const refundAmount = roundMoney(args.refundAmount);
  const alreadyRefunded = Number(payment.metadata?.refunded_amount ?? 0);
  const nextRefunded = roundMoney(alreadyRefunded + refundAmount);
  if (nextRefunded - Number(payment.amount) > 0.009) {
    throw new Error("refund_exceeds_payment");
  }

  const { data: allocations, error: allocError } = await supabase
    .from("financial_payment_allocations")
    .select("charge_id, amount")
    .eq("payment_id", args.paymentId)
    .eq("organization_id", args.organizationId);
  if (allocError) {
    throw new Error(allocError.message);
  }

  let remainingRefund = refundAmount;
  for (const allocation of allocations ?? []) {
    if (remainingRefund <= 0) {
      break;
    }
    const apply = roundMoney(Math.min(Number(allocation.amount), remainingRefund));
    const { data: charge } = await supabase
      .from("financial_charges")
      .select("id, amount, amount_paid")
      .eq("id", allocation.charge_id)
      .maybeSingle();
    if (!charge) {
      continue;
    }
    const next = refundReopenPaid(
      { amount: Number(charge.amount), amount_paid: Number(charge.amount_paid) },
      apply
    );
    await supabase
      .from("financial_charges")
      .update({
        amount_paid: next.amount_paid,
        status: next.status,
        updated_at: new Date().toISOString()
      })
      .eq("id", charge.id);
    remainingRefund = roundMoney(remainingRefund - apply);
  }

  await insertLedgerEntry(supabase, {
    organization_id: args.organizationId,
    property_id: payment.property_id,
    lease_id: payment.lease_id,
    resident_id: payment.resident_id,
    entry_type: "refund",
    direction: "debit",
    amount: refundAmount,
    currency: payment.currency,
    source_type: "financial_payments",
    source_id: payment.id,
    description: "Stripe refund",
    idempotency_key: `refund:${args.stripeRefundId ?? args.paymentId}:${nextRefunded}`,
    created_by: null,
    stripe_object_id: args.stripeRefundId ?? null
  });

  const fullyRefunded = nextRefunded >= Number(payment.amount) - 0.009;
  await supabase
    .from("financial_payments")
    .update({
      status: fullyRefunded ? "refunded" : "partially_refunded",
      stripe_refund_id: args.stripeRefundId ?? payment.stripe_refund_id,
      metadata: { ...(payment.metadata ?? {}), refunded_amount: nextRefunded },
      updated_at: new Date().toISOString()
    })
    .eq("id", payment.id);

  await emitFinanceEvent({
    supabase,
    organizationId: args.organizationId,
    actorId: null,
    eventType: "finance.payment.refunded",
    aggregateType: "financial_payment",
    aggregateId: payment.id,
    payload: { refundAmount, stripeRefundId: args.stripeRefundId }
  });
  await writeFinanceAudit({
    supabase,
    organizationId: args.organizationId,
    actorId: null,
    action: "finance.payment.refunded",
    entityType: "financial_payment",
    entityId: payment.id,
    payload: { refundAmount, stripeRefundId: args.stripeRefundId },
    correlationId: args.correlationId ?? null
  });
  await refreshResidentFinancialStatus(supabase, args.organizationId, payment.lease_id);
  return { paymentId: payment.id, refunded: nextRefunded, status: fullyRefunded ? "refunded" : "partially_refunded" };
}

export async function recordPaymentDispute(
  supabase: Db,
  args: {
    organizationId: string;
    paymentId: string;
    disputeId: string;
    disputeStatus: string;
    lost?: boolean;
    amount?: number;
    correlationId?: string | null;
  }
) {
  const { data: payment, error } = await supabase
    .from("financial_payments")
    .select("*")
    .eq("id", args.paymentId)
    .eq("organization_id", args.organizationId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  if (!payment) {
    throw new Error("Payment not found");
  }

  await supabase
    .from("financial_payments")
    .update({
      stripe_dispute_id: args.disputeId,
      dispute_status: args.disputeStatus,
      updated_at: new Date().toISOString()
    })
    .eq("id", payment.id);

  await writeFinanceAudit({
    supabase,
    organizationId: args.organizationId,
    actorId: null,
    action: "finance.payment.disputed",
    entityType: "financial_payment",
    entityId: payment.id,
    payload: { disputeId: args.disputeId, disputeStatus: args.disputeStatus, lost: args.lost === true },
    correlationId: args.correlationId ?? null
  });

  if (args.lost) {
    return applyPaymentRefund(supabase, {
      organizationId: args.organizationId,
      paymentId: payment.id,
      refundAmount: args.amount ?? Number(payment.amount),
      stripeRefundId: args.disputeId,
      correlationId: args.correlationId ?? null
    });
  }
  return { paymentId: payment.id, disputeStatus: args.disputeStatus };
}

export async function loadResidentFinancialStatus(supabase: Db, organizationId: string, leaseId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: charges } = await supabase
    .from("financial_charges")
    .select("amount, amount_paid, status, due_at, charge_type")
    .eq("organization_id", organizationId)
    .eq("lease_id", leaseId)
    .in("status", ["open", "partially_paid"]);

  let openBalance = 0;
  let hasPastDue = false;
  for (const charge of charges ?? []) {
    const remaining = remainingBalance({
      amount: Number(charge.amount),
      amount_paid: Number(charge.amount_paid)
    });
    if (charge.charge_type === "credit") {
      openBalance -= remaining;
    } else {
      openBalance += remaining;
      if (charge.due_at < today && remaining > 0) {
        hasPastDue = true;
      }
    }
  }

  const status = deriveResidentFinancialStatus({ openBalance: roundMoney(openBalance), hasPastDue });
  return { openBalance: roundMoney(openBalance), hasPastDue, status };
}

export async function refreshResidentFinancialStatus(supabase: Db, organizationId: string, leaseId: string) {
  const derived = await loadResidentFinancialStatus(supabase, organizationId, leaseId);
  await supabase
    .from("lease_residents")
    .update({ financial_status: derived.status })
    .eq("organization_id", organizationId)
    .eq("lease_id", leaseId);
  return derived;
}

export async function getLeaseLedger(supabase: Db, organizationId: string, leaseId: string) {
  const [{ data: charges }, { data: payments }, { data: ledger }, balance] = await Promise.all([
    supabase
      .from("financial_charges")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("lease_id", leaseId)
      .order("due_at", { ascending: true }),
    supabase
      .from("financial_payments")
      .select("*, financial_receipts(*)")
      .eq("organization_id", organizationId)
      .eq("lease_id", leaseId)
      .order("created_at", { ascending: false }),
    supabase
      .from("financial_ledger_entries")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("lease_id", leaseId)
      .order("occurred_at", { ascending: false }),
    loadResidentFinancialStatus(supabase, organizationId, leaseId)
  ]);

  return {
    charges: charges ?? [],
    payments: payments ?? [],
    ledger: ledger ?? [],
    balance
  };
}

export async function getOrganizationFinanceSnapshot(supabase: Db, organizationId: string) {
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const monthStartIso = monthStart.toISOString();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: openCharges }, { data: payments }, { data: residents }, { data: upcoming }] = await Promise.all([
    supabase
      .from("financial_charges")
      .select("id, amount, amount_paid, status, due_at, lease_id, property_id, label, charge_type")
      .eq("organization_id", organizationId)
      .in("status", ["open", "partially_paid"]),
    supabase
      .from("financial_payments")
      .select("id, amount, paid_at, status, lease_id, method, created_at")
      .eq("organization_id", organizationId)
      .eq("status", "succeeded")
      .gte("paid_at", monthStartIso)
      .order("paid_at", { ascending: false })
      .limit(20),
    supabase
      .from("lease_residents")
      .select("id, display_name, financial_status, lease_id")
      .eq("organization_id", organizationId)
      .eq("financial_status", "delinquent"),
    supabase
      .from("financial_charges")
      .select("id, label, amount, due_at, lease_id")
      .eq("organization_id", organizationId)
      .in("status", ["open", "partially_paid"])
      .gte("due_at", today)
      .order("due_at", { ascending: true })
      .limit(10)
  ]);

  const outstanding = roundMoney(
    (openCharges ?? []).reduce((sum, charge) => {
      const remaining = remainingBalance({
        amount: Number(charge.amount),
        amount_paid: Number(charge.amount_paid)
      });
      return charge.charge_type === "credit" ? sum - remaining : sum + remaining;
    }, 0)
  );

  const collectedThisMonth = roundMoney(
    (payments ?? []).reduce((sum, payment) => sum + Number(payment.amount), 0)
  );

  return {
    outstandingBalance: outstanding,
    collectedThisMonth,
    delinquentResidents: residents ?? [],
    upcomingRent: upcoming ?? [],
    recentPayments: payments ?? [],
    alerts: [
      ...(outstanding > 0
        ? [`${formatMoney(outstanding)} outstanding across open charges`]
        : ["No outstanding resident balances"]),
      ...((residents ?? []).length > 0
        ? [`${(residents ?? []).length} delinquent resident(s)`]
        : ["No delinquent residents"])
    ]
  };
}
