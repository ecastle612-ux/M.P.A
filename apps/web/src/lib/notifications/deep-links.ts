/**
 * PUSH-001 — role-correct notification deep-link helpers.
 * Absolute URLs are applied by the OneSignal provider via NEXT_PUBLIC_APP_URL.
 */

export function tenantPaymentsHref(): string {
  return "/portal/tenant/payments";
}

export function staffFinancialTransactionsHref(): string {
  return "/financials/transactions";
}

export function staffChargeHref(rentChargeId: string | null | undefined): string {
  return rentChargeId ? `/financials/charges/${rentChargeId}` : "/financials/charges";
}

export function maintenanceWorkOrderHref(workOrderId: string, forResident: boolean): string {
  return forResident
    ? `/portal/tenant/maintenance/${workOrderId}`
    : `/maintenance/${workOrderId}`;
}

/** Owner reports / statements browser (OWNER-001 Phase surfaces on prod). */
export function ownerReportsHref(): string {
  return "/portal/owner/reports";
}

export function ownerFinancialsHref(): string {
  return "/portal/owner/financials";
}

export function staffOwnerStatementHref(statementId: string): string {
  return `/financials/owner-statements/${statementId}`;
}

export function settingsNotificationsHref(): string {
  return "/settings/notifications";
}

export function settingsPayoutsHref(): string {
  return "/settings/payouts";
}

export function masterAdminProvidersHref(): string {
  return "/master-admin/providers";
}

export function masterAdminNotificationsHref(): string {
  return "/master-admin/notifications";
}

/** Tenant portal messaging thread (PUSH-001 role-correct). */
export function tenantMessagingHref(threadId: string): string {
  return `/portal/tenant/messages?thread=${encodeURIComponent(threadId)}`;
}

/** Staff communications thread. */
export function staffMessagingHref(threadId: string): string {
  return `/communications/threads/${threadId}`;
}
