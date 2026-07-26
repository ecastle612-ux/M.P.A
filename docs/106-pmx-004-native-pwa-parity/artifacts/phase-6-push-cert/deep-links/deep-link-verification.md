# Phase 6 — Deep-link verification

**Package:** PMX-004 Phase 6  
**Date:** 2026-07-26  

## Rules

1. OneSignal `url` is **absolute** (`absoluteNotificationUrl` + `NEXT_PUBLIC_APP_URL`).  
2. Role-correct destinations via `lib/notifications/deep-links.ts` (no generic homepage dump for wired events).  
3. AUTH-001 session cookies apply on same-origin absolute URLs; org isolation remains server-side ACL (unchanged).

## Code verification (2026-07-26)

| Check | Result | Evidence |
|-------|--------|----------|
| Absolute URL helper | ✅ | `onesignal-provider.ts` · unit test posts absolute `url` |
| Tenant payments | ✅ | `tenantPaymentsHref()` → `/portal/tenant/payments` |
| Staff charge / financials | ✅ | `staffChargeHref` / `staffFinancialTransactionsHref` |
| Maintenance by audience | ✅ | `maintenanceWorkOrderHref(id, forResident)` |
| Owner reports | ✅ | **Phase 6 repair** → `/portal/owner/reports` (was portal home) |
| Messaging by audience | ✅ | `tenantMessagingHref` / `staffMessagingHref` wired in `messaging/server.ts` |
| Unit tests | ✅ | `deep-links.test.ts` (5) · `onesignal-provider.test.ts` (absolute url case) |
| On-device tap routing | ✅ | Phase 1 T4 Push PASS (Galaxy · Pixel · iPhone) |

## Scoped repair in this Phase 6 session

| Change | Why |
|--------|-----|
| `ownerReportsHref` → `/portal/owner/reports` | Owner reports surface exists; avoid home dump for statement/report notifies |
| Messaging helpers centralized | Same destinations; single SoT for role-correct threads |

No AUTH routing redesign · no schema · no provider swap.

## Deferred (Product Accept · non-blocking)

| Item | Disposition |
|------|-------------|
| Owner statement **detail** deep link | Remains list/reports surface until dedicated statement-detail notify ships |
| Full PUSH-001 delivery-matrix Device ☐ re-run per role/event | Covered by Phase 1 T4 + wired-path code audit; remaining unimplemented matrix rows stay deferred per [PUSH-001 §03](../../../../99-push-001-pwa-push-commercial-certification/03-delivery-matrix.md) |
