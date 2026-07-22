import type {
  SaasBillingInterval,
  SaasPlanCode,
  SaasSubscriptionStatus
} from "../integrations/saas-billing/contracts";

export type SaasCustomerRecord = {
  id: string;
  organizationId: string;
  provider: string;
  externalCustomerId: string;
  email: string | null;
};

export type SaasSubscriptionRecord = {
  id: string;
  organizationId: string;
  saasCustomerId: string;
  provider: string;
  externalSubscriptionId: string;
  externalPriceId: string | null;
  planCode: SaasPlanCode;
  billingInterval: SaasBillingInterval | null;
  status: SaasSubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  endedAt: string | null;
};

export type SaasInvoiceRecord = {
  id: string;
  organizationId: string;
  saasSubscriptionId: string | null;
  provider: string;
  externalInvoiceId: string;
  status: string;
  currency: string;
  amountDue: number;
  amountPaid: number;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  paidAt: string | null;
};

export type SaasOrgSubscriptionSnapshot = {
  customer: SaasCustomerRecord | null;
  subscription: SaasSubscriptionRecord | null;
  invoices: SaasInvoiceRecord[];
  catalog: Array<{
    planCode: SaasPlanCode;
    billingInterval: SaasBillingInterval;
    priceId: string;
    trialPeriodDays?: number;
  }>;
};

export const OPEN_SUBSCRIPTION_STATUSES: SaasSubscriptionStatus[] = [
  "incomplete",
  "trialing",
  "active",
  "past_due",
  "unpaid",
  "paused"
];

export function isOpenSubscriptionStatus(status: string): boolean {
  return OPEN_SUBSCRIPTION_STATUSES.includes(status as SaasSubscriptionStatus);
}
