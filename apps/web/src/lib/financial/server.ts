import { assertPaymentAgainstCharge, assertPaymentAmountValid } from "./events";
import { createAuthServerComponentClient } from "../auth/server";
import type { Json } from "@mpa/supabase";
import type {
  ChargeStatus,
  ChargeType,
  CreateExpenseInput,
  CreatePaymentInput,
  CreateRentChargeInput,
  ExpenseRecord,
  ExpenseStatus,
  FinancialActivityRecord,
  FinancialActivityType,
  GenerateOwnerStatementInput,
  OwnerStatementRecord,
  PaymentRecord,
  RentChargeRecord,
  StatementStatus
} from "./contracts";

type RentChargeRow = {
  id: string;
  organization_id: string;
  charge_number: string;
  lease_id: string;
  property_id: string;
  unit_id: string;
  tenant_id: string;
  charge_type: ChargeType;
  description: string;
  amount: number;
  amount_paid: number;
  outstanding_balance: number;
  due_date: string;
  period_start: string | null;
  period_end: string | null;
  status: ChargeStatus;
  late_status: RentChargeRecord["lateStatus"];
  metadata: Json | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  deleted_at: string | null;
};

type RentChargeRelationRow = RentChargeRow & {
  properties: { name: string } | null;
  units: { unit_number: string } | null;
  tenants: { first_name: string; last_name: string; preferred_name: string | null } | null;
};

type PaymentRow = {
  id: string;
  organization_id: string;
  payment_number: string;
  rent_charge_id: string | null;
  lease_id: string | null;
  property_id: string | null;
  unit_id: string | null;
  tenant_id: string | null;
  amount: number;
  payment_method: PaymentRecord["paymentMethod"];
  payment_date: string;
  status: PaymentRecord["status"];
  reference_note: string | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  deleted_at: string | null;
};

type ExpenseRow = {
  id: string;
  organization_id: string;
  expense_number: string;
  property_id: string;
  vendor_id: string | null;
  work_order_id: string | null;
  category: ExpenseRecord["category"];
  custom_category: string | null;
  description: string;
  amount: number;
  expense_date: string;
  status: ExpenseStatus;
  vendor_bill_placeholder: string | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  deleted_at: string | null;
};

type ExpenseRelationRow = ExpenseRow & {
  properties: { name: string } | null;
};

type OwnerStatementRow = {
  id: string;
  organization_id: string;
  statement_number: string;
  property_id: string;
  owner_placeholder: string | null;
  statement_period_start: string;
  statement_period_end: string;
  status: StatementStatus;
  total_income: number;
  total_expenses: number;
  net_income: number;
  occupancy_rate: number;
  maintenance_cost: number;
  outstanding_balances: number;
  generated_at: string | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  deleted_at: string | null;
};

type OwnerStatementRelationRow = OwnerStatementRow & {
  properties: { name: string } | null;
};

type FinancialActivityRow = {
  id: string;
  organization_id: string;
  activity_type: FinancialActivityType;
  entity_type: string;
  entity_id: string;
  lease_id: string | null;
  property_id: string | null;
  tenant_id: string | null;
  amount: number;
  balance_after: number | null;
  summary: string;
  payload: Json | null;
  created_by: string;
  created_at: string;
};

type LeaseContextRow = {
  id: string;
  property_id: string;
  unit_id: string;
  primary_tenant_id: string;
  status: string;
  start_date: string;
  move_in_date: string | null;
  rent_amount: number;
  security_deposit: number;
};

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;
type FinancialDbClient = {
  from: (table: string) => ReturnType<SupabaseClientType["from"]>;
  rpc: (fn: string, args: Record<string, unknown>) => ReturnType<SupabaseClientType["rpc"]>;
};

function financialDb(client: SupabaseClientType): FinancialDbClient {
  return client as unknown as FinancialDbClient;
}

const RENT_CHARGE_SELECT =
  "id, organization_id, charge_number, lease_id, property_id, unit_id, tenant_id, charge_type, description, amount, amount_paid, outstanding_balance, due_date, period_start, period_end, status, late_status, metadata, created_at, updated_at, archived_at, deleted_at";

const RENT_CHARGE_LIST_SELECT = `${RENT_CHARGE_SELECT}, properties(name), units(unit_number), tenants(first_name, last_name, preferred_name)`;

const PAYMENT_SELECT =
  "id, organization_id, payment_number, rent_charge_id, lease_id, property_id, unit_id, tenant_id, amount, payment_method, payment_date, status, reference_note, metadata, created_at, updated_at, archived_at, deleted_at";

