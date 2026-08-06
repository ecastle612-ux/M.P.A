import type { SupabaseClient } from "@supabase/supabase-js";
import {
  agingBucketForDaysPastDue,
  computeLateFeeAmount,
  daysBetween,
  delinquencyStatusForDays,
  formatMoney,
  isPastGrace,
  remainingBalance,
  roundMoney,
  type CreatePaymentArrangementInput,
  type CreateVendorInput,
  type CreateVendorInvoiceInput,
  type ReviewVendorInvoiceInput,
  type UpsertLateFeePolicyInput
} from "@mpa/shared";
import { emitFinanceEvent, writeFinanceAudit, writeFinanceNotification } from "./events-audit";
import { refreshResidentFinancialStatus } from "./billing-service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

async function resolvePolicy(supabase: Db, organizationId: string, propertyId: string) {
  const { data: propertyPolicy } = await supabase
    .from("financial_late_fee_policies")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("property_id", propertyId)
    .eq("active", true)
    .maybeSingle();
  if (propertyPolicy) {
    return propertyPolicy;
  }
  const { data: orgPolicy } = await supabase
    .from("financial_late_fee_policies")
    .select("*")
    .eq("organization_id", organizationId)
    .is("property_id", null)
    .eq("active", true)
    .maybeSingle();
  return (
    orgPolicy ?? {
      grace_days: 5,
      fee_type: "flat",
      fee_amount: 50,
      fee_percent: 0,
      max_fee_amount: null,
      name: "Default late fee"
    }
  );
}

export async function upsertLateFeePolicy(
  supabase: Db,
  organizationId: string,
  actorId: string,
  input: UpsertLateFeePolicyInput
) {
  const row = {
    organization_id: organizationId,
    property_id: input.propertyId ?? null,
    name: input.name,
    grace_days: input.graceDays,
    fee_type: input.feeType,
    fee_amount: input.feeAmount,
    fee_percent: input.feePercent,
    max_fee_amount: input.maxFeeAmount ?? null,
    active: input.active,
    updated_at: new Date().toISOString()
  };

  let existingQuery = supabase
    .from("financial_late_fee_policies")
    .select("id")
    .eq("organization_id", organizationId);
  existingQuery = input.propertyId
    ? existingQuery.eq("property_id", input.propertyId)
    : existingQuery.is("property_id", null);
  const { data: existing } = await existingQuery.maybeSingle();

  const query = existing
    ? supabase.from("financial_late_fee_policies").update(row).eq("id", existing.id)
    : supabase.from("financial_late_fee_policies").insert(row);

  const { data, error } = await query.select("*").single();
  if (error) {
    throw new Error(error.message);
  }

  await writeFinanceAudit({
    supabase,
    organizationId,
    actorId,
    action: "finance.settings.updated",
    entityType: "financial_late_fee_policy",
    entityId: data.id,
    payload: { graceDays: input.graceDays, feeType: input.feeType }
  });
  return data;
}

