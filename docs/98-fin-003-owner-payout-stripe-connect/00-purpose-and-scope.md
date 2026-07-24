# 00 — Purpose and Scope

**Package:** FIN-003  
**Status:** ✅ **Approved**  
**Sections:** Purpose · Scope · Non-goals · Phase boundaries

---

## Purpose

Enable commercial property managers to distribute **owner proceeds** to property owners through **Stripe Connect Express**, and enable owners to see onboarding, eligibility, pending, completed, failed, and action-required payout states in the existing Owner Portal.

FIN-003 closes **CORE-002 Blocker 4** (Owner Payouts).

### Binding custody purpose

M.P.A. orchestrates allocation and UX. **Stripe Connect moves money.** M.P.A. does not take custody of rent as a depository or money transmitter. Application/platform fees are disclosed platform revenue only.

---

## In scope

| Area | Include |
|------|---------|
| Org settlement Connect Express account | Onboarding + requirements remediation for the PM organization |
| Owner Connect Express accounts | KYC/identity, bank connection, eligibility |
| Allocation model | Property-period net → owner split → transfer intents |
| Scheduled & ad-hoc payout runs | PM-triggered / schedule-driven (product-configured) |
| Lifecycle states | Pending, scheduled, in transit, paid, failed, returned, action required |
| Retry & manual intervention | Rules in [08](./08-failure-recovery.md) |
| Owner Portal wiring | Replace OWNER-001 placeholders (no portal redesign) |
| PM ops visibility | Eligibility, payout runs, failures (existing PM financial surfaces) |
| Webhooks | Connect account + payout/transfer events ([07](./07-webhook-processing.md)) |
| Notifications | Existing Notification Service events |
| Audit | Append-only audit of sensitive actions & money events |
| Reporting / statements | Surface payout facts; do not replace ReportingService |
| RBAC | Capability-gated; owner property scope for owner reads |

---

## Out of scope

| Area | Disposition |
|------|-------------|
| Full GL / trust accounting | ADR-010 future |
| M.P.A. bank accounts holding rent | Forbidden |
| ACH rails outside Stripe Connect | Rejected for v1 (ADR-023) |
| Connect Custom / Standard accounts | Deferred / rejected for v1 |
| Instant payouts productization | Open question — default **out** until Approve |
| International multi-currency complexity | Open question — US-first default |
| 1099 tax filing automation | Future Tax — capture data hooks only if Approve requires |
| Vendor marketplace payouts | ADR-004 separate track |
| SaaS subscription billing | BILL-001 only |
| Owner Portal IA redesign | OWNER-001 closed |
| Parallel payment / ledger engines | Forbidden |

---

## Success definition

1. Owners receive allocated funds via Connect without M.P.A. holding money.  
2. Owners see truthful pending/history states in Owner Portal.  
3. Failures are recoverable, auditable, and visible.  
4. CORE-002 Blocker 4 commercial certification can PASS.  
5. No redesign of API-005, OWNER-001 shell, or BILL-001.

---

## Actors

| Actor | Role in FIN-003 |
|-------|-----------------|
| Property owner | Onboard Connect; view eligibility & payout history (read-mostly) |
| Property manager / org admin | Configure schedules/splits (as Approved); initiate/monitor runs; remediate |
| M.P.A. platform | Application fees; Connect platform account; webhooks |
| Stripe | KYC, bank rails, transfers/payouts, custody of Connect balances |
| Master Admin | Diagnostics / support (no silent money moves) |

---

## Phase boundaries (post-Approve)

See [README](./README.md) Phases A–E. **No phase may implement until Approve unlocks it.**