const EXPENSE_SELECT =
  "id, organization_id, expense_number, property_id, vendor_id, work_order_id, category, custom_category, description, amount, expense_date, status, vendor_bill_placeholder, metadata, created_at, updated_at, archived_at, deleted_at";

const EXPENSE_LIST_SELECT = `${EXPENSE_SELECT}, properties(name)`;

const OWNER_STATEMENT_SELECT =
  "id, organization_id, statement_number, property_id, owner_placeholder, statement_period_start, statement_period_end, status, total_income, total_expenses, net_income, occupancy_rate, maintenance_cost, outstanding_balances, generated_at, metadata, created_at, updated_at, archived_at, deleted_at";

const OWNER_STATEMENT_LIST_SELECT = `${OWNER_STATEMENT_SELECT}, properties(name)`;

const MAINTENANCE_EXPENSE_CATEGORIES = new Set(["maintenance", "repairs", "vendor_bill"]);

export type RentChargeListItem = RentChargeRecord & {
  propertyName: string | null;
  unitNumber: string | null;
  tenantName: string | null;
};

export type ExpenseListItem = ExpenseRecord & {
  propertyName: string | null;
};

export type OwnerStatementListItem = OwnerStatementRecord & {
  propertyName: string | null;
};

export type RentChargeListOptions = {
  search?: string;
  status?: ChargeStatus | "all";
  propertyId?: string;
  leaseId?: string;
  tenantId?: string;
  dueOnOrBefore?: string;
  limit?: number;
  offset?: number;
};

export type PaymentListOptions = {
  search?: string;
  status?: PaymentRecord["status"] | "all";
  propertyId?: string;
  leaseId?: string;
  tenantId?: string;
  limit?: number;
  offset?: number;
};

export type ExpenseListOptions = {
  search?: string;
  status?: ExpenseStatus | "all";
  category?: ExpenseRecord["category"] | "all";
  propertyId?: string;
  limit?: number;
  offset?: number;
};

export type OwnerStatementListOptions = {
  search?: string;
  status?: StatementStatus | "all";
  propertyId?: string;
  limit?: number;
  offset?: number;
};

export type FinancialDashboardMetrics = {
  rentDueToday: number;
  lateRentCount: number;
  outstandingBalancesTotal: number;
  recentPayments: PaymentRecord[];
  recentExpenses: ExpenseRecord[];
  ownerStatementStatusCounts: Record<StatementStatus, number>;
};

export type PropertyFinancialSummary = {
  propertyId: string;
  collectedRent: number;
  outstandingBalance: number;
  latePaymentsCount: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  noi: number;
};

export async function getRentChargesForOrganization(
  organizationId: string,
  options: RentChargeListOptions = {},
  client?: FinancialDbClient | SupabaseClientType
): Promise<RentChargeListItem[]> {
  const db = await resolveClient(client);
  let query = db
    .from("rent_charges")
    .select(RENT_CHARGE_LIST_SELECT)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("due_date", { ascending: false });

  if (options.status && options.status !== "all") query = query.eq("status", options.status);
  if (options.propertyId) query = query.eq("property_id", options.propertyId);
  if (options.leaseId) query = query.eq("lease_id", options.leaseId);
  if (options.tenantId) query = query.eq("tenant_id", options.tenantId);
  if (options.dueOnOrBefore) query = query.lte("due_date", options.dueOnOrBefore);

  const search = options.search?.trim();
  if (search) {
    const escaped = escapeLike(search);
    query = query.or(`charge_number.ilike.%${escaped}%,description.ilike.%${escaped}%`);
  }

  if (options.limit !== undefined) {
    const from = options.offset ?? 0;
    query = query.range(from, from + options.limit - 1);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as RentChargeRelationRow[]).map(toRentChargeListItem);
}

