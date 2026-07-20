export const CHARGE_TYPES = [
  "monthly_rent",
  "custom",
  "security_deposit",
  "late_fee",
  "adjustment",
  "credit",
  "other"
] as const;
export const CHARGE_STATUSES = [
  "draft",
  "pending",
  "partial",
  "paid",
  "overdue",
  "waived",
  "cancelled",
  "in_collections"
] as const;
export const LATE_STATUSES = ["none", "grace_period", "late", "severe"] as const;
export const PAYMENT_METHODS = [
  "manual",
  "check",
  "cash",
  "ach_placeholder",
  "card_placeholder",
  "ach",
  "card",
  "debit",
  "stripe",
  "provider"
] as const;
export const PAYMENT_STATUSES = [
  "pending",
  "processing",
  "requires_action",
  "completed",
  "failed",
  "refunded",
  "partially_refunded",
  "canceled",
  "awaiting_reconciliation"
] as const;
export const EXPENSE_CATEGORIES = [
  "maintenance",
  "vendor_bill",
  "utilities",
  "insurance",
  "taxes",
  "repairs",
  "capital_improvement",
  "custom"
] as const;
export const EXPENSE_STATUSES = ["pending", "approved", "paid", "archived"] as const;
export const STATEMENT_STATUSES = ["draft", "generated", "sent", "archived"] as const;
export const FINANCIAL_ACTIVITY_TYPES = [
  "charge_created",
  "charge_published",
  "payment_received",
  "payment_failed",
  "payment_initiated",
  "late_fee_applied",
  "expense_recorded",
  "statement_generated",
  "balance_updated",
  "refund_completed",
  "credit_applied",
  "adjustment_applied",
  "receipt_issued",
  "autopay_enrolled",
  "autopay_disabled",
  "reconciliation"
] as const;

export type ChargeType = (typeof CHARGE_TYPES)[number];
export type ChargeStatus = (typeof CHARGE_STATUSES)[number];
export type LateStatus = (typeof LATE_STATUSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];
export type StatementStatus = (typeof STATEMENT_STATUSES)[number];
export type FinancialActivityType = (typeof FINANCIAL_ACTIVITY_TYPES)[number];

export type RentChargeRecord = {
  id: string;
  organizationId: string;
  chargeNumber: string;
  leaseId: string;
  propertyId: string;
  unitId: string;
  tenantId: string;
  chargeType: ChargeType;
  description: string;
  amount: number;
  amountPaid: number;
  outstandingBalance: number;
  dueDate: string;
  periodStart: string | null;
  periodEnd: string | null;
  status: ChargeStatus;
  lateStatus: LateStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  deletedAt: string | null;
};

export type PaymentRecord = {
  id: string;
  organizationId: string;
  paymentNumber: string;
  rentChargeId: string | null;
  leaseId: string | null;
  propertyId: string | null;
  unitId: string | null;
  tenantId: string | null;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  status: PaymentStatus;
  referenceNote: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  deletedAt: string | null;
};

export type ExpenseRecord = {
  id: string;
  organizationId: string;
  expenseNumber: string;
  propertyId: string;
  vendorId: string | null;
  workOrderId: string | null;
  category: ExpenseCategory;
  customCategory: string | null;
  description: string;
  amount: number;
  expenseDate: string;
  status: ExpenseStatus;
  vendorBillPlaceholder: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  deletedAt: string | null;
};

export type OwnerStatementRecord = {
  id: string;
  organizationId: string;
  statementNumber: string;
  propertyId: string;
  ownerPlaceholder: string | null;
  statementPeriodStart: string;
  statementPeriodEnd: string;
  status: StatementStatus;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  occupancyRate: number;
  maintenanceCost: number;
  outstandingBalances: number;
  generatedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  deletedAt: string | null;
};

export type FinancialActivityRecord = {
  id: string;
  organizationId: string;
  activityType: FinancialActivityType;
  entityType: string;
  entityId: string;
  leaseId: string | null;
  propertyId: string | null;
  tenantId: string | null;
  amount: number;
  balanceAfter: number | null;
  summary: string;
  payload: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
};

export type CreateRentChargeInput = {
  leaseId: string;
  chargeType?: ChargeType;
  description: string;
  amount: number;
  dueDate: string;
  periodStart?: string | null;
  periodEnd?: string | null;
};

export type CreatePaymentInput = {
  rentChargeId?: string | null;
  leaseId?: string | null;
  propertyId?: string | null;
  unitId?: string | null;
  tenantId?: string | null;
  amount: number;
  paymentMethod?: PaymentMethod;
  paymentDate?: string;
  referenceNote?: string | null;
};

export type CreateExpenseInput = {
  propertyId: string;
  vendorId?: string | null;
  workOrderId?: string | null;
  category?: ExpenseCategory;
  customCategory?: string | null;
  description: string;
  amount: number;
  expenseDate?: string;
  status?: ExpenseStatus;
  vendorBillPlaceholder?: string | null;
};

