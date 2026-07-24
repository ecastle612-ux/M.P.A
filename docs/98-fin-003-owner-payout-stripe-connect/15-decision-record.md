# 15 — Decision Record (Approved)

**Package:** FIN-003  
**Status:** ✅ **Approved** (2026-07-23 · Product Owner) — D1–D14 binding  
**Date:** 2026-07-23  
**Companion:** [14 — Design Review](./14-design-review.md) · [12 — Open Questions](./12-open-questions.md)

These decisions are **binding** for FIN-003 Phase A (and later phases when separately authorized). Material changes require a new gate cycle.

---

## D1 — Ownership splits

| Field | Value |
|-------|-------|
| **Approved recommendation** | **B — PM-configured allocation profiles per property** for Blocker 4 v1 |
| **Reasoning** | No ownership-interest schema exists today; equal-split among all `property_owner` members (C) is commercially dishonest; a full ownership entity model (A) is correct long-term but would block Phase C on a larger schema program. Profiles store `(property_id, owner_principal, percent)` with Σ=100%, validated before any transfer. |
| **Future flexibility** | Migrate profiles → dedicated ownership interest / `owner_property_access` without changing Connect routing. Profiles remain an adapter input to `OwnerPayoutService`. |

---

## D2 — Reserve balances

| Field | Value |
|-------|-------|
| **Approved recommendation** | Reserves are **allocation inputs** (PM-configured withhold amounts/rules per property/period) — **not** a separate Connect reserve account product |
| **Reasoning** | Keeps custody simple (funds stay in org settlement Express until owner transfer); aligns with ADR-010 deferral of trust accounting; Owner Portal shows reserve line as a material deduction (A2 transparency). |
| **Future flexibility** | Later trust/reserve ledgers can feed the same allocation input interface. |

---

## D3 — Negative balances

| Field | Value |
|-------|-------|
| **Approved recommendation** | If owner net ≤ 0 for a period: **skip transfer**, show **$0 / no payout due**, record skipped allocation; **no automatic owner debit/advance** |
| **Reasoning** | Avoids inventing credit/collections against owners; prevents surprise clawbacks; PM can use manual adjustment in a later workflow. |
| **Future flexibility** | Owner advances / carry-forward balances can be a post-launch accounting feature with explicit Approve. |

---

## D4 — Payout schedule

| Field | Value |
|-------|-------|
| **Approved recommendation** | **Monthly default** after period close + **PM override** (date/cadence within org) |
| **Reasoning** | Matches owner statement cadence and commercial expectations; override covers enterprise calendars without custom code per tenant. |
| **Future flexibility** | Weekly / biweekly presets can be added as schedule templates later. |

---

## D5 — Bank account policy

| Field | Value |
|-------|-------|
| **Approved recommendation** | **Single default bank** per Owner Express account (Stripe-managed); no in-app multi-bank picker in v1 |
| **Reasoning** | Express onboarding already collects payout destination; multi-bank selection adds UX/support complexity without unblocking Blocker 4. |
| **Future flexibility** | Multi-destination selection can be added when Stripe + product demand justify it. |

---

## D6 — International support

| Field | Value |
|-------|-------|
| **Approved recommendation** | **US + USD only** for Blocker 4 v1 |
| **Reasoning** | KYC, tax, and Connect country matrices expand risk; commercial launch blockers assume US PM companies first. |
| **Future flexibility** | Country expansion is an Approve amendment + Connect capability matrix workstream. |

---

## D7 — 1099 strategy

| Field | Value |
|-------|-------|
| **Approved recommendation** | **No 1099 automation** in FIN-003 v1; persist exportable paid totals (owner, tax year, amount, org) for a future tax package |
| **Reasoning** | Tax filing is a separate compliance product; blocking Blocker 4 on 1099 would delay money-out incorrectly. |
| **Future flexibility** | Future Tax initiative consumes exportable payout facts. |

---

## D8 — Retry policy