export async function getRentChargeForOrganization(
  organizationId: string,
  chargeId: string,
  client?: FinancialDbClient | SupabaseClientType
): Promise<RentChargeListItem | null> {
  const db = await resolveClient(client);
  const { data, error } = await db
    .from("rent_charges")
    .select(RENT_CHARGE_LIST_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", chargeId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toRentChargeListItem(data as RentChargeRelationRow) : null;
}

export async function createRentCharge(
  organizationId: string,
  userId: string,
  input: CreateRentChargeInput,
  client?: FinancialDbClient | SupabaseClientType
): Promise<RentChargeRecord> {
  const db = await resolveClient(client);
  const lease = await getLeaseContext(organizationId, input.leaseId, db);
  if (!lease) throw new Error("Lease not found in organization.");

  const chargeNumber = generateFinancialNumber("RC");
  const chargeType = input.chargeType ?? "custom";
  const period = input.periodStart && input.periodEnd ? null : monthPeriodFromDate(input.dueDate);

  const { data, error } = await db
    .from("rent_charges")
    .insert({
      organization_id: organizationId,
      charge_number: chargeNumber,
      lease_id: lease.id,
      property_id: lease.property_id,
      unit_id: lease.unit_id,
      tenant_id: lease.primary_tenant_id,
      charge_type: chargeType,
      description: input.description,
      amount: input.amount,
      due_date: input.dueDate,
      period_start: input.periodStart ?? period?.periodStart ?? null,
      period_end: input.periodEnd ?? period?.periodEnd ?? null,
      created_by: userId,
      updated_by: userId
    })
    .select(RENT_CHARGE_SELECT)
    .single();

  if (error) throw new Error(error.message);
  const charge = toRentChargeRecord(data as RentChargeRow);

  await recordFinancialActivity(
    organizationId,
    userId,
    "charge_created",
    "rent_charge",
    charge.id,
    {
      leaseId: charge.leaseId,
      propertyId: charge.propertyId,
      tenantId: charge.tenantId,
      amount: charge.amount,
      balanceAfter: charge.outstandingBalance,
      summary: `Charge ${charge.chargeNumber} created`,
      payload: { chargeType: charge.chargeType, dueDate: charge.dueDate }
    },
    db
  );

  return charge;
}

export async function generateRentChargesForActiveLease(
  organizationId: string,
  leaseId: string,
  userId: string,
  client?: FinancialDbClient | SupabaseClientType
): Promise<RentChargeRecord[]> {
  const db = await resolveClient(client);
  const lease = await getLeaseContext(organizationId, leaseId, db);
  if (!lease) throw new Error("Lease not found in organization.");
  if (lease.status !== "active") throw new Error("Rent charges can only be generated for active leases.");

  const dueDate = lease.move_in_date ?? lease.start_date;
  const period = monthPeriodFromDate(dueDate);
  const created: RentChargeRecord[] = [];

  const { data: existingCharges } = await db
    .from("rent_charges")
    .select("charge_type")
    .eq("organization_id", organizationId)
    .eq("lease_id", leaseId)
    .is("deleted_at", null)
    .in("charge_type", ["monthly_rent", "security_deposit"]);

  const existingTypes = new Set(((existingCharges ?? []) as Array<{ charge_type: ChargeType }>).map((row) => row.charge_type));

  if (!existingTypes.has("monthly_rent") && lease.rent_amount > 0) {
    created.push(
      await createRentCharge(
        organizationId,
        userId,
        {
          leaseId,
          chargeType: "monthly_rent",
          description: "Monthly rent",
          amount: Number(lease.rent_amount),
          dueDate,
          periodStart: period.periodStart,
          periodEnd: period.periodEnd
        },
        db
      )
    );
  }

  if (!existingTypes.has("security_deposit") && Number(lease.security_deposit) > 0) {
    created.push(
      await createRentCharge(
        organizationId,
        userId,
        {
          leaseId,
          chargeType: "security_deposit",
          description: "Security deposit",
          amount: Number(lease.security_deposit),
          dueDate
        },
        db
      )
    );
  }

  return created;
}

export async function recordPayment(
  organizationId: string,
  userId: string,
  input: CreatePaymentInput,
  client?: FinancialDbClient | SupabaseClientType
): Promise<PaymentRecord> {
  const db = await resolveClient(client);
  assertPaymentAmountValid(input.amount);

  let charge: RentChargeRecord | null = null;
  if (input.rentChargeId) {
    const row = await getRentChargeForOrganization(organizationId, input.rentChargeId, db);
    if (!row) throw new Error("Rent charge not found.");
    charge = row;
    assertPaymentAgainstCharge(charge, input.amount);
  }

  const paymentNumber = generateFinancialNumber("PAY");
  const paymentDate = input.paymentDate ?? todayIsoDate();

  const { data, error } = await db
    .from("payments")
    .insert({
      organization_id: organizationId,
      payment_number: paymentNumber,
      rent_charge_id: input.rentChargeId ?? charge?.id ?? null,
      lease_id: input.leaseId ?? charge?.leaseId ?? null,
      property_id: input.propertyId ?? charge?.propertyId ?? null,
      unit_id: input.unitId ?? charge?.unitId ?? null,
      tenant_id: input.tenantId ?? charge?.tenantId ?? null,
      amount: input.amount,
      payment_method: input.paymentMethod ?? "manual",
      payment_date: paymentDate,
      status: "completed",
      reference_note: input.referenceNote ?? null,
      created_by: userId,
      updated_by: userId
    })
    .select(PAYMENT_SELECT)
    .single();

  if (error) throw new Error(error.message);
  const payment = toPaymentRecord(data as PaymentRow);

  let balanceAfter: number | null = null;
  if (charge) {
    const nextAmountPaid = charge.amountPaid + input.amount;
    const { data: updatedCharge, error: chargeError } = await db
      .from("rent_charges")
      .update({ amount_paid: nextAmountPaid, updated_by: userId })
      .eq("organization_id", organizationId)
      .eq("id", charge.id)
      .select(RENT_CHARGE_SELECT)
      .single();
    if (chargeError) throw new Error(chargeError.message);
    balanceAfter = toRentChargeRecord(updatedCharge as RentChargeRow).outstandingBalance;
  }

  await recordFinancialActivity(
    organizationId,
    userId,
    "payment_received",
    "payment",
    payment.id,
    {
      leaseId: payment.leaseId,
      propertyId: payment.propertyId,
      tenantId: payment.tenantId,
      amount: payment.amount,
      balanceAfter,
      summary: `Payment ${payment.paymentNumber} recorded`,
      payload: { rentChargeId: payment.rentChargeId, paymentMethod: payment.paymentMethod }
    },
    db
  );

  return payment;
}

export async function getPaymentsForOrganization(
  organizationId: string,
  options: PaymentListOptions = {},
  client?: FinancialDbClient | SupabaseClientType
): Promise<PaymentRecord[]> {
  const db = await resolveClient(client);
  let query = db
    .from("payments")
    .select(PAYMENT_SELECT)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("payment_date", { ascending: false });

  if (options.status && options.status !== "all") query = query.eq("status", options.status);
  if (options.propertyId) query = query.eq("property_id", options.propertyId);
  if (options.leaseId) query = query.eq("lease_id", options.leaseId);
  if (options.tenantId) query = query.eq("tenant_id", options.tenantId);

  const search = options.search?.trim();
  if (search) {
    const escaped = escapeLike(search);
    query = query.or(`payment_number.ilike.%${escaped}%,reference_note.ilike.%${escaped}%`);
  }

  if (options.limit !== undefined) {
    const from = options.offset ?? 0;
    query = query.range(from, from + options.limit - 1);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as PaymentRow[]).map(toPaymentRecord);
}

export async function createExpense(
  organizationId: string,
  userId: string,
  input: CreateExpenseInput,
  client?: FinancialDbClient | SupabaseClientType
): Promise<ExpenseRecord> {
  const db = await resolveClient(client);
  const expenseNumber = generateFinancialNumber("EXP");
  const expenseDate = input.expenseDate ?? todayIsoDate();

  const { data, error } = await db
    .from("expenses")
    .insert({
      organization_id: organizationId,
      expense_number: expenseNumber,
      property_id: input.propertyId,
      vendor_id: input.vendorId ?? null,
      work_order_id: input.workOrderId ?? null,
      category: input.category ?? "maintenance",
      custom_category: input.customCategory ?? null,
      description: input.description,
      amount: input.amount,
      expense_date: expenseDate,
      status: input.status ?? "pending",
      vendor_bill_placeholder: input.vendorBillPlaceholder ?? null,
      created_by: userId,
      updated_by: userId
    })
    .select(EXPENSE_SELECT)
    .single();

  if (error) throw new Error(error.message);
  const expense = toExpenseRecord(data as ExpenseRow);

  await recordFinancialActivity(
    organizationId,
    userId,
    "expense_recorded",
    "expense",
    expense.id,
    {
      propertyId: expense.propertyId,
      amount: expense.amount,
      summary: `Expense ${expense.expenseNumber} recorded`,
      payload: { category: expense.category, status: expense.status }
    },
    db
  );

  return expense;
}

export async function getExpensesForOrganization(
  organizationId: string,
  options: ExpenseListOptions = {},
  client?: FinancialDbClient | SupabaseClientType
): Promise<ExpenseListItem[]> {
  const db = await resolveClient(client);
  let query = db
    .from("expenses")
    .select(EXPENSE_LIST_SELECT)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("expense_date", { ascending: false });

  if (options.status && options.status !== "all") query = query.eq("status", options.status);
  if (options.category && options.category !== "all") query = query.eq("category", options.category);
  if (options.propertyId) query = query.eq("property_id", options.propertyId);

  const search = options.search?.trim();
  if (search) {
    const escaped = escapeLike(search);
    query = query.or(`expense_number.ilike.%${escaped}%,description.ilike.%${escaped}%`);
  }

  if (options.limit !== undefined) {
    const from = options.offset ?? 0;
    query = query.range(from, from + options.limit - 1);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as ExpenseRelationRow[]).map(toExpenseListItem);
}

export async function getExpenseForOrganization(
  organizationId: string,
  expenseId: string,
  client?: FinancialDbClient | SupabaseClientType
): Promise<ExpenseListItem | null> {
  const db = await resolveClient(client);
  const { data, error } = await db
    .from("expenses")
    .select(EXPENSE_LIST_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", expenseId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toExpenseListItem(data as ExpenseRelationRow) : null;
}

export async function generateOwnerStatement(
  organizationId: string,
  userId: string,
  input: GenerateOwnerStatementInput,
  client?: FinancialDbClient | SupabaseClientType
): Promise<OwnerStatementRecord> {
  const db = await resolveClient(client);
  const aggregates = await aggregatePropertyFinancials(
    organizationId,
    input.propertyId,
    input.statementPeriodStart,
    input.statementPeriodEnd,
    db
  );

  const statementNumber = generateFinancialNumber("STMT");
  const now = new Date().toISOString();

  const { data, error } = await db
    .from("owner_statements")
    .insert({
      organization_id: organizationId,
      statement_number: statementNumber,
      property_id: input.propertyId,
      owner_placeholder: input.ownerPlaceholder ?? null,
      statement_period_start: input.statementPeriodStart,
      statement_period_end: input.statementPeriodEnd,
      status: "generated",
      total_income: aggregates.totalIncome,
      total_expenses: aggregates.totalExpenses,
      net_income: aggregates.totalIncome - aggregates.totalExpenses,
      occupancy_rate: aggregates.occupancyRate,
      maintenance_cost: aggregates.maintenanceCost,
      outstanding_balances: aggregates.outstandingBalances,
      generated_at: now,
      created_by: userId,
      updated_by: userId
    })
    .select(OWNER_STATEMENT_SELECT)
    .single();

  if (error) throw new Error(error.message);
  const statement = toOwnerStatementRecord(data as OwnerStatementRow);

  await recordFinancialActivity(
    organizationId,
    userId,
    "statement_generated",
    "owner_statement",
    statement.id,
    {
      propertyId: statement.propertyId,
      amount: statement.netIncome,
      summary: `Owner statement ${statement.statementNumber} generated`,
      payload: {
        periodStart: statement.statementPeriodStart,
        periodEnd: statement.statementPeriodEnd,
        totalIncome: statement.totalIncome,
        totalExpenses: statement.totalExpenses
      }
    },
    db
  );

  return statement;
}

export async function getOwnerStatementsForOrganization(
  organizationId: string,
  options: OwnerStatementListOptions = {},
  client?: FinancialDbClient | SupabaseClientType
): Promise<OwnerStatementListItem[]> {
  const db = await resolveClient(client);
  let query = db
    .from("owner_statements")
    .select(OWNER_STATEMENT_LIST_SELECT)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("statement_period_end", { ascending: false });

  if (options.status && options.status !== "all") query = query.eq("status", options.status);
  if (options.propertyId) query = query.eq("property_id", options.propertyId);

  const search = options.search?.trim();
  if (search) {
    const escaped = escapeLike(search);
    query = query.or(`statement_number.ilike.%${escaped}%,owner_placeholder.ilike.%${escaped}%`);
  }

  if (options.limit !== undefined) {
    const from = options.offset ?? 0;
    query = query.range(from, from + options.limit - 1);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as OwnerStatementRelationRow[]).map(toOwnerStatementListItem);
}

export async function getOwnerStatementForOrganization(
  organizationId: string,
  statementId: string,
  client?: FinancialDbClient | SupabaseClientType
): Promise<OwnerStatementListItem | null> {
  const db = await resolveClient(client);
  const { data, error } = await db
    .from("owner_statements")
    .select(OWNER_STATEMENT_LIST_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", statementId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toOwnerStatementListItem(data as OwnerStatementRelationRow) : null;
}

export async function recordFinancialActivity(
  organizationId: string,
  userId: string,
  activityType: FinancialActivityType,
  entityType: string,
  entityId: string,
  options: {
    leaseId?: string | null;
    propertyId?: string | null;
    tenantId?: string | null;
    amount?: number;
    balanceAfter?: number | null;
    summary: string;
    payload?: Record<string, unknown>;
  },
  client?: FinancialDbClient | SupabaseClientType
): Promise<FinancialActivityRecord> {
  const db = await resolveClient(client);
  const { data, error } = await db
    .from("financial_activity")
    .insert({
      organization_id: organizationId,
      activity_type: activityType,
      entity_type: entityType,
      entity_id: entityId,
      lease_id: options.leaseId ?? null,
      property_id: options.propertyId ?? null,
      tenant_id: options.tenantId ?? null,
      amount: options.amount ?? 0,
      balance_after: options.balanceAfter ?? null,
      summary: options.summary,
      payload: (options.payload ?? {}) as Json,
      created_by: userId
    })
    .select(
      "id, organization_id, activity_type, entity_type, entity_id, lease_id, property_id, tenant_id, amount, balance_after, summary, payload, created_by, created_at"
    )
    .single();

  if (error) throw new Error(error.message);
  return toFinancialActivityRecord(data as FinancialActivityRow);
}

export async function getFinancialActivityForOrganization(
  organizationId: string,
  options: { limit?: number } = {},
  client?: FinancialDbClient | SupabaseClientType
): Promise<FinancialActivityRecord[]> {
  const db = await resolveClient(client);
  let query = db
    .from("financial_activity")
    .select(
      "id, organization_id, activity_type, entity_type, entity_id, lease_id, property_id, tenant_id, amount, balance_after, summary, payload, created_by, created_at"
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (options.limit !== undefined) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as FinancialActivityRow[]).map(toFinancialActivityRecord);
}

export async function getFinancialDashboardMetrics(
  organizationId: string,
  client?: FinancialDbClient | SupabaseClientType
): Promise<FinancialDashboardMetrics> {
  const db = await resolveClient(client);
  const today = todayIsoDate();

  const [
    { count: rentDueToday, error: dueTodayError },
    { count: lateRentCount, error: lateError },
    { data: outstandingRows, error: outstandingError },
    { data: paymentRows, error: paymentsError },
    { data: expenseRows, error: expensesError },
    { data: statementRows, error: statementsError }
  ] = await Promise.all([
    db
      .from("rent_charges")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("due_date", today)
      .gt("outstanding_balance", 0)
      .is("deleted_at", null),
    db
      .from("rent_charges")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .in("late_status", ["late", "severe"])
      .gt("outstanding_balance", 0)
      .is("deleted_at", null),
    db
      .from("rent_charges")
      .select("outstanding_balance")
      .eq("organization_id", organizationId)
      .gt("outstanding_balance", 0)
      .is("deleted_at", null),
    db
      .from("payments")
      .select(PAYMENT_SELECT)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("payment_date", { ascending: false })
      .limit(5),
    db
      .from("expenses")
      .select(EXPENSE_SELECT)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("expense_date", { ascending: false })
      .limit(5),
    db
      .from("owner_statements")
      .select("status")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
  ]);

  for (const error of [dueTodayError, lateError, outstandingError, paymentsError, expensesError, statementsError]) {
    if (error) throw new Error(error.message);
  }

  const outstandingBalancesTotal = ((outstandingRows ?? []) as Array<{ outstanding_balance: number }>).reduce(
    (sum, row) => sum + Number(row.outstanding_balance),
    0
  );

  const ownerStatementStatusCounts: Record<StatementStatus, number> = {
    draft: 0,
    generated: 0,
    sent: 0,
    archived: 0
  };
  for (const row of (statementRows ?? []) as Array<{ status: StatementStatus }>) {
    ownerStatementStatusCounts[row.status] += 1;
  }

  return {
    rentDueToday: rentDueToday ?? 0,
    lateRentCount: lateRentCount ?? 0,
    outstandingBalancesTotal,
    recentPayments: ((paymentRows ?? []) as PaymentRow[]).map(toPaymentRecord),
    recentExpenses: ((expenseRows ?? []) as ExpenseRow[]).map(toExpenseRecord),
    ownerStatementStatusCounts
  };
}

export async function getPropertyFinancialSummary(
  organizationId: string,
  propertyId: string,
  client?: FinancialDbClient | SupabaseClientType
): Promise<PropertyFinancialSummary> {
  const db = await resolveClient(client);
  const { periodStart, periodEnd } = currentMonthPeriod();

  const [
    { data: chargeRows, error: chargesError },
    { data: paymentRows, error: paymentsError },
    { data: expenseRows, error: expensesError }
  ] = await Promise.all([
    db
      .from("rent_charges")
      .select("amount_paid, outstanding_balance, late_status")
      .eq("organization_id", organizationId)
      .eq("property_id", propertyId)
      .is("deleted_at", null),
    db
      .from("payments")
      .select("amount")
      .eq("organization_id", organizationId)
      .eq("property_id", propertyId)
      .eq("status", "completed")
      .gte("payment_date", periodStart)
      .lte("payment_date", periodEnd)
      .is("deleted_at", null),
    db
      .from("expenses")
      .select("amount")
      .eq("organization_id", organizationId)
      .eq("property_id", propertyId)
      .gte("expense_date", periodStart)
      .lte("expense_date", periodEnd)
      .is("deleted_at", null)
  ]);

  for (const error of [chargesError, paymentsError, expensesError]) {
    if (error) throw new Error(error.message);
  }

  const charges = (chargeRows ?? []) as Array<{
    amount_paid: number;
    outstanding_balance: number;
    late_status: RentChargeRecord["lateStatus"];
  }>;

  const collectedRent = charges.reduce((sum, row) => sum + Number(row.amount_paid), 0);
  const outstandingBalance = charges.reduce((sum, row) => sum + Number(row.outstanding_balance), 0);
  const latePaymentsCount = charges.filter((row) => row.late_status === "late" || row.late_status === "severe").length;
  const monthlyIncome = ((paymentRows ?? []) as Array<{ amount: number }>).reduce((sum, row) => sum + Number(row.amount), 0);
  const monthlyExpenses = ((expenseRows ?? []) as Array<{ amount: number }>).reduce((sum, row) => sum + Number(row.amount), 0);

  return {
    propertyId,
    collectedRent,
    outstandingBalance,
    latePaymentsCount,
    monthlyIncome,
    monthlyExpenses,
    noi: monthlyIncome - monthlyExpenses
  };
}

export function generateFinancialNumber(prefix: "RC" | "PAY" | "EXP" | "STMT"): string {
  const date = todayIsoDate().replace(/-/g, "");
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 6);
  return `${prefix}-${date}-${random}`;
}

async function aggregatePropertyFinancials(
  organizationId: string,
  propertyId: string,
  periodStart: string,
  periodEnd: string,
  client: FinancialDbClient
) {
  const [
    { data: paymentRows, error: paymentsError },
    { data: expenseRows, error: expensesError },
    { data: chargeRows, error: chargesError },
    { count: activeLeases, error: activeLeasesError },
    { count: totalUnits, error: unitsError }
  ] = await Promise.all([
    client
      .from("payments")
      .select("amount")
      .eq("organization_id", organizationId)
      .eq("property_id", propertyId)
      .eq("status", "completed")
      .gte("payment_date", periodStart)
      .lte("payment_date", periodEnd)
      .is("deleted_at", null),
    client
      .from("expenses")
      .select("amount, category")
      .eq("organization_id", organizationId)
      .eq("property_id", propertyId)
      .gte("expense_date", periodStart)
      .lte("expense_date", periodEnd)
      .is("deleted_at", null),
    client
      .from("rent_charges")
      .select("outstanding_balance")
      .eq("organization_id", organizationId)
      .eq("property_id", propertyId)
      .gt("outstanding_balance", 0)
      .is("deleted_at", null),
    client
      .from("leases")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("property_id", propertyId)
      .eq("status", "active")
      .is("deleted_at", null),
    client
      .from("units")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("property_id", propertyId)
      .is("deleted_at", null)
  ]);

  for (const error of [paymentsError, expensesError, chargesError, activeLeasesError, unitsError]) {
    if (error) throw new Error(error.message);
  }

  const totalIncome = ((paymentRows ?? []) as Array<{ amount: number }>).reduce((sum, row) => sum + Number(row.amount), 0);
  const expenses = (expenseRows ?? []) as Array<{ amount: number; category: ExpenseRecord["category"] }>;
  const totalExpenses = expenses.reduce((sum, row) => sum + Number(row.amount), 0);
  const maintenanceCost = expenses
    .filter((row) => MAINTENANCE_EXPENSE_CATEGORIES.has(row.category))
    .reduce((sum, row) => sum + Number(row.amount), 0);
  const outstandingBalances = ((chargeRows ?? []) as Array<{ outstanding_balance: number }>).reduce(
    (sum, row) => sum + Number(row.outstanding_balance),
    0
  );
  const occupancyRate =
    (totalUnits ?? 0) > 0 ? Math.round(((activeLeases ?? 0) / (totalUnits ?? 1)) * 10000) / 100 : 0;

  return { totalIncome, totalExpenses, maintenanceCost, outstandingBalances, occupancyRate };
}

async function getLeaseContext(
  organizationId: string,
  leaseId: string,
  client: FinancialDbClient
): Promise<LeaseContextRow | null> {
  const { data, error } = await client
    .from("leases")
    .select("id, property_id, unit_id, primary_tenant_id, status, start_date, move_in_date, rent_amount, security_deposit")
    .eq("organization_id", organizationId)
    .eq("id", leaseId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as LeaseContextRow | null) ?? null;
}

function toRentChargeRecord(row: RentChargeRow): RentChargeRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    chargeNumber: row.charge_number,
    leaseId: row.lease_id,
    propertyId: row.property_id,
    unitId: row.unit_id,
    tenantId: row.tenant_id,
    chargeType: row.charge_type,
    description: row.description,
    amount: Number(row.amount),
    amountPaid: Number(row.amount_paid),
    outstandingBalance: Number(row.outstanding_balance),
    dueDate: row.due_date,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    status: row.status,
    lateStatus: row.late_status,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    deletedAt: row.deleted_at
  };
}

