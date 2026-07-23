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

/** Owner Portal home until statement detail deep-links ship with OWNER-001 surfaces on prod. */
export function ownerReportsHref(): string {
  return "/portal/owner";
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

export function masterAdminProvidersHref(): string {
  return "/master-admin/providers";
}

export function masterAdminNotificationsHref(): string {
  return "/master-admin/notifications";
}
