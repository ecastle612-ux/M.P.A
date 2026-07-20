/**
 * BillingService — sole domain entry for API-005 resident payments & billing.
 * Never call PaymentProvider from UI or other business modules.
 */
import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@mpa/supabase";
import { createAuthServerComponentClient, createServiceRoleServerClient } from "../auth/server";
import { getPaymentProvider, resolveDefaultPaymentProviderId } from "../integrations/payments/registry";
import { createRentCharge, recordFinancialActivity, generateFinancialNumber } from "../financial/server";
import {
  AUTOPAY_CONSENT_VERSION,
  friendlyPaymentError,
  mapProviderFailureToCode,
  type AdjustmentType,
  type AutopayEnrollmentRecord,
  type BillingInvoiceRecord,
  type BillingLedgerEntryRecord,
  type BillingOpsSnapshot,
  type BillingScheduleRecord,
  type CollectionsQueueItem,
  type LedgerEntryType,
  type PaymentAttemptRecord,
  type PaymentMethodRecord,
  type PaymentReceiptRecord,
  type ResidentPaymentDashboard
} from "./contracts";

// API-005 tables may not yet be in generated Database types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BillingClient = any;

async function resolveClient(client?: SupabaseClient<Database>): Promise<BillingClient> {
  return client ?? (await createAuthServerComponentClient());
}

async function adminClient(): Promise<BillingClient> {
  return createServiceRoleServerClient() as BillingClient;
}

function billingNumber(prefix: string): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(2).toString("hex").toUpperCase();
  return `${prefix}-${stamp}-${rand}`;
}

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

function fromCents(cents: number): number {
  return Math.round(cents) / 100;
}