function toRentChargeListItem(row: RentChargeRelationRow): RentChargeListItem {
  const tenant = row.tenants;
  const tenantName = tenant
    ? tenant.preferred_name || `${tenant.first_name} ${tenant.last_name}`.trim()
    : null;
  return {
    ...toRentChargeRecord(row),
    propertyName: row.properties?.name ?? null,
    unitNumber: row.units?.unit_number ?? null,
    tenantName
  };
}

function toPaymentRecord(row: PaymentRow): PaymentRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    paymentNumber: row.payment_number,
    rentChargeId: row.rent_charge_id,
    leaseId: row.lease_id,
    propertyId: row.property_id,
    unitId: row.unit_id,
    tenantId: row.tenant_id,
    amount: Number(row.amount),
    paymentMethod: row.payment_method,
    paymentDate: row.payment_date,
    status: row.status,
    referenceNote: row.reference_note,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    deletedAt: row.deleted_at
  };
}

function toExpenseRecord(row: ExpenseRow): ExpenseRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    expenseNumber: row.expense_number,
    propertyId: row.property_id,
    vendorId: row.vendor_id,
    workOrderId: row.work_order_id,
    category: row.category,
    customCategory: row.custom_category,
    description: row.description,
    amount: Number(row.amount),
    expenseDate: row.expense_date,
    status: row.status,
    vendorBillPlaceholder: row.vendor_bill_placeholder,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    deletedAt: row.deleted_at
  };
}