export async function syncDelinquencyCases(supabase: Db, organizationId: string, asOfDate?: string) {
  const today = asOfDate ?? new Date().toISOString().slice(0, 10);
  const { data: openCharges, error } = await supabase
    .from("financial_charges")
    .select("id, lease_id, property_id, resident_id, amount, amount_paid, due_at, status, charge_type")
    .eq("organization_id", organizationId)
    .in("status", ["open", "partially_paid"]);
  if (error) {
    throw new Error(error.message);
  }

  const byLease = new Map<
    string,
    {
      propertyId: string;
      residentId: string | null;
      balance: number;
      maxDaysPastDue: number;
    }
  >();

  for (const charge of openCharges ?? []) {
    if (charge.charge_type === "credit") {
      continue;
    }
    const remaining = remainingBalance({
      amount: Number(charge.amount),
      amount_paid: Number(charge.amount_paid)
    });
    if (remaining <= 0) {
      continue;
    }
    const days = Math.max(0, daysBetween(charge.due_at, today));
    const current = byLease.get(charge.lease_id) ?? {
      propertyId: charge.property_id,
      residentId: charge.resident_id,
      balance: 0,
      maxDaysPastDue: 0
    };
    current.balance = roundMoney(current.balance + remaining);
    current.maxDaysPastDue = Math.max(current.maxDaysPastDue, days);
    byLease.set(charge.lease_id, current);
  }

  const activeLeaseIds = [...byLease.keys()];
  const { data: existingCases } = await supabase
    .from("financial_delinquency_cases")
    .select("*")
    .eq("organization_id", organizationId);

  for (const existing of existingCases ?? []) {
    if (!activeLeaseIds.includes(existing.lease_id) && existing.status !== "resolved") {
      await supabase
        .from("financial_delinquency_cases")
        .update({
          status: "resolved",
          open_balance: 0,
          days_past_due: 0,
          aging_bucket: "current",
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", existing.id);
    }
  }

  const synced = [];
  for (const [leaseId, info] of byLease.entries()) {
    const policy = await resolvePolicy(supabase, organizationId, info.propertyId);
    const status = delinquencyStatusForDays(info.maxDaysPastDue, Number(policy.grace_days));
    const bucket = agingBucketForDaysPastDue(info.maxDaysPastDue);
    const payload = {
      organization_id: organizationId,
      property_id: info.propertyId,
      lease_id: leaseId,
      resident_id: info.residentId,
      status,
      open_balance: info.balance,
      days_past_due: info.maxDaysPastDue,
      aging_bucket: bucket,
      resolved_at: null,
      updated_at: new Date().toISOString()
    };
    const { data, error: upsertError } = await supabase
      .from("financial_delinquency_cases")
      .upsert(payload, { onConflict: "organization_id,lease_id" })
      .select("*")
      .single();
    if (upsertError) {
      throw new Error(upsertError.message);
    }
    await refreshResidentFinancialStatus(supabase, organizationId, leaseId);
    synced.push(data);
  }

  return synced;
}

export async function assessLateFees(
  supabase: Db,
  organizationId: string,
  actorId: string,
  filters?: { propertyId?: string; leaseId?: string; asOfDate?: string }
) {
  const today = filters?.asOfDate ?? new Date().toISOString().slice(0, 10);
  let query = supabase
    .from("financial_charges")
    .select("*")
    .eq("organization_id", organizationId)
    .in("status", ["open", "partially_paid"])
    .in("charge_type", ["rent", "recurring_fee", "one_time"])
    .is("late_fee_assessed_at", null);

  if (filters?.propertyId) {
    query = query.eq("property_id", filters.propertyId);
  }
  if (filters?.leaseId) {
    query = query.eq("lease_id", filters.leaseId);
  }

  const { data: charges, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const created = [];
  for (const charge of charges ?? []) {
    const policy = await resolvePolicy(supabase, organizationId, charge.property_id);
    if (!isPastGrace(charge.due_at, today, Number(policy.grace_days))) {
      continue;
    }
    const remaining = remainingBalance({
      amount: Number(charge.amount),
      amount_paid: Number(charge.amount_paid)
    });
    if (remaining <= 0) {
      continue;
    }

    const fee = computeLateFeeAmount({
      chargeAmount: remaining,
      feeType: policy.fee_type,
      feeAmount: Number(policy.fee_amount),
      feePercent: Number(policy.fee_percent),
      maxFeeAmount: policy.max_fee_amount != null ? Number(policy.max_fee_amount) : null
    });
    if (fee <= 0) {
      continue;
    }

    const { data: lateFee, error: insertError } = await supabase
      .from("financial_charges")
      .insert({
        organization_id: organizationId,
        property_id: charge.property_id,
        unit_id: charge.unit_id,
        lease_id: charge.lease_id,
        resident_id: charge.resident_id,
        charge_type: "late_fee",
        label: `Late fee — ${charge.label}`,
        memo: `Assessed after ${policy.grace_days}-day grace on ${charge.label}`,
        amount: fee,
        currency: charge.currency,
        status: "open",
        due_at: today,
        source_charge_id: charge.id,
        created_by: actorId
      })
      .select("*")
      .single();
    if (insertError) {
      throw new Error(insertError.message);
    }

    await supabase
      .from("financial_charges")
      .update({ late_fee_assessed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", charge.id);

    await supabase.from("financial_ledger_entries").insert({
      organization_id: organizationId,
      property_id: charge.property_id,
      lease_id: charge.lease_id,
      resident_id: charge.resident_id,
      entry_type: "charge",
      direction: "debit",
      amount: fee,
      currency: charge.currency,
      source_type: "financial_charges",
      source_id: lateFee.id,
      description: lateFee.label,
      idempotency_key: `late-fee:${charge.id}`,
      created_by: actorId
    });

    await emitFinanceEvent({
      supabase,
      organizationId,
      actorId,
      eventType: "finance.late_fee.applied",
      aggregateType: "financial_charge",
      aggregateId: lateFee.id,
      payload: { sourceChargeId: charge.id, amount: fee }
    });
    await writeFinanceAudit({
      supabase,
      organizationId,
      actorId,
      action: "finance.late_fee.applied",
      entityType: "financial_charge",
      entityId: lateFee.id,
      payload: { sourceChargeId: charge.id, amount: fee }
    });

    const { data: resident } = await supabase
      .from("lease_residents")
      .select("user_id")
      .eq("id", charge.resident_id)
      .maybeSingle();

    await writeFinanceNotification({
      supabase,
      organizationId,
      userId: resident?.user_id,
      leaseId: charge.lease_id,
      notificationKey: "finance.late_fee.applied",
      title: "Late fee added",
      body: `A late fee of ${formatMoney(fee, charge.currency)} was added because ${charge.label} was past the grace period.`,
      href: "/portal/tenant/billing"
    });

    created.push(lateFee);
  }

  await syncDelinquencyCases(supabase, organizationId, today);
  return { assessed: created.length, charges: created };
}

export async function sendDelinquencyReminder(
  supabase: Db,
  organizationId: string,
  actorId: string,
  caseId: string
) {
  const { data: delinquencyCase, error } = await supabase
    .from("financial_delinquency_cases")
    .select("*, lease_residents(user_id, display_name)")
    .eq("organization_id", organizationId)
    .eq("id", caseId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  if (!delinquencyCase) {
    throw new Error("Delinquency case not found");
  }

  const { data: updated, error: updateError } = await supabase
    .from("financial_delinquency_cases")
    .update({
      last_reminder_at: new Date().toISOString(),
      reminder_count: Number(delinquencyCase.reminder_count) + 1,
      status: delinquencyCase.status === "watch" ? "past_due" : delinquencyCase.status,
      updated_at: new Date().toISOString()
    })
    .eq("id", caseId)
    .select("*")
    .single();
  if (updateError) {
    throw new Error(updateError.message);
  }

  const resident = Array.isArray(delinquencyCase.lease_residents)
    ? delinquencyCase.lease_residents[0]
    : delinquencyCase.lease_residents;

  await writeFinanceNotification({
    supabase,
    organizationId,
    userId: resident?.user_id,
    leaseId: delinquencyCase.lease_id,
    notificationKey: "finance.charge.past_due",
    title: "Friendly reminder: balance past due",
    body: `Your balance of ${formatMoney(Number(delinquencyCase.open_balance))} still needs attention. Pay online or contact your property manager.`,
    href: "/portal/tenant/billing"
  });

  await writeFinanceAudit({
    supabase,
    organizationId,
    actorId,
    action: "finance.settings.updated",
    entityType: "financial_delinquency_case",
    entityId: caseId,
    payload: { reminder: true, count: updated.reminder_count }
  });

  return updated;
}

export async function createPaymentArrangement(
  supabase: Db,
  organizationId: string,
  actorId: string,
  input: CreatePaymentArrangementInput
) {
  const { data: delinquencyCase } = await supabase
    .from("financial_delinquency_cases")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("lease_id", input.leaseId)
    .maybeSingle();

  const { data, error } = await supabase
    .from("financial_payment_arrangements")
    .insert({
      organization_id: organizationId,
      lease_id: input.leaseId,
      delinquency_case_id: delinquencyCase?.id ?? null,
      status: "active",
      total_amount: input.totalAmount,
      installment_amount: input.installmentAmount,
      installments_total: input.installmentsTotal,
      next_due_on: input.nextDueOn,
      notes: input.notes ?? null,
      created_by: actorId
    })
    .select("*")
    .single();
  if (error) {
    throw new Error(error.message);
  }

  if (delinquencyCase?.id) {
    await supabase
      .from("financial_delinquency_cases")
      .update({ status: "in_collections", notes: "Payment arrangement active", updated_at: new Date().toISOString() })
      .eq("id", delinquencyCase.id);
  }

  const { data: resident } = await supabase
    .from("lease_residents")
    .select("user_id")
    .eq("lease_id", input.leaseId)
    .eq("is_primary", true)
    .maybeSingle();

  await writeFinanceNotification({
    supabase,
    organizationId,
    userId: resident?.user_id,
    leaseId: input.leaseId,
    notificationKey: "finance.charge.past_due",
    title: "Payment arrangement set",
    body: `A payment arrangement of ${formatMoney(input.installmentAmount)} per installment is now active.`,
    href: "/portal/tenant/billing"
  });

  await writeFinanceAudit({
    supabase,
    organizationId,
    actorId,
    action: "finance.settings.updated",
    entityType: "financial_payment_arrangement",
    entityId: data.id,
    payload: { totalAmount: input.totalAmount, installments: input.installmentsTotal }
  });

  return data;
}

export async function createVendor(supabase: Db, organizationId: string, input: CreateVendorInput) {
  const { data, error } = await supabase
    .from("vendor_vendors")
    .insert({
      organization_id: organizationId,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null
    })
    .select("*")
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function listVendorInvoices(
  supabase: Db,
  params: { organizationId: string; propertyId?: string; status?: string }
) {
  let query = supabase
    .from("financial_vendor_invoices")
    .select("*, vendor_vendors(name), property_properties(name)")
    .eq("organization_id", params.organizationId)
    .order("submitted_at", { ascending: false });
  if (params.propertyId) {
    query = query.eq("property_id", params.propertyId);
  }
  if (params.status) {
    query = query.eq("status", params.status);
  }
  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function createVendorInvoice(
  supabase: Db,
  organizationId: string,
  actorId: string,
  input: CreateVendorInvoiceInput
) {
  const { data, error } = await supabase
    .from("financial_vendor_invoices")
    .insert({
      organization_id: organizationId,
      vendor_id: input.vendorId,
      property_id: input.propertyId ?? null,
      work_order_id: input.workOrderId ?? null,
      invoice_number: input.invoiceNumber,
      description: input.description ?? null,
      amount: input.amount,
      currency: input.currency,
      status: "submitted",
      due_at: input.dueAt ?? null,
      created_by: actorId
    })
    .select("*, vendor_vendors(name)")
    .single();
  if (error) {
    throw new Error(error.message);
  }

  await emitFinanceEvent({
    supabase,
    organizationId,
    actorId,
    eventType: "finance.vendor_invoice.submitted",
    aggregateType: "financial_vendor_invoice",
    aggregateId: data.id,
    payload: { amount: input.amount, invoiceNumber: input.invoiceNumber }
  });
  await writeFinanceAudit({
    supabase,
    organizationId,
    actorId,
    action: "finance.vendor_invoice.submitted",
    entityType: "financial_vendor_invoice",
    entityId: data.id,
    payload: { amount: input.amount }
  });
  return data;
}

export async function reviewVendorInvoice(
  supabase: Db,
  organizationId: string,
  actorId: string,
  input: ReviewVendorInvoiceInput
) {
  const { data: invoice, error } = await supabase
    .from("financial_vendor_invoices")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", input.invoiceId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  if (!invoice) {
    throw new Error("Invoice not found");
  }

  if (input.action === "approve") {
    const { data, error: updateError } = await supabase
      .from("financial_vendor_invoices")
      .update({
        status: "approved",
        reviewed_by: actorId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", invoice.id)
      .select("*")
      .single();
    if (updateError) {
      throw new Error(updateError.message);
    }
    await emitFinanceEvent({
      supabase,
      organizationId,
      actorId,
      eventType: "finance.vendor_invoice.approved",
      aggregateType: "financial_vendor_invoice",
      aggregateId: invoice.id,
      payload: {}
    });
    await writeFinanceAudit({
      supabase,
      organizationId,
      actorId,
      action: "finance.vendor_invoice.approved",
      entityType: "financial_vendor_invoice",
      entityId: invoice.id
    });
    return { invoice: data };
  }

  if (input.action === "reject" || input.action === "request_changes") {
    const status = input.action === "reject" ? "rejected" : "changes_requested";
    const { data, error: updateError } = await supabase
      .from("financial_vendor_invoices")
      .update({
        status,
        rejection_reason: input.reason ?? null,
        reviewed_by: actorId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", invoice.id)
      .select("*")
      .single();
    if (updateError) {
      throw new Error(updateError.message);
    }
    await emitFinanceEvent({
      supabase,
      organizationId,
      actorId,
      eventType: "finance.vendor_invoice.rejected",
      aggregateType: "financial_vendor_invoice",
      aggregateId: invoice.id,
      payload: { status, reason: input.reason }
    });
    await writeFinanceAudit({
      supabase,
      organizationId,
      actorId,
      action: "finance.vendor_invoice.rejected",
      entityType: "financial_vendor_invoice",
      entityId: invoice.id,
      payload: { status, reason: input.reason }
    });
    return { invoice: data };
  }

  if (input.action === "schedule") {
    if (invoice.status !== "approved" && invoice.status !== "scheduled") {
      throw new Error("Invoice must be approved before scheduling payment");
    }
    const scheduledFor = input.scheduledFor ?? new Date().toISOString().slice(0, 10);
    const { data: updatedInvoice, error: updateError } = await supabase
      .from("financial_vendor_invoices")
      .update({
        status: "scheduled",
        scheduled_for: scheduledFor,
        updated_at: new Date().toISOString()
      })
      .eq("id", invoice.id)
      .select("*")
      .single();
    if (updateError) {
      throw new Error(updateError.message);
    }

    const { data: payment, error: paymentError } = await supabase
      .from("financial_vendor_payments")
      .insert({
        organization_id: organizationId,
        vendor_id: invoice.vendor_id,
        invoice_id: invoice.id,
        property_id: invoice.property_id,
        amount: invoice.amount,
        currency: invoice.currency,
        status: "scheduled",
        method: input.paymentMethod ?? "manual_other",
        scheduled_for: scheduledFor,
        recorded_by: actorId
      })
      .select("*")
      .single();
    if (paymentError) {
      throw new Error(paymentError.message);
    }
    return { invoice: updatedInvoice, payment };
  }

  if (input.action === "mark_paid") {
    if (!["approved", "scheduled"].includes(invoice.status)) {
      throw new Error("Invoice must be approved or scheduled before marking paid");
    }
    const paidAt = new Date().toISOString();
    const { data: updatedInvoice, error: updateError } = await supabase
      .from("financial_vendor_invoices")
      .update({
        status: "paid",
        paid_at: paidAt,
        updated_at: paidAt
      })
      .eq("id", invoice.id)
      .select("*")
      .single();
    if (updateError) {
      throw new Error(updateError.message);
    }

    let payment;
    const { data: existingPayment } = await supabase
      .from("financial_vendor_payments")
      .select("*")
      .eq("invoice_id", invoice.id)
      .neq("status", "cancelled")
      .maybeSingle();

    if (existingPayment) {
      const { data, error: payUpdateError } = await supabase
        .from("financial_vendor_payments")
        .update({ status: "paid", paid_at: paidAt, updated_at: paidAt })
        .eq("id", existingPayment.id)
        .select("*")
        .single();
      if (payUpdateError) {
        throw new Error(payUpdateError.message);
      }
      payment = data;
    } else {
      const { data, error: payInsertError } = await supabase
        .from("financial_vendor_payments")
        .insert({
          organization_id: organizationId,
          vendor_id: invoice.vendor_id,
          invoice_id: invoice.id,
          property_id: invoice.property_id,
          amount: invoice.amount,
          currency: invoice.currency,
          status: "paid",
          method: input.paymentMethod ?? "manual_other",
          paid_at: paidAt,
          recorded_by: actorId
        })
        .select("*")
        .single();
      if (payInsertError) {
        throw new Error(payInsertError.message);
      }
      payment = data;
    }

    await supabase.from("financial_ledger_entries").insert({
      organization_id: organizationId,
      property_id: invoice.property_id,
      entry_type: "adjustment",
      direction: "debit",
      amount: Number(invoice.amount),
      currency: invoice.currency,
      source_type: "financial_vendor_payments",
      source_id: payment.id,
      description: `Vendor payment ${invoice.invoice_number}`,
      idempotency_key: `vendor-payment:${payment.id}`,
      created_by: actorId
    });

    await emitFinanceEvent({
      supabase,
      organizationId,
      actorId,
      eventType: "finance.vendor_payment.paid",
      aggregateType: "financial_vendor_payment",
      aggregateId: payment.id,
      payload: { invoiceId: invoice.id, amount: invoice.amount }
    });
    await writeFinanceAudit({
      supabase,
      organizationId,
      actorId,
      action: "finance.vendor_payment.paid",
      entityType: "financial_vendor_payment",
      entityId: payment.id,
      payload: { invoiceId: invoice.id }
    });

    return { invoice: updatedInvoice, payment };
  }

  throw new Error("Unknown vendor invoice action");
}

export async function getCollectionsSnapshot(supabase: Db, organizationId: string) {
  await syncDelinquencyCases(supabase, organizationId);

  const [
    { data: cases },
    { data: lateFees },
    { data: invoices },
    { data: scheduledPayments },
    { data: arrangements }
  ] = await Promise.all([
    supabase
      .from("financial_delinquency_cases")
      .select("*, lease_residents(display_name), property_properties(name)")
      .eq("organization_id", organizationId)
      .neq("status", "resolved")
      .order("days_past_due", { ascending: false }),
    supabase
      .from("financial_charges")
      .select("id, label, amount, due_at, lease_id, status")
      .eq("organization_id", organizationId)
      .eq("charge_type", "late_fee")
      .in("status", ["open", "partially_paid"])
      .order("due_at", { ascending: true })
      .limit(20),
    supabase
      .from("financial_vendor_invoices")
      .select("*, vendor_vendors(name)")
      .eq("organization_id", organizationId)
      .in("status", ["submitted", "in_review", "approved", "scheduled"])
      .order("submitted_at", { ascending: false }),
    supabase
      .from("financial_vendor_payments")
      .select("*, vendor_vendors(name), financial_vendor_invoices(invoice_number)")
      .eq("organization_id", organizationId)
      .eq("status", "scheduled")
      .order("scheduled_for", { ascending: true }),
    supabase
      .from("financial_payment_arrangements")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("status", "active")
  ]);

  const aging = { current: 0, "1_30": 0, "31_60": 0, "61_90": 0, "90_plus": 0 };
  let totalDelinquency = 0;
  for (const item of cases ?? []) {
    totalDelinquency = roundMoney(totalDelinquency + Number(item.open_balance));
    const bucket = item.aging_bucket as keyof typeof aging;
    aging[bucket] = roundMoney(aging[bucket] + Number(item.open_balance));
  }

  const awaitingApproval = (invoices ?? []).filter((invoice) =>
    ["submitted", "in_review"].includes(invoice.status)
  );

  return {
    residentsOverdue: cases ?? [],
    totalDelinquency,
    aging,
    upcomingLateFees: lateFees ?? [],
    vendorInvoicesAwaitingApproval: awaitingApproval,
    vendorPaymentsDue: scheduledPayments ?? [],
    activeArrangements: arrangements ?? [],
    alerts: [
      `${(cases ?? []).length} resident(s) in delinquency`,
      `${awaitingApproval.length} vendor invoice(s) awaiting approval`,
      `${(scheduledPayments ?? []).length} vendor payment(s) scheduled`
    ]
  };
}