| Field | Value |
|-------|-------|
| **Approved recommendation** | Transient failures: **max 3** auto-retries with exponential backoff + jitter; same idempotency key per attempt; insufficient balance → re-queue/alert (no burn retries); restricted/disabled → **no** auto-retry |
| **Reasoning** | Matches [08](./08-failure-recovery.md); prevents double-pay; balances automation vs ops noise. |
| **Future flexibility** | Tunable per-org retry caps later; policy object remains data-driven. |

---

## D9 — Clawback policy

| Field | Value |
|-------|-------|
| **Approved recommendation** | After `paid`: **immutable history**; corrections via **compensating transfer** (or documented ops clawback) + full audit; never in-place amount edits |
| **Reasoning** | Required for audit integrity and A4 amendments; legal/ops playbook for when compensating transfer is allowed. |
| **Future flexibility** | Formal dispute/clawback workflow UI can wrap the same compensating-record model. |

---

## D10 — Capability naming

| Field | Value |
|-------|-------|
| **Approved recommendation** | Introduce **`payout:onboard`** (owner self) and **`payout:manage`** (PM runs/retries/schedules); owner history remains under **`financial:read`** + property ACL |
| **Reasoning** | Least privilege — `financial:*` alone is too broad for money movement ops; separates onboarding from run control. |
| **Future flexibility** | Add `payout:manual_override` if manage proves too wide for junior PM roles. |

---

## D11 — Owner invitations

| Field | Value |
|-------|-------|
| **Approved recommendation** | **Self-serve onboarding** for any user with Owner Portal access; PM may **nudge** (notification / message) but invite is not required to start Connect |
| **Reasoning** | OWNER-001 already authenticates owners; forcing PM invite adds friction and support load; Stripe Account Link is owner-driven KYC by nature. |
| **Future flexibility** | Optional PM “invite to payouts” email can be added without changing Connect model. |

---

## D12 — Instant payouts (Q4)

| Field | Value |
|-------|-------|
| **Approved recommendation** | **Out of scope** for Blocker 4 v1 |
| **Reasoning** | Extra Stripe product surface, fees, and support; not required for commercial money-out. |
| **Future flexibility** | Explicit Approve amendment required to enable. |

---

## D13 — Destination-to-owner shortcut (Q9)

| Field | Value |
|-------|-------|
| **Approved recommendation** | **Defer** — v1 always **Org settlement Express → Owner Express** transfer |
| **Reasoning** | Uniform ops, reconciliation, and ADR-023 primary model; shortcut is an optimization for later. |
| **Future flexibility** | ADR-023 already permits later single-owner shortcut. |

---

## D14 — Remittance PDFs (Q12)

| Field | Value |
|-------|-------|
| **Approved recommendation** | **Not launch-critical**; Phase E optional if history UI + amounts are clear; vault remittance is a stretch goal |
| **Reasoning** | Avoid blocking cert on PDF pipeline; FIN-001/vault already exist if later wired. |
| **Future flexibility** | Add remittance generation job without changing transfer model. |

---

## Decision summary table

| ID | Topic | Approved decision |
|----|-------|-------------------|
| D1 | Ownership splits | PM allocation profiles (v1); path to ownership table |
| D2 | Reserves | Allocation inputs, not Connect reserve accounts |
| D3 | Negative balances | Skip payout / $0; no auto debit |
| D4 | Schedule | Monthly default + PM override |
| D5 | Bank accounts | Single default via Express |
| D6 | International | US + USD only |
| D7 | 1099 | No automation; exportable totals |
| D8 | Retry | Max 3 transient; no retry if restricted |
| D9 | Clawback | Compensating transfer + audit only |
| D10 | Capabilities | `payout:onboard`, `payout:manage` |
| D11 | Invitations | Self-serve + PM nudge |
| D12 | Instant | Out of scope |
| D13 | Destination shortcut | Defer |
| D14 | Remittance PDF | Optional / non-blocking |
