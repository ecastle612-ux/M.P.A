# VENDOR-001 — Zero Friction Vendor Experience

**Status:** Approved · Phase A implementing  
**Initiative ID:** VENDOR-001  
**Priority:** HIGH  
**Gate:** Design → Document → **Approve** → Implement  
**Policy:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)  
**Proposed ADR:** [ADR-025](../18-decision-log/adr-025-tokenized-vendor-work-order-access.md)  
**Related:** [ADR-004](../18-decision-log/adr-004-vendor-marketplace-first-class.md) · Maintenance foundation · [FIN-003](../98-fin-003-owner-payout-stripe-connect/README.md) (future payouts) · Property QR (communication — different rail)  
**Gate owners:** Product + Lead Architect + Security

---

## Problem

Vendors lose time before they can work: app installs, passwords, and PM-mediated status updates. M.P.A. should make the field loop **Scan → Start → Finish** possible in a browser with no account.

## Non-goals (binding)

| Forbidden | Why |
|-----------|-----|
| Redesign existing work-order PM UI | Out of scope; extend statuses + tokens only |
| Complex vendor onboarding / KYC before work | Blocks “seconds to productive” |
| Vendor general ledger / full accounting | ADR-010 defer accounting |
| Storing bank/ACH numbers in M.P.A. | Use payment providers later; preference + history only |
| Requiring native app download | Browser-first QR flow |
| Replacing authenticated `/portal/vendor` | Optional later dashboard; token flow is primary |

## Signature workflow

```
Receive WO → Arrive → Scan QR → Start Job → Complete Job → Upload Invoice → Get Paid
```

Maximum **3 taps** on site: Scan → Start → Finish. Everything else is automatic (status, audit, notify).

## Proposed decisions (for Approve)

| # | Decision | Proposed |
|---|----------|----------|
| D1 | Access model | **Signed, single-WO capability token** in URL (QR / SMS / email). No login for first job. |
| D2 | Identity at first invoice | Soft identity: email + phone (+ optional business name). Cookie/device recognition for return visits on same token family. |
| D3 | Status mapping | Start → `vendor_on_site` (or map to existing `arrived`/`in_progress` per [02](./02-status-and-audit.md)); Finish → `awaiting_approval` |
| D4 | QR generation | Auto on **approved + assigned** work order; printable + shareable; revocable |
| D5 | Payment profile | Preference only: ACH / Check / Other + contact. **No banking secrets in M.P.A.** |
| D6 | Pay vendors | PM Approve/Reject invoice → Pay (provider) or **Mark paid externally**; immutable payment record |
| D7 | Owner reporting | Vendor payments flow into property expense / owner report feed (read models) |
| D8 | Marketplace | Phase A uses **org `vendors`**; marketplace (`ADR-004`) link is Phase C optional |

## Documents

| Doc | Purpose |
|-----|---------|
| [00 — Executive summary](./00-executive-summary.md) | Goals / non-goals |
| [01 — Experience architecture](./01-experience-architecture.md) | Screens & 3-tap loop |
| [02 — Status & audit](./02-status-and-audit.md) | Status machine + audit |
| [03 — Token & QR security](./03-token-and-qr-security.md) | Tokens, expiry, revoke |
| [04 — Invoice & payment](./04-invoice-and-payment.md) | Invoice → approve → pay |
| [05 — Database impacts](./05-database-impacts.md) | Tables / RLS |
| [06 — API impacts](./06-api-impacts.md) | Public token routes + PM APIs |
| [07 — Notifications](./07-notifications.md) | PM + vendor notifies |
| [08 — Implementation phases](./08-implementation-phases.md) | A→D |
| [09 — Certification plan](./09-certification-plan.md) | Device / browser PASS |
| [10 — Definition of done](./10-definition-of-done.md) | Exit criteria |
| [11 — Approval checklist](./11-approval-checklist.md) | Gate sign-off |
| [12 — Risk assessment](./12-risk-assessment.md) | Abuse / privacy |

## Current baseline (as-built)

- Org `vendors` + `maintenance_work_orders` + assignments exist.
- Authenticated `/portal/vendor` can patch assignment status — **requires login**.
- Property QR exists for resident join — **not** work-order vendor QR.
- Vendor invoice/payout tables are placeholders only.

## Gate action required

Reply **APPROVE VENDOR-001** (and accept ADR-025) to unlock Phase A implementation.  
Until then: **no application code, migrations, or UI for this initiative.**