function toExpenseListItem(row: ExpenseRelationRow): ExpenseListItem {
  return {
    ...toExpenseRecord(row),
    propertyName: row.properties?.name ?? null
  };
}

function toOwnerStatementRecord(row: OwnerStatementRow): OwnerStatementRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    statementNumber: row.statement_number,
    propertyId: row.property_id,
    ownerPlaceholder: row.owner_placeholder,
    statementPeriodStart: row.statement_period_start,
    statementPeriodEnd: row.statement_period_end,
    status: row.status,
    totalIncome: Number(row.total_income),
    totalExpenses: Number(row.total_expenses),
    netIncome: Number(row.net_income),
    occupancyRate: Number(row.occupancy_rate),
    maintenanceCost: Number(row.maintenance_cost),
    outstandingBalances: Number(row.outstanding_balances),
    generatedAt: row.generated_at,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    deletedAt: row.deleted_at
  };
}

function toOwnerStatementListItem(row: OwnerStatementRelationRow): OwnerStatementListItem {
  return {
    ...toOwnerStatementRecord(row),
    propertyName: row.properties?.name ?? null
  };
}

function toFinancialActivityRecord(row: FinancialActivityRow): FinancialActivityRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    activityType: row.activity_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    leaseId: row.lease_id,
    propertyId: row.property_id,
    tenantId: row.tenant_id,
    amount: Number(row.amount),
    balanceAfter: row.balance_after === null ? null : Number(row.balance_after),
    summary: row.summary,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    createdBy: row.created_by,
    createdAt: row.created_at
  };
}

function monthPeriodFromDate(isoDate: string): { periodStart: string; periodEnd: string } {
  const [year, month] = isoDate.split("-");
  const lastDay = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
  return {
    periodStart: `${year}-${month}-01`,
    periodEnd: `${year}-${month}-${String(lastDay).padStart(2, "0")}`
  };
}

function currentMonthPeriod(): { periodStart: string; periodEnd: string } {
  return monthPeriodFromDate(todayIsoDate());
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

async function resolveClient(client?: FinancialDbClient | SupabaseClientType): Promise<FinancialDbClient> {
  if (client && typeof client === "object" && "from" in client && !("auth" in client)) {
    return client as FinancialDbClient;
  }
  const supabase = (client as SupabaseClientType | undefined) ?? (await createAuthServerComponentClient());
  return financialDb(supabase);
}