function contentHash(payload: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

async function writeAudit(
  organizationId: string,
  entityType: string,
  entityId: string | null,
  eventType: string,
  summary: string,
  actorUserId: string | null,
  payload: Record<string, unknown>,
  client: BillingClient
) {
  await client.from("billing_audit_events").insert({
    organization_id: organizationId,
    entity_type: entityType,
    entity_id: entityId,
    event_type: eventType,
    summary,
    actor_user_id: actorUserId,
    payload: payload as Json
  });
}

async function appendLedger(input: {
  organizationId: string;
  tenantId: string;
  leaseId?: string | null;
  propertyId?: string | null;
  entryType: LedgerEntryType;
  amount: number;
  balanceAfter?: number | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  summary: string;
  payload?: Record<string, unknown>;
  createdBy?: string | null;
  client: BillingClient;
}): Promise<BillingLedgerEntryRecord> {
  const entryNumber = billingNumber("LE");
  const { data, error } = await input.client
    .from("billing_ledger_entries")
    .insert({
      organization_id: input.organizationId,
      entry_number: entryNumber,
      tenant_id: input.tenantId,
      lease_id: input.leaseId ?? null,
      property_id: input.propertyId ?? null,
      entry_type: input.entryType,
      amount: input.amount,
      balance_after: input.balanceAfter ?? null,
      related_entity_type: input.relatedEntityType ?? null,
      related_entity_id: input.relatedEntityId ?? null,
      summary: input.summary,
      payload: (input.payload ?? {}) as Json,
      created_by: input.createdBy ?? null
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapLedger(data);
}

function mapLedger(row: Record<string, unknown>): BillingLedgerEntryRecord {
  return {
    id: String(row["id"]),
    organizationId: String(row["organization_id"]),
    entryNumber: String(row["entry_number"]),
    tenantId: String(row["tenant_id"]),
    leaseId: (row["lease_id"] as string | null) ?? null,
    propertyId: (row["property_id"] as string | null) ?? null,
    entryType: row["entry_type"] as LedgerEntryType,
    amount: Number(row["amount"]),
    balanceAfter: row["balance_after"] != null ? Number(row["balance_after"]) : null,
    currency: String(row["currency"] ?? "usd"),
    relatedEntityType: (row["related_entity_type"] as string | null) ?? null,
    relatedEntityId: (row["related_entity_id"] as string | null) ?? null,
    summary: String(row["summary"]),
    payload: (row["payload"] as Record<string, unknown>) ?? {},
    createdAt: String(row["created_at"])
  };
}

function mapSchedule(row: Record<string, unknown>): BillingScheduleRecord {
  return {
    id: String(row["id"]),
    organizationId: String(row["organization_id"]),
    leaseId: String(row["lease_id"]),
    tenantId: String(row["tenant_id"]),
    propertyId: String(row["property_id"]),
    unitId: String(row["unit_id"]),
    amount: Number(row["amount"]),
    currency: String(row["currency"] ?? "usd"),
    dueDayOfMonth: Number(row["due_day_of_month"] ?? 1),
    graceDays: Number(row["grace_days"] ?? 5),
    lateFeeAmount: Number(row["late_fee_amount"] ?? 0),
    lateFeeType: (row["late_fee_type"] as "flat" | "percent") ?? "flat",
    lateFeePercent: Number(row["late_fee_percent"] ?? 0),
    active: Boolean(row["active"]),
    nextPeriodStart: (row["next_period_start"] as string | null) ?? null,
    metadata: (row["metadata"] as Record<string, unknown>) ?? {},
    createdAt: String(row["created_at"]),
    updatedAt: String(row["updated_at"])
  };
}

function mapInvoice(row: Record<string, unknown>): BillingInvoiceRecord {
  return {
    id: String(row["id"]),
    organizationId: String(row["organization_id"]),
    invoiceNumber: String(row["invoice_number"]),
    leaseId: String(row["lease_id"]),
    tenantId: String(row["tenant_id"]),
    propertyId: String(row["property_id"]),
    unitId: String(row["unit_id"]),
    status: row["status"] as BillingInvoiceRecord["status"],
    periodStart: (row["period_start"] as string | null) ?? null,
    periodEnd: (row["period_end"] as string | null) ?? null,
    dueDate: String(row["due_date"]),
    totalAmount: Number(row["total_amount"]),
    amountPaid: Number(row["amount_paid"]),
    outstandingBalance: Number(row["outstanding_balance"]),
    publishedAt: (row["published_at"] as string | null) ?? null,
    metadata: (row["metadata"] as Record<string, unknown>) ?? {},
    createdAt: String(row["created_at"]),
    updatedAt: String(row["updated_at"])
  };
}

function mapMethod(row: Record<string, unknown>): PaymentMethodRecord {
  return {
    id: String(row["id"]),
    organizationId: String(row["organization_id"]),
    tenantId: String(row["tenant_id"]),
    paymentCustomerId: String(row["payment_customer_id"]),
    provider: String(row["provider"]),
    externalMethodId: String(row["external_method_id"]),
    methodType: row["method_type"] as PaymentMethodRecord["methodType"],
    brand: (row["brand"] as string | null) ?? null,
    last4: (row["last4"] as string | null) ?? null,
    expMonth: row["exp_month"] != null ? Number(row["exp_month"]) : null,
    expYear: row["exp_year"] != null ? Number(row["exp_year"]) : null,
    bankName: (row["bank_name"] as string | null) ?? null,
    isDefault: Boolean(row["is_default"]),
    status: row["status"] as PaymentMethodRecord["status"],
    createdAt: String(row["created_at"])
  };
}

function mapAttempt(row: Record<string, unknown>): PaymentAttemptRecord {
  return {
    id: String(row["id"]),
    organizationId: String(row["organization_id"]),
    attemptNumber: String(row["attempt_number"]),
    tenantId: String(row["tenant_id"]),
    leaseId: (row["lease_id"] as string | null) ?? null,
    paymentId: (row["payment_id"] as string | null) ?? null,
    paymentMethodId: (row["payment_method_id"] as string | null) ?? null,
    provider: String(row["provider"]),
    externalAttemptId: (row["external_attempt_id"] as string | null) ?? null,
    amount: Number(row["amount"]),
    currency: String(row["currency"] ?? "usd"),
    status: row["status"] as PaymentAttemptRecord["status"],
    source: row["source"] as PaymentAttemptRecord["source"],
    chargeIds: (row["charge_ids"] as string[]) ?? [],
    failureCode: (row["failure_code"] as string | null) ?? null,
    failureMessage: (row["failure_message"] as string | null) ?? null,
    clientSecret: (row["client_secret"] as string | null) ?? null,
    retryCount: Number(row["retry_count"] ?? 0),
    reconciledAt: (row["reconciled_at"] as string | null) ?? null,
    metadata: (row["metadata"] as Record<string, unknown>) ?? {},
    createdAt: String(row["created_at"]),
    updatedAt: String(row["updated_at"])
  };
}

function mapAutopay(row: Record<string, unknown>): AutopayEnrollmentRecord {
  return {
    id: String(row["id"]),
    organizationId: String(row["organization_id"]),
    tenantId: String(row["tenant_id"]),
    leaseId: String(row["lease_id"]),
    paymentMethodId: String(row["payment_method_id"]),
    status: row["status"] as AutopayEnrollmentRecord["status"],
    consentVersion: String(row["consent_version"]),
    consentedAt: String(row["consented_at"]),
    revokedAt: (row["revoked_at"] as string | null) ?? null,
    maxAmount: row["max_amount"] != null ? Number(row["max_amount"]) : null,
    createdAt: String(row["created_at"]),
    updatedAt: String(row["updated_at"])
  };
}

function mapReceipt(row: Record<string, unknown>): PaymentReceiptRecord {
  return {
    id: String(row["id"]),
    organizationId: String(row["organization_id"]),
    receiptNumber: String(row["receipt_number"]),
    paymentId: (row["payment_id"] as string | null) ?? null,
    paymentAttemptId: (row["payment_attempt_id"] as string | null) ?? null,
    tenantId: String(row["tenant_id"]),
    leaseId: (row["lease_id"] as string | null) ?? null,
    amount: Number(row["amount"]),
    currency: String(row["currency"] ?? "usd"),
    methodSummary: (row["method_summary"] as string | null) ?? null,
    contentHash: String(row["content_hash"]),
    payload: (row["payload"] as Record<string, unknown>) ?? {},
    issuedAt: String(row["issued_at"])
  };
}

function monthPeriod(dueDay: number, from = new Date()): { periodStart: string; periodEnd: string; dueDate: string } {
  const year = from.getUTCFullYear();
  const month = from.getUTCMonth();
  const periodStart = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
  const periodEnd = new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10);
  const dueDate = new Date(Date.UTC(year, month, Math.min(dueDay, 28))).toISOString().slice(0, 10);
  return { periodStart, periodEnd, dueDate };
}

// ---------------------------------------------------------------------------
// Schedules & charges
// ---------------------------------------------------------------------------

export async function upsertBillingSchedule(
  organizationId: string,
  userId: string,
  input: {
    leaseId: string;
    amount: number;
    dueDayOfMonth?: number;
    graceDays?: number;
    lateFeeAmount?: number;
    lateFeeType?: "flat" | "percent";
    lateFeePercent?: number;
  },
  client?: SupabaseClient<Database>
): Promise<BillingScheduleRecord> {
  const db = await resolveClient(client);
  const { data: lease, error: leaseError } = await db
    .from("leases")
    .select("id, property_id, unit_id, primary_tenant_id, rent_amount, status")
    .eq("organization_id", organizationId)
    .eq("id", input.leaseId)
    .maybeSingle();
  if (leaseError) throw new Error(leaseError.message);
  if (!lease) throw new Error("Lease not found");

  const payload = {
    organization_id: organizationId,
    lease_id: input.leaseId,
    tenant_id: lease.primary_tenant_id,
    property_id: lease.property_id,
    unit_id: lease.unit_id,
    amount: input.amount > 0 ? input.amount : Number(lease.rent_amount ?? 0),
    due_day_of_month: input.dueDayOfMonth ?? 1,
    grace_days: input.graceDays ?? 5,
    late_fee_amount: input.lateFeeAmount ?? 0,
    late_fee_type: input.lateFeeType ?? "flat",
    late_fee_percent: input.lateFeePercent ?? 0,
    active: true,
    created_by: userId,
    updated_by: userId
  };

  const { data, error } = await db
    .from("billing_schedules")
    .upsert(payload, { onConflict: "organization_id,lease_id" })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const schedule = mapSchedule(data);
  await writeAudit(
    organizationId,
    "billing_schedule",
    schedule.id,
    "billing.schedule.created",
    `Billing schedule for lease ${input.leaseId}`,
    userId,
    { amount: schedule.amount },
    db
  );
  return schedule;
}

export async function generateRecurringChargesForOrganization(
  organizationId: string,
  userId: string,
  client?: SupabaseClient<Database>
) {
  const db = await resolveClient(client);
  const { data: schedules, error } = await db
    .from("billing_schedules")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("active", true);
  if (error) throw new Error(error.message);

  const created = [];
  for (const row of schedules ?? []) {
    const schedule = mapSchedule(row);
    const period = monthPeriod(schedule.dueDayOfMonth);
    const { data: existing } = await db
      .from("rent_charges")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("lease_id", schedule.leaseId)
      .eq("period_start", period.periodStart)
      .eq("charge_type", "monthly_rent")
      .is("deleted_at", null)
      .maybeSingle();
    if (existing) continue;

    const charge = await createRentCharge(
      organizationId,
      userId,
      {
        leaseId: schedule.leaseId,
        chargeType: "monthly_rent",
        description: `Monthly rent ${period.periodStart}–${period.periodEnd}`,
        amount: schedule.amount,
        dueDate: period.dueDate,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd
      },
      db
    );

    await appendLedger({
      organizationId,
      tenantId: schedule.tenantId,
      leaseId: schedule.leaseId,
      propertyId: schedule.propertyId,
      entryType: "charge",
      amount: charge.amount,
      balanceAfter: charge.outstandingBalance,
      relatedEntityType: "rent_charge",
      relatedEntityId: charge.id,
      summary: `Charge ${charge.chargeNumber} generated`,
      createdBy: userId,
      client: db
    });

    await writeAudit(
      organizationId,
      "rent_charge",
      charge.id,
      "billing.charge.created",
      `Recurring charge ${charge.chargeNumber}`,
      userId,
      { period },
      db
    );

    created.push(charge);
  }
  return created;
}

export async function publishInvoiceForCharges(
  organizationId: string,
  userId: string,
  input: { leaseId: string; chargeIds: string[]; dueDate: string },
  client?: SupabaseClient<Database>
): Promise<BillingInvoiceRecord> {
  const db = await resolveClient(client);
  const { data: lease } = await db
    .from("leases")
    .select("id, property_id, unit_id, primary_tenant_id")
    .eq("organization_id", organizationId)
    .eq("id", input.leaseId)
    .maybeSingle();
  if (!lease) throw new Error("Lease not found");

  const { data: charges } = await db
    .from("rent_charges")
    .select("*")
    .eq("organization_id", organizationId)
    .in("id", input.chargeIds)
    .is("deleted_at", null);
  const list = charges ?? [];
  const total = list.reduce((sum: number, c: { outstanding_balance: number }) => sum + Number(c.outstanding_balance), 0);

  const invoiceNumber = billingNumber("INV");
  const { data, error } = await db
    .from("billing_invoices")
    .insert({
      organization_id: organizationId,
      invoice_number: invoiceNumber,
      lease_id: input.leaseId,
      tenant_id: lease.primary_tenant_id,
      property_id: lease.property_id,
      unit_id: lease.unit_id,
      status: "published",
      due_date: input.dueDate,
      total_amount: total,
      outstanding_balance: total,
      published_at: new Date().toISOString(),
      metadata: { chargeIds: input.chargeIds },
      created_by: userId,
      updated_by: userId
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const invoice = mapInvoice(data);

  await writeAudit(
    organizationId,
    "billing_invoice",
    invoice.id,
    "billing.charge.published",
    `Invoice ${invoice.invoiceNumber} published`,
    userId,
    { chargeIds: input.chargeIds },
    db
  );

  return invoice;
}

export async function assessLateFeesForOrganization(
  organizationId: string,
  userId: string,
  client?: SupabaseClient<Database>
) {
  const db = await resolveClient(client);
  const today = new Date().toISOString().slice(0, 10);
  const { data: schedules } = await db
    .from("billing_schedules")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("active", true);

  const assessed = [];
  for (const row of schedules ?? []) {
    const schedule = mapSchedule(row);
    if (schedule.lateFeeAmount <= 0 && schedule.lateFeePercent <= 0) continue;

    const graceCutoff = new Date();
    graceCutoff.setUTCDate(graceCutoff.getUTCDate() - schedule.graceDays);
    const cutoff = graceCutoff.toISOString().slice(0, 10);

    const { data: overdue } = await db
      .from("rent_charges")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("lease_id", schedule.leaseId)
      .in("status", ["pending", "partial", "overdue"])
      .lt("due_date", cutoff)
      .is("deleted_at", null);

    for (const charge of overdue ?? []) {
      const feeAmount =
        schedule.lateFeeType === "percent"
          ? Math.round(Number(charge.outstanding_balance) * (schedule.lateFeePercent / 100) * 100) / 100
          : schedule.lateFeeAmount;
      if (feeAmount <= 0) continue;

      const { data: existingFee } = await db
        .from("late_fees")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("rent_charge_id", charge.id)
        .is("deleted_at", null)
        .maybeSingle();
      if (existingFee) continue;

      await db.from("late_fees").insert({
        organization_id: organizationId,
        rent_charge_id: charge.id,
        lease_id: schedule.leaseId,
        property_id: schedule.propertyId,
        tenant_id: schedule.tenantId,
        fee_amount: feeAmount,
        status: "applied",
        reason: `Late fee assessed on ${today}`,
        created_by: userId,
        updated_by: userId
      });

      const lateCharge = await createRentCharge(
        organizationId,
        userId,
        {
          leaseId: schedule.leaseId,
          chargeType: "late_fee",
          description: `Late fee for ${charge.charge_number}`,
          amount: feeAmount,
          dueDate: today
        },
        db
      );

      await db
        .from("rent_charges")
        .update({ late_status: "late", status: "overdue", updated_by: userId })
        .eq("id", charge.id)
        .eq("organization_id", organizationId);

      await appendLedger({
        organizationId,
        tenantId: schedule.tenantId,
        leaseId: schedule.leaseId,
        propertyId: schedule.propertyId,
        entryType: "late_fee",
        amount: feeAmount,
        relatedEntityType: "rent_charge",
        relatedEntityId: lateCharge.id,
        summary: `Late fee assessed on ${charge.charge_number}`,
        createdBy: userId,
        client: db
      });

      await writeAudit(
        organizationId,
        "late_fee",
        lateCharge.id,
        "billing.late_fee.assessed",
        `Late fee $${feeAmount} on ${charge.charge_number}`,
        userId,
        { sourceChargeId: charge.id },
        db
      );

      assessed.push(lateCharge);
    }
  }
  return assessed;
}

// ---------------------------------------------------------------------------
// Payment methods & AutoPay
// ---------------------------------------------------------------------------

async function ensureCustomer(
  organizationId: string,
  tenantId: string,
  providerId: string,
  db: BillingClient
) {
  const { data: existing } = await db
    .from("payment_customers")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("tenant_id", tenantId)
    .eq("provider", providerId)
    .maybeSingle();
  if (existing) return existing;

  const { data: tenant } = await db
    .from("tenants")
    .select("email, first_name, last_name")
    .eq("organization_id", organizationId)
    .eq("id", tenantId)
    .maybeSingle();

  const provider = getPaymentProvider(providerId);
  const ref = await provider.createCustomer({
    organizationId,
    tenantId,
    email: tenant?.email ?? null,
    name: tenant ? `${tenant.first_name} ${tenant.last_name}` : null
  });

  const { data, error } = await db
    .from("payment_customers")
    .insert({
      organization_id: organizationId,
      tenant_id: tenantId,
      provider: providerId,
      external_customer_id: ref.externalCustomerId
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function attachResidentPaymentMethod(
  organizationId: string,
  userId: string | null,
  input: {
    tenantId: string;
    externalPaymentMethodId: string;
    setDefault?: boolean;
    providerId?: string;
  },
  client?: SupabaseClient<Database>
): Promise<PaymentMethodRecord> {
  const db = await resolveClient(client);
  const providerId = input.providerId ?? resolveDefaultPaymentProviderId();
  const customer = await ensureCustomer(organizationId, input.tenantId, providerId, db);
  const provider = getPaymentProvider(providerId);
  const ref = await provider.attachPaymentMethod({
    externalCustomerId: customer.external_customer_id,
    externalPaymentMethodId: input.externalPaymentMethodId,
    ...(input.setDefault !== undefined ? { setDefault: input.setDefault } : {})
  });

  if (input.setDefault) {
    await db
      .from("payment_methods")
      .update({ is_default: false })
      .eq("organization_id", organizationId)
      .eq("tenant_id", input.tenantId)
      .eq("status", "active");
  }

  const { data, error } = await db
    .from("payment_methods")
    .insert({
      organization_id: organizationId,
      tenant_id: input.tenantId,
      payment_customer_id: customer.id,
      provider: providerId,
      external_method_id: ref.externalMethodId,
      method_type: ref.methodType,
      brand: ref.brand ?? null,
      last4: ref.last4 ?? null,
      exp_month: ref.expMonth ?? null,
      exp_year: ref.expYear ?? null,
      bank_name: ref.bankName ?? null,
      is_default: Boolean(input.setDefault)
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const method = mapMethod(data);
  await writeAudit(
    organizationId,
    "payment_method",
    method.id,
    "billing.method.attached",
    `Payment method •••• ${method.last4 ?? "****"} attached`,
    userId,
    { methodType: method.methodType },
    db
  );
  return method;
}

export async function enrollAutopay(
  organizationId: string,
  userId: string | null,
  input: {
    tenantId: string;
    leaseId: string;
    paymentMethodId: string;
    consentVersion?: string;
    maxAmount?: number | null;
  },
  client?: SupabaseClient<Database>
): Promise<AutopayEnrollmentRecord> {
  const db = await resolveClient(client);
  const consentVersion = input.consentVersion ?? AUTOPAY_CONSENT_VERSION;
  const consentedAt = new Date().toISOString();

  const { data, error } = await db
    .from("autopay_enrollments")
    .upsert(
      {
        organization_id: organizationId,
        tenant_id: input.tenantId,
        lease_id: input.leaseId,
        payment_method_id: input.paymentMethodId,
        status: "active",
        consent_version: consentVersion,
        consented_at: consentedAt,
        revoked_at: null,
        max_amount: input.maxAmount ?? null,
        created_by: userId,
        updated_by: userId
      },
      { onConflict: "organization_id,lease_id" }
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const enrollment = mapAutopay(data);

  await writeAudit(
    organizationId,
    "autopay_enrollment",
    enrollment.id,
    "billing.autopay.enrolled",
    `AutoPay enrolled (consent ${consentVersion})`,
    userId,
    { consentVersion, consentedAt },
    db
  );

  await recordFinancialActivity(
    organizationId,
    userId ?? organizationId,
    "autopay_enrolled",
    "autopay_enrollment",
    enrollment.id,
    {
      leaseId: input.leaseId,
      tenantId: input.tenantId,
      amount: 0,
      summary: "AutoPay enrolled",
      payload: { consentVersion }
    },
    db
  ).catch(() => undefined);

  return enrollment;
}

export async function disableAutopay(
  organizationId: string,
  userId: string | null,
  leaseId: string,
  client?: SupabaseClient<Database>
): Promise<AutopayEnrollmentRecord | null> {
  const db = await resolveClient(client);
  const { data, error } = await db
    .from("autopay_enrollments")
    .update({
      status: "disabled",
      revoked_at: new Date().toISOString(),
      updated_by: userId
    })
    .eq("organization_id", organizationId)
    .eq("lease_id", leaseId)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const enrollment = mapAutopay(data);
  await writeAudit(
    organizationId,
    "autopay_enrollment",
    enrollment.id,
    "billing.autopay.disabled",
    "AutoPay disabled",
    userId,
    {},
    db
  );
  return enrollment;
}

// ---------------------------------------------------------------------------
// Checkout / payments
// ---------------------------------------------------------------------------

export async function initiateResidentPayment(
  organizationId: string,
  userId: string | null,
  input: {
    tenantId: string;
    leaseId?: string | null;
    chargeIds: string[];
    amount?: number;
    paymentMethodId?: string | null;
    source?: PaymentAttemptRecord["source"];
    providerId?: string;
  },
  client?: SupabaseClient<Database>
): Promise<PaymentAttemptRecord> {
  const db = await resolveClient(client);
  const providerId = input.providerId ?? resolveDefaultPaymentProviderId();
  const provider = getPaymentProvider(providerId);

  const { data: charges } = await db
    .from("rent_charges")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("tenant_id", input.tenantId)
    .in("id", input.chargeIds)
    .is("deleted_at", null)
    .order("due_date", { ascending: true });

  const list = charges ?? [];
  if (!list.length) throw new Error("No payable charges found");

  const outstanding = list.reduce(
    (sum: number, c: { outstanding_balance: number }) => sum + Number(c.outstanding_balance),
    0
  );
  const amount = input.amount != null ? input.amount : outstanding;
  if (amount <= 0) throw new Error("Payment amount must be positive");
  if (amount > outstanding + 0.001) throw new Error("Payment exceeds outstanding balance");

  const customer = await ensureCustomer(organizationId, input.tenantId, providerId, db);
  let externalMethodId: string | null = null;
  const paymentMethodId = input.paymentMethodId ?? null;

  if (paymentMethodId) {
    const { data: method } = await db
      .from("payment_methods")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("id", paymentMethodId)
      .eq("status", "active")
      .maybeSingle();
    if (!method) throw new Error("Payment method not found");
    externalMethodId = method.external_method_id;
  }

  const attemptNumber = billingNumber("PA");
  const attemptId = crypto.randomUUID();

  const { error: attemptError } = await db
    .from("payment_attempts")
    .insert({
      id: attemptId,
      organization_id: organizationId,
      attempt_number: attemptNumber,
      tenant_id: input.tenantId,
      lease_id: input.leaseId ?? list[0]?.lease_id ?? null,
      payment_method_id: paymentMethodId,
      provider: providerId,
      amount,
      currency: "usd",
      status: "processing",
      source: input.source ?? "one_time",
      charge_ids: input.chargeIds,
      created_by: userId
    })
    .select("*")
    .single();
  if (attemptError) throw new Error(attemptError.message);

  let providerRef;
  try {
    providerRef = await provider.createPaymentAttempt({
      organizationId,
      attemptId,
      attemptNumber,
      externalCustomerId: customer.external_customer_id,
      ...(externalMethodId ? { externalPaymentMethodId: externalMethodId } : {}),
      amountCents: toCents(amount),
      currency: "usd",
      description: `MPA payment ${attemptNumber}`,
      confirm: Boolean(externalMethodId),
      metadata: { chargeIds: input.chargeIds }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Provider error";
    await db
      .from("payment_attempts")
      .update({
        status: "awaiting_reconciliation",
        failure_message: message,
        retry_count: 1
      })
      .eq("id", attemptId);
    throw err;
  }

  const { data: updated, error: updateError } = await db
    .from("payment_attempts")
    .update({
      external_attempt_id: providerRef.externalAttemptId,
      status: providerRef.status,
      client_secret: providerRef.clientSecret ?? null,
      failure_code: providerRef.failureCode ?? null,
      failure_message: providerRef.failureMessage ?? null
    })
    .eq("id", attemptId)
    .select("*")
    .single();
  if (updateError) throw new Error(updateError.message);

  const attempt = mapAttempt(updated);
  await writeAudit(
    organizationId,
    "payment_attempt",
    attempt.id,
    "billing.payment.initiated",
    `Payment ${attempt.attemptNumber} initiated`,
    userId,
    { amount, provider: providerId },
    db
  );

  await appendLedger({
    organizationId,
    tenantId: input.tenantId,
    leaseId: attempt.leaseId,
    entryType: "payment_pending",
    amount,
    relatedEntityType: "payment_attempt",
    relatedEntityId: attempt.id,
    summary: `Payment ${attempt.attemptNumber} processing`,
    createdBy: userId,
    client: db
  });

  // Sandbox/noop: auto-settle when no live key by simulating webhook
  if (
    (providerId === "noop" || providerId === "stripe") &&
    providerRef.status === "processing" &&
    !process.env["STRIPE_SECRET_KEY"]
  ) {
    await applyProviderWebhook(
      providerId,
      {
        id: `auto-${attempt.attemptNumber}`,
        type: "succeeded",
        externalAttemptId: providerRef.externalAttemptId,
        amountCents: toCents(amount)
      },
      { "x-mpa-simulate": "1", "x-mpa-raw-body": "{}" }
    );
    const { data: settled } = await db.from("payment_attempts").select("*").eq("id", attemptId).single();
    return mapAttempt(settled);
  }

  return attempt;
}

async function applySucceededPayment(attempt: PaymentAttemptRecord, admin: BillingClient) {
  // Idempotent: if payment already linked, skip double-charge
  if (attempt.paymentId) return;

  const { data: existingPayment } = await admin
    .from("payments")
    .select("id")
    .eq("organization_id", attempt.organizationId)
    .contains("metadata", { paymentAttemptId: attempt.id })
    .maybeSingle();
  if (existingPayment) {
    await admin
      .from("payment_attempts")
      .update({ payment_id: existingPayment.id, status: "succeeded" })
      .eq("id", attempt.id);
    return;
  }

  const { data: attemptFresh } = await admin
    .from("payment_attempts")
    .select("created_by")
    .eq("id", attempt.id)
    .maybeSingle();
  const actorId = (attemptFresh?.created_by as string | null) ?? null;
  if (!actorId) {
    await admin
      .from("payment_attempts")
      .update({
        status: "awaiting_reconciliation",
        failure_message: "Missing created_by actor for payment insert"
      })
      .eq("id", attempt.id);
    throw new Error("Payment apply requires created_by actor");
  }

  const paymentNumber = generateFinancialNumber("PAY");
  const method =
    attempt.metadata["methodType"] === "ach"
      ? "ach"
      : attempt.provider === "stripe" || attempt.provider === "noop"
        ? "card"
        : "provider";

  let remaining = attempt.amount;
  const chargeIds = attempt.chargeIds;
  let firstPaymentId: string | null = null;

  for (const chargeId of chargeIds) {
    if (remaining <= 0) break;
    const { data: charge } = await admin
      .from("rent_charges")
      .select("*")
      .eq("id", chargeId)
      .eq("organization_id", attempt.organizationId)
      .maybeSingle();
    if (!charge) continue;
    const applyAmount = Math.min(remaining, Number(charge.outstanding_balance));
    if (applyAmount <= 0) continue;

    const paymentInsert = await admin
      .from("payments")
      .insert({
        organization_id: attempt.organizationId,
        payment_number: firstPaymentId ? `${paymentNumber}-${chargeIds.indexOf(chargeId)}` : paymentNumber,
        rent_charge_id: chargeId,
        lease_id: attempt.leaseId,
        tenant_id: attempt.tenantId,
        property_id: charge.property_id,
        unit_id: charge.unit_id,
        amount: applyAmount,
        payment_method: method,
        payment_date: new Date().toISOString().slice(0, 10),
        status: "completed",
        reference_note: attempt.attemptNumber,
        metadata: {
          paymentAttemptId: attempt.id,
          provider: attempt.provider,
          externalAttemptId: attempt.externalAttemptId
        },
        created_by: actorId
      })
      .select("id")
      .single();

    if (paymentInsert.error) {
      await admin
        .from("payment_attempts")
        .update({ status: "awaiting_reconciliation", failure_message: paymentInsert.error.message })
        .eq("id", attempt.id);
      throw new Error(paymentInsert.error.message);
    }
    if (!firstPaymentId) firstPaymentId = paymentInsert.data.id as string;

    const newPaid = Number(charge.amount_paid) + applyAmount;
    const newStatus = newPaid >= Number(charge.amount) - 0.001 ? "paid" : "partial";
    await admin
      .from("rent_charges")
      .update({ amount_paid: newPaid, status: newStatus })
      .eq("id", chargeId);

    remaining = Math.round((remaining - applyAmount) * 100) / 100;
  }

  await admin
    .from("payment_attempts")
    .update({
      status: "succeeded",
      payment_id: firstPaymentId,
      reconciled_at: new Date().toISOString(),
      failure_code: null,
      failure_message: null
    })
    .eq("id", attempt.id);

  await appendLedger({
    organizationId: attempt.organizationId,
    tenantId: attempt.tenantId,
    leaseId: attempt.leaseId,
    entryType: "payment",
    amount: attempt.amount,
    relatedEntityType: "payment_attempt",
    relatedEntityId: attempt.id,
    summary: `Payment ${attempt.attemptNumber} succeeded`,
    client: admin
  });

  const receipt = await issueReceipt(attempt, firstPaymentId, admin);

  await writeAudit(
    attempt.organizationId,
    "payment_attempt",
    attempt.id,
    "billing.payment.succeeded",
    `Payment ${attempt.attemptNumber} succeeded`,
    null,
    { paymentId: firstPaymentId, receiptId: receipt.id },
    admin
  );
}

async function issueReceipt(
  attempt: PaymentAttemptRecord,
  paymentId: string | null,
  admin: BillingClient
): Promise<PaymentReceiptRecord> {
  const receiptNumber = billingNumber("RCPT");
  const payload = {
    attemptNumber: attempt.attemptNumber,
    amount: attempt.amount,
    currency: attempt.currency,
    chargeIds: attempt.chargeIds,
    provider: attempt.provider,
    externalAttemptId: attempt.externalAttemptId,
    issuedAt: new Date().toISOString()
  };
  const hash = contentHash(payload);
  const { data, error } = await admin
    .from("payment_receipts")
    .insert({
      organization_id: attempt.organizationId,
      receipt_number: receiptNumber,
      payment_id: paymentId,
      payment_attempt_id: attempt.id,
      tenant_id: attempt.tenantId,
      lease_id: attempt.leaseId,
      amount: attempt.amount,
      currency: attempt.currency,
      method_summary: `${attempt.provider} payment`,
      content_hash: hash,
      payload: payload as Json
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const receipt = mapReceipt(data);

  await appendLedger({
    organizationId: attempt.organizationId,
    tenantId: attempt.tenantId,
    leaseId: attempt.leaseId,
    entryType: "receipt",
    amount: attempt.amount,
    relatedEntityType: "payment_receipt",
    relatedEntityId: receipt.id,
    summary: `Receipt ${receipt.receiptNumber} issued`,
    client: admin
  });

  await writeAudit(
    attempt.organizationId,
    "payment_receipt",
    receipt.id,
    "billing.receipt.issued",
    `Receipt ${receipt.receiptNumber}`,
    null,
    { hash },
    admin
  );

  return receipt;
}

export async function applyProviderWebhook(
  providerId: string,
  payload: unknown,
  headers: Record<string, string>
) {
  const provider = getPaymentProvider(providerId);
  const events = await provider.parseWebhook(payload, headers);
  const admin = await adminClient();
  const results = [];

  for (const event of events) {
    const { data: existing } = await admin
      .from("integrations_webhook_events")
      .select("id")
      .eq("provider", provider.id)
      .eq("external_event_id", event.externalEventId)
      .maybeSingle();
    if (existing) {
      results.push({ externalEventId: event.externalEventId, ignored: true, reason: "duplicate" });
      continue;
    }

    await admin.from("integrations_webhook_events").insert({
      provider: provider.id,
      external_event_id: event.externalEventId,
      organization_id: null,
      payload: { type: event.type, externalPaymentId: event.externalPaymentId } as Json,
      headers: {} as Json,
      status: "received"
    });

    if (!event.externalPaymentId || event.type === "ignored") {
      results.push({ externalEventId: event.externalEventId, ignored: true, reason: "no payment" });
      continue;
    }

    const { data: attemptRow } = await admin
      .from("payment_attempts")
      .select("*")
      .eq("provider", provider.id)
      .eq("external_attempt_id", event.externalPaymentId)
      .maybeSingle();

    if (!attemptRow) {
      results.push({ externalEventId: event.externalEventId, ignored: true, reason: "attempt not found" });
      continue;
    }

    const attempt = mapAttempt(attemptRow);

    try {
      if (event.type === "succeeded") {
        await applySucceededPayment(attempt, admin);
      } else if (event.type === "failed") {
        const code = event.failureCode ?? mapProviderFailureToCode(event.message);
        await admin
          .from("payment_attempts")
          .update({
            status: "failed",
            failure_code: code,
            failure_message: friendlyPaymentError(code)
          })
          .eq("id", attempt.id);
        await writeAudit(
          attempt.organizationId,
          "payment_attempt",
          attempt.id,
          "billing.payment.failed",
          `Payment ${attempt.attemptNumber} failed`,
          null,
          { code },
          admin
        );
      } else if (event.type === "requires_action") {
        await admin.from("payment_attempts").update({ status: "requires_action" }).eq("id", attempt.id);
      } else if (event.type === "processing") {
        await admin.from("payment_attempts").update({ status: "processing" }).eq("id", attempt.id);
      } else if (event.type === "refunded" || event.type === "partially_refunded") {
        await admin
          .from("payment_attempts")
          .update({ status: event.type === "refunded" ? "refunded" : "partially_refunded" })
          .eq("id", attempt.id);
        if (attempt.paymentId) {
          await admin
            .from("payments")
            .update({ status: event.type === "refunded" ? "refunded" : "partially_refunded" })
            .eq("id", attempt.paymentId);
        }
        await appendLedger({
          organizationId: attempt.organizationId,
          tenantId: attempt.tenantId,
          leaseId: attempt.leaseId,
          entryType: "refund",
          amount: event.amountCents != null ? fromCents(event.amountCents) : attempt.amount,
          relatedEntityType: "payment_attempt",
          relatedEntityId: attempt.id,
          summary: `Refund on ${attempt.attemptNumber}`,
          client: admin
        });
      }

      await admin
        .from("integrations_webhook_events")
        .update({ status: "processed", organization_id: attempt.organizationId })
        .eq("provider", provider.id)
        .eq("external_event_id", event.externalEventId);

      results.push({ externalEventId: event.externalEventId, applied: true, type: event.type });
    } catch (err) {
      await admin
        .from("payment_attempts")
        .update({
          status: "awaiting_reconciliation",
          failure_message: err instanceof Error ? err.message : "apply failed"
        })
        .eq("id", attempt.id);
      await admin
        .from("integrations_webhook_events")
        .update({ status: "failed" })
        .eq("provider", provider.id)
        .eq("external_event_id", event.externalEventId);
      results.push({
        externalEventId: event.externalEventId,
        awaitingReconciliation: true,
        error: err instanceof Error ? err.message : "apply failed"
      });
    }
  }

  return { results };
}

export async function reconcileAwaitingPayments(organizationId?: string) {
  const admin = await adminClient();
  let query = admin
    .from("payment_attempts")
    .select("*")
    .eq("status", "awaiting_reconciliation")
    .limit(50);
  if (organizationId) query = query.eq("organization_id", organizationId);
  const { data: rows } = await query;
  const results = [];

  for (const row of rows ?? []) {
    const attempt = mapAttempt(row);
    if (!attempt.externalAttemptId) continue;
    try {
      const provider = getPaymentProvider(attempt.provider);
      const status = await provider.getPaymentAttempt({
        externalAttemptId: attempt.externalAttemptId,
        status: "processing"
      });
      if (status.status === "succeeded") {
        await applySucceededPayment(attempt, admin);
        results.push({ id: attempt.id, reconciled: true });
      }
    } catch (err) {
      await admin
        .from("payment_attempts")
        .update({ retry_count: attempt.retryCount + 1 })
        .eq("id", attempt.id);
      results.push({
        id: attempt.id,
        reconciled: false,
        error: err instanceof Error ? err.message : "reconcile failed"
      });
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Credits / adjustments / refunds
// ---------------------------------------------------------------------------

export async function applyBillingAdjustment(
  organizationId: string,
  userId: string,
  input: {
    tenantId: string;
    leaseId?: string | null;
    rentChargeId?: string | null;
    adjustmentType: AdjustmentType;
    amount: number;
    reason: string;
  },
  client?: SupabaseClient<Database>
) {
  const db = await resolveClient(client);
  if (input.amount <= 0) throw new Error("Adjustment amount must be positive");

  const adjustmentNumber = billingNumber("ADJ");
  const { data, error } = await db
    .from("billing_adjustments")
    .insert({
      organization_id: organizationId,
      adjustment_number: adjustmentNumber,
      tenant_id: input.tenantId,
      lease_id: input.leaseId ?? null,
      rent_charge_id: input.rentChargeId ?? null,
      adjustment_type: input.adjustmentType,
      amount: input.amount,
      reason: input.reason,
      created_by: userId
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  if (input.rentChargeId && (input.adjustmentType === "credit" || input.adjustmentType === "waive")) {
    const { data: charge } = await db
      .from("rent_charges")
      .select("*")
      .eq("id", input.rentChargeId)
      .eq("organization_id", organizationId)
      .maybeSingle();
    if (charge) {
      if (input.adjustmentType === "waive") {
        await db
          .from("rent_charges")
          .update({ status: "waived", amount_paid: charge.amount, updated_by: userId })
          .eq("id", charge.id);
      } else {
        const newPaid = Math.min(Number(charge.amount), Number(charge.amount_paid) + input.amount);
        await db
          .from("rent_charges")
          .update({
            amount_paid: newPaid,
            status: newPaid >= Number(charge.amount) - 0.001 ? "paid" : "partial",
            updated_by: userId
          })
          .eq("id", charge.id);
      }
    }
  }

  await appendLedger({
    organizationId,
    tenantId: input.tenantId,
    leaseId: input.leaseId ?? null,
    entryType: input.adjustmentType === "credit" ? "credit" : input.adjustmentType === "waive" ? "waive" : "adjustment",
    amount: input.amount,
    relatedEntityType: "billing_adjustment",
    relatedEntityId: data.id,
    summary: `${input.adjustmentType}: ${input.reason}`,
    createdBy: userId,
    client: db
  });

  await writeAudit(
    organizationId,
    "billing_adjustment",
    data.id,
    `billing.${input.adjustmentType}.applied`,
    `${input.adjustmentType} ${adjustmentNumber}`,
    userId,
    { amount: input.amount, reason: input.reason },
    db
  );

  return data;
}

export async function refundPaymentAttempt(
  organizationId: string,
  userId: string,
  attemptId: string,
  amount?: number,
  reason?: string,
  client?: SupabaseClient<Database>
) {
  const db = await resolveClient(client);
  const { data: row } = await db
    .from("payment_attempts")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", attemptId)
    .maybeSingle();
  if (!row) throw new Error("Payment attempt not found");
  const attempt = mapAttempt(row);
  if (attempt.status !== "succeeded" && attempt.status !== "partially_refunded") {
    throw new Error("Only succeeded payments can be refunded");
  }
  if (!attempt.externalAttemptId) throw new Error("Missing provider reference");

  const provider = getPaymentProvider(attempt.provider);
  const refundAmount = amount ?? attempt.amount;
  const ref = await provider.refund({
    externalAttemptId: attempt.externalAttemptId,
    amountCents: toCents(refundAmount),
    ...(reason !== undefined ? { reason } : {})
  });

  await appendLedger({
    organizationId,
    tenantId: attempt.tenantId,
    leaseId: attempt.leaseId,
    entryType: "refund",
    amount: refundAmount,
    relatedEntityType: "payment_attempt",
    relatedEntityId: attempt.id,
    summary: `Refund ${ref.externalRefundId}`,
    createdBy: userId,
    client: db
  });

  await writeAudit(
    organizationId,
    "payment_attempt",
    attempt.id,
    "billing.refund.completed",
    `Refund $${refundAmount} on ${attempt.attemptNumber}`,
    userId,
    { externalRefundId: ref.externalRefundId, reason },
    db
  );

  return ref;
}

// ---------------------------------------------------------------------------
// Reads: resident dashboard, ledger, collections, ops
// ---------------------------------------------------------------------------

export async function getResidentPaymentDashboard(
  organizationId: string,
  tenantId: string,
  client?: SupabaseClient<Database>
): Promise<ResidentPaymentDashboard> {
  const db = await resolveClient(client);

  const { data: charges } = await db
    .from("rent_charges")
    .select("id, description, amount, outstanding_balance, due_date, status, lease_id")
    .eq("organization_id", organizationId)
    .eq("tenant_id", tenantId)
    .in("status", ["pending", "partial", "overdue", "draft"])
    .is("deleted_at", null)
    .order("due_date", { ascending: true })
    .limit(20);

  const { data: payments } = await db
    .from("payments")
    .select("id, amount, status, payment_date, payment_method")
    .eq("organization_id", organizationId)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("payment_date", { ascending: false })
    .limit(10);

  const { data: receipts } = await db
    .from("payment_receipts")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("tenant_id", tenantId)
    .order("issued_at", { ascending: false })
    .limit(10);

  const { data: methods } = await db
    .from("payment_methods")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("tenant_id", tenantId)
    .eq("status", "active");

  const { data: autopay } = await db
    .from("autopay_enrollments")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .maybeSingle();

  const { data: failed } = await db
    .from("payment_attempts")
    .select("id, failure_message")
    .eq("organization_id", organizationId)
    .eq("tenant_id", tenantId)
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(3);

  const upcoming = (charges ?? []).map(
    (c: {
      id: string;
      description: string;
      amount: number;
      outstanding_balance: number;
      due_date: string;
      status: string;
      lease_id: string | null;
    }) => ({
      id: c.id,
      description: c.description,
      amount: Number(c.amount),
      outstandingBalance: Number(c.outstanding_balance),
      dueDate: c.due_date,
      status: c.status,
      leaseId: c.lease_id
    })
  );

  const balanceDue = upcoming.reduce(
    (sum: number, charge: { outstandingBalance: number }) => sum + charge.outstandingBalance,
    0
  );
  const alerts: string[] = [];
  for (const f of failed ?? []) {
    alerts.push(f.failure_message ?? "A recent payment failed. Please retry.");
  }
  if (balanceDue > 0) alerts.push(`You have $${balanceDue.toFixed(2)} due.`);

  return {
    balanceDue,
    upcomingCharges: upcoming,
    recentPayments: (payments ?? []).map(
      (p: {
        id: string;
        amount: number;
        status: string;
        payment_date: string;
        payment_method: string;
      }) => ({
        id: p.id,
        amount: Number(p.amount),
        status: p.status,
        paymentDate: p.payment_date,
        paymentMethod: p.payment_method
      })
    ),
    receipts: (receipts ?? []).map(mapReceipt),
    methods: (methods ?? []).map(mapMethod),
    autopay: autopay ? mapAutopay(autopay) : null,
    alerts
  };
}

export async function getResidentLedger(
  organizationId: string,
  tenantId: string,
  client?: SupabaseClient<Database>
): Promise<BillingLedgerEntryRecord[]> {
  const db = await resolveClient(client);
  const { data, error } = await db
    .from("billing_ledger_entries")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapLedger);
}

export async function getCollectionsQueue(
  organizationId: string,
  client?: SupabaseClient<Database>
): Promise<CollectionsQueueItem[]> {
  const db = await resolveClient(client);
  const { data: overdue } = await db
    .from("rent_charges")
    .select("tenant_id, lease_id, property_id, outstanding_balance, status, tenants(first_name, last_name)")
    .eq("organization_id", organizationId)
    .in("status", ["overdue", "in_collections", "partial", "pending"])
    .gt("outstanding_balance", 0)
    .is("deleted_at", null);

  const byTenant = new Map<string, CollectionsQueueItem>();
  for (const row of overdue ?? []) {
    const tenantId = row.tenant_id as string;
    const tenants = row.tenants as { first_name?: string; last_name?: string } | null;
    const existing = byTenant.get(tenantId) ?? {
      tenantId,
      tenantName: tenants ? `${tenants.first_name ?? ""} ${tenants.last_name ?? ""}`.trim() : "Resident",
      leaseId: (row.lease_id as string | null) ?? null,
      propertyId: (row.property_id as string | null) ?? null,
      outstandingBalance: 0,
      overdueChargeCount: 0,
      failedAttemptCount: 0,
      status: row.status === "in_collections" ? "in_collections" : "overdue"
    };
    existing.outstandingBalance += Number(row.outstanding_balance);
    if (row.status === "overdue" || row.status === "in_collections") existing.overdueChargeCount += 1;
    byTenant.set(tenantId, existing as CollectionsQueueItem);
  }

  const { data: failed } = await db
    .from("payment_attempts")
    .select("tenant_id")
    .eq("organization_id", organizationId)
    .eq("status", "failed");
  for (const f of failed ?? []) {
    const item = byTenant.get(f.tenant_id);
    if (item) {
      item.failedAttemptCount += 1;
      if (item.status === "overdue") item.status = "failed_autopay";
    }
  }

  return Array.from(byTenant.values()).sort((a, b) => b.outstandingBalance - a.outstandingBalance);
}

export async function getBillingOpsSnapshot(
  organizationId: string,
  client?: SupabaseClient<Database>
): Promise<BillingOpsSnapshot> {
  const db = await resolveClient(client);
  const today = new Date().toISOString().slice(0, 10);
  const provider = resolveDefaultPaymentProviderId();

  const { data: todays } = await db
    .from("payments")
    .select("amount")
    .eq("organization_id", organizationId)
    .eq("payment_date", today)
    .eq("status", "completed")
    .is("deleted_at", null);

  const { count: failedCount } = await db
    .from("payment_attempts")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "failed");

  const { data: outstanding } = await db
    .from("rent_charges")
    .select("outstanding_balance")
    .eq("organization_id", organizationId)
    .gt("outstanding_balance", 0)
    .is("deleted_at", null);

  const { count: reconcileCount } = await db
    .from("payment_attempts")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "awaiting_reconciliation");

  const { count: activeAutopay } = await db
    .from("autopay_enrollments")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "active");

  const { count: activeLeases } = await db
    .from("leases")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "active");

  const collections = await getCollectionsQueue(organizationId, db);
  const todaysList = todays ?? [];
  const outstandingList = outstanding ?? [];
  const autopayPct =
    (activeLeases ?? 0) > 0 ? Math.round(((activeAutopay ?? 0) / (activeLeases ?? 1)) * 100) : 0;
  const awaiting = reconcileCount ?? 0;
  const processingHealth: BillingOpsSnapshot["processingHealth"] =
    awaiting > 10 ? "critical" : awaiting > 0 || (failedCount ?? 0) > 5 ? "degraded" : "healthy";

  return {
    todaysPaymentsCount: todaysList.length,
    todaysPaymentsAmount: todaysList.reduce((s: number, p: { amount: number }) => s + Number(p.amount), 0),
    failedPaymentsCount: failedCount ?? 0,
    outstandingBalance: outstandingList.reduce(
      (s: number, c: { outstanding_balance: number }) => s + Number(c.outstanding_balance),
      0
    ),
    upcomingLateFeesCount: collections.filter((c) => c.overdueChargeCount > 0).length,
    collectionsQueueCount: collections.length,
    autopayEnrollmentPercent: autopayPct,
    processingHealth,
    awaitingReconciliationCount: awaiting,
    provider
  };
}

export { friendlyPaymentError };
