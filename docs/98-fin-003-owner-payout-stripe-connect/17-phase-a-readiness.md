# 17 — Phase A Readiness

**Package:** FIN-003  
**Phase:** A — Connect foundation (onboarding & status only)  
**Authorization:** ✅ **AUTHORIZED** (2026-07-23 · Product Owner)  
**Implementation Gate:** **PHASE A AUTHORIZED**  
**Code start:** 🔒 Wait for explicit `BEGIN FIN-003 PHASE A IMPLEMENTATION`  
**Phases B–E:** 🔒 **LOCKED**  
**Companion:** [16 — Approval Summary](./16-approval-summary.md)

---

## Objectives

1. Establish Stripe Connect Express onboarding for **organization settlement** and **owner** accounts.  
2. Persist and display **connection**, **verification**, and **eligibility** status.  
3. Surface **read-only** payout/onboarding status in Owner Portal (and PM org status) without moving money.  
4. Prove provider boundary (`ConnectProvider`) and custody invariants without transfers.

---

## Implementation scope (Phase A ONLY)

| Include | Detail |
|---------|--------|
| ✓ Stripe Connect onboarding | Account Link (or approved embedded) for org + owner Express |
| ✓ Account connection | Create/link Express accounts; store Connect account refs |
| ✓ Verification status | Mirror KYC / requirements from Stripe account status |
| ✓ Eligibility status | Derive Eligible / Action required / Restricted / etc. (no transfer) |
| ✓ Read-only payout status | Show onboarding/eligibility states; pending/paid remain empty or “not available until payouts enabled” honesty copy |

---

## Out-of-scope items (Phase A DOES NOT include)

| Exclude | Why |
|---------|-----|
| ✗ Scheduled payouts | Phase C+ |
| ✗ Money movement | Custody — Phase C |
| ✗ Transfers (settlement → owner) | Phase C |
| ✗ Webhook processing beyond onboarding status | Account-status webhooks only if needed for verification mirror; **no** transfer/payout money webhooks in A |
| ✗ Financial calculations / allocation math | Phase C |
| ✗ Reserve logic | Phase C (D2) |
| ✗ Split ownership / allocation profiles | Phase C (D1) |
| ✗ Retry / clawback / remittance PDFs | Later phases |
| ✗ Instant / international / 1099 | Future / deferred decisions |

---

## Dependencies

| Dependency | Required for Phase A? |
|------------|------------------------|
| FIN-003 **Approved** + Phase A unlock | ✅ **Satisfied** (2026-07-23) |
| Explicit begin phrase for code | Required before any application work |
| ADR-023 / ADR-024 | Yes (architecture) |
| OWNER-001 portal closed | Yes (host surfaces) |
| Stripe platform Connect enabled in target env | Yes (ops) |
| API-005 rent live | Not required for A onboarding-only |
| Allocation profiles (D1) | No — Phase C |
| Counsel custody note | Recommended before money phases (B–E) |

---

## Existing systems reused

| System | Phase A use |
|--------|-------------|
| Owner Portal (OWNER-001) | Status / onboarding CTAs (placeholders → live status) |
| RBAC | Session auth; introduce `payout:onboard` grants as Approved |
| Notification Service | Optional “finish onboarding” only |
| Audit Log | Onboarding link create / status changes |
| Secrets / env | Stripe keys (server); Connect webhook secret if account webhooks used |
| BILL-001 / API-005 payment webhooks | **Do not touch** |

---

## Stripe boundaries

```
Phase A allowed:
  Connect Express account create
  Account Link / onboarding
  Account retrieve / requirements mirror
  (Optional) account.updated webhook → status only

Phase A forbidden:
  Destination charges changes (unless already API-005 — do not expand in A)
  Transfers
  Payout create/cancel
  Balance-driven jobs
  Application-fee experiments beyond existing rent path
```

M.P.A. still **never** holds customer funds. Phase A does not move owner money.

---

## Expected components (illustrative — after begin phrase)

| Layer | Expected |
|-------|----------|
| UI | Owner onboarding/status card; PM org settlement status |
| Client | Minimal — deep links return to portal |
| Server | Onboarding-link route; status loader |
| Provider | `ConnectProvider` Stripe adapter (accounts + links + status) |

No allocation UI. No run console.

---

## Expected services (illustrative — after begin phrase)

| Service | Phase A responsibility |
|---------|------------------------|
| `ConnectProvider` | Express account + Account Link + getAccount |
| `OwnerPayoutService` (thin) | Authz + map account status → eligibility; **no** createTransfer |
| Status loaders | Org + owner Connect status for portal |

---

## Expected documentation references

| Doc | Use during Phase A |
|-----|--------------------|
| [04 — Stripe Connect design](./04-stripe-connect-design.md) | Account model |
| [05 — Payout lifecycle](./05-payout-lifecycle.md) §§1–5 | Onboarding → eligibility only |
| [06 — Security](./06-security-and-compliance.md) | Secrets, RBAC |
| [07 — Webhooks](./07-webhook-processing.md) | **Account updates only** if implemented |
| [09 — UX](./09-user-experience.md) | Not connected → Eligible states |
| [10 — API boundaries](./10-api-boundaries.md) | Onboarding/status routes only |
| [15 — Decisions](./15-decision-record.md) | D5, D10, D11 relevant to A |
| [18 — Amendments](./18-amendments-approval.md) | Custody + phase lock |

---

## Success criteria (Phase A)

| ID | Criterion |
|----|-----------|
| A-S1 | Org can start/complete Express settlement onboarding in test |
| A-S2 | Owner can start/complete Express onboarding from Owner Portal |
| A-S3 | Verification / eligibility states display honestly |
| A-S4 | No transfer / payout / schedule code paths exist |
| A-S5 | Connect webhook (if any) updates account status only; idempotent |
| A-S6 | Typecheck + build pass; no BILL-001 / payments webhook coupling |
| A-S7 | Audit records for onboarding link creation |

---

## Risk checklist

| Risk | Mitigation |
|------|------------|
| Scope creep into transfers | This doc + phase lock; refuse money APIs |
| Account webhook expands to payout.paid | Explicitly out of A |
| Owners believe money will arrive | Copy: eligibility ≠ payout scheduled |
| Premature implement before begin phrase | Wait for `BEGIN FIN-003 PHASE A IMPLEMENTATION` |
| Capability grants too broad | `payout:onboard` only for owners in A |

---

## Authorization statement

| State | Meaning |
|-------|---------|
| **Current** | Phase A ✅ **AUTHORIZED** (governance, 2026-07-23) |
| **Code** | 🔒 Locked until `BEGIN FIN-003 PHASE A IMPLEMENTATION` |
| **Phases B–E** | 🔒 **LOCKED** until separately authorized |

### Implementation Gate snapshot

| Gate | Status |
|------|--------|
| Package | ✅ **APPROVED** |
| Phase A | ✅ **AUTHORIZED** |
| Phase B | 🔒 **LOCKED** |
| Phase C | 🔒 **LOCKED** |
| Phase D | 🔒 **LOCKED** |
| Phase E | 🔒 **LOCKED** |