export type GenerateOwnerStatementInput = {
  propertyId: string;
  statementPeriodStart: string;
  statementPeriodEnd: string;
  ownerPlaceholder?: string | null;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parsePositiveNumber(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function parseStrictPositiveNumber(value: unknown): number | null {
  const parsed = parsePositiveNumber(value);
  if (parsed === null || parsed <= 0) return null;
  return parsed;
}

function parseDate(value: unknown): string | null {
  if (!isNonEmptyString(value)) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return value;
}

export function parseCreateRentChargeInput(payload: unknown): CreateRentChargeInput | null {
  if (!payload || typeof payload !== "object") return null;
  const body = payload as Record<string, unknown>;
  if (!isNonEmptyString(body["leaseId"]) || !isNonEmptyString(body["description"])) return null;
  const amount = parseStrictPositiveNumber(body["amount"]);
  const dueDate = parseDate(body["dueDate"]);
  if (amount === null || !dueDate) return null;
  const chargeType = CHARGE_TYPES.includes(body["chargeType"] as ChargeType) ? (body["chargeType"] as ChargeType) : "custom";
  return {
    leaseId: body["leaseId"].trim(),
    chargeType,
    description: body["description"].trim(),
    amount,
    dueDate,
    periodStart: parseDate(body["periodStart"]),
    periodEnd: parseDate(body["periodEnd"])
  };
}

export function parseCreatePaymentInput(payload: unknown): CreatePaymentInput | null {
  if (!payload || typeof payload !== "object") return null;
  const body = payload as Record<string, unknown>;
  const amount = parseStrictPositiveNumber(body["amount"]);
  if (amount === null) return null;
  const paymentMethod = PAYMENT_METHODS.includes(body["paymentMethod"] as PaymentMethod)
    ? (body["paymentMethod"] as PaymentMethod)
    : "manual";
  const input: CreatePaymentInput = {
    rentChargeId: isNonEmptyString(body["rentChargeId"]) ? body["rentChargeId"].trim() : null,
    leaseId: isNonEmptyString(body["leaseId"]) ? body["leaseId"].trim() : null,
    propertyId: isNonEmptyString(body["propertyId"]) ? body["propertyId"].trim() : null,
    unitId: isNonEmptyString(body["unitId"]) ? body["unitId"].trim() : null,
    tenantId: isNonEmptyString(body["tenantId"]) ? body["tenantId"].trim() : null,
    amount,
    paymentMethod,
    referenceNote: isNonEmptyString(body["referenceNote"]) ? body["referenceNote"].trim() : null
  };
  const paymentDate = parseDate(body["paymentDate"]);
  if (paymentDate) input.paymentDate = paymentDate;
  return input;
}

export function parseCreateExpenseInput(payload: unknown): CreateExpenseInput | null {
  if (!payload || typeof payload !== "object") return null;
  const body = payload as Record<string, unknown>;
  if (!isNonEmptyString(body["propertyId"]) || !isNonEmptyString(body["description"])) return null;
  const amount = parsePositiveNumber(body["amount"]);
  if (amount === null) return null;
  const category = EXPENSE_CATEGORIES.includes(body["category"] as ExpenseCategory)
    ? (body["category"] as ExpenseCategory)
    : "maintenance";
  const status = EXPENSE_STATUSES.includes(body["status"] as ExpenseStatus) ? (body["status"] as ExpenseStatus) : "pending";
  const input: CreateExpenseInput = {
    propertyId: body["propertyId"].trim(),
    vendorId: isNonEmptyString(body["vendorId"]) ? body["vendorId"].trim() : null,
    workOrderId: isNonEmptyString(body["workOrderId"]) ? body["workOrderId"].trim() : null,
    category,
    customCategory: isNonEmptyString(body["customCategory"]) ? body["customCategory"].trim() : null,
    description: body["description"].trim(),
    amount,
    status,
    vendorBillPlaceholder: isNonEmptyString(body["vendorBillPlaceholder"]) ? body["vendorBillPlaceholder"].trim() : null
  };
  const expenseDate = parseDate(body["expenseDate"]);
  if (expenseDate) input.expenseDate = expenseDate;
  return input;
}

export function parseGenerateOwnerStatementInput(payload: unknown): GenerateOwnerStatementInput | null {
  if (!payload || typeof payload !== "object") return null;
  const body = payload as Record<string, unknown>;
  if (!isNonEmptyString(body["propertyId"])) return null;
  const statementPeriodStart = parseDate(body["statementPeriodStart"]);
  const statementPeriodEnd = parseDate(body["statementPeriodEnd"]);
  if (!statementPeriodStart || !statementPeriodEnd) return null;
  if (statementPeriodStart > statementPeriodEnd) return null;
  return {
    propertyId: body["propertyId"].trim(),
    statementPeriodStart,
    statementPeriodEnd,
    ownerPlaceholder: isNonEmptyString(body["ownerPlaceholder"]) ? body["ownerPlaceholder"].trim() : null
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function toChargeStatusLabel(status: ChargeStatus): string {
  const labels: Record<ChargeStatus, string> = {
    draft: "Draft",
    pending: "Pending",
    partial: "Partial",
    paid: "Paid",
    overdue: "Overdue",
    waived: "Waived",
    cancelled: "Cancelled",
    in_collections: "In collections"
  };
  return labels[status];
}

export function toExpenseCategoryLabel(category: ExpenseCategory): string {
  const labels: Record<ExpenseCategory, string> = {
    maintenance: "Maintenance",
    vendor_bill: "Vendor Bill",
    utilities: "Utilities",
    insurance: "Insurance",
    taxes: "Taxes",
    repairs: "Repairs",
    capital_improvement: "Capital Improvement",
    custom: "Custom"
  };
  return labels[category];
}
