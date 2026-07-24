# 12 — Open Questions

**Package:** FIN-003  
**Status:** Design Review complete — all items have **Approved** binding decisions ([15](./15-decision-record.md))  
**Rule:** Decisions are binding under FIN-003 Approve (2026-07-23). Do not silently change in code.

**Evidence:** [14 — Design Review](./14-design-review.md)

---

## Q1 — Ownership splits source of truth

**Question:** Where do owner split percentages live for multi-owner properties?

| Option | Notes |
|--------|-------|
| A | Dedicated ownership interest table (future schema) |
| B | PM-configured allocation profiles per property |
| C | Interim equal split among `property_owner` members |

| | |
|--|--|
| **Recommendation** | B for Blocker 4 v1 |
| **Rationale** | No ownership schema today; C is dishonest; A is correct long-term but blocks Phase C |
| **Risks** | PM misconfiguration — mitigate with Σ=100% validation |
| **Alternatives considered** | A (later), C (rejected) |
| **Final proposed decision** | **D1** — Profiles for v1; migrate to ownership table later |
| **Status** | ✅ Proposed — pending Approve |

---

## Q2 — Multiple bank accounts per owner

**Question:** May owners attach multiple external accounts and choose per payout?

| | |
|--|--|
| **Recommendation** | No — single default bank via Stripe Express |
| **Rationale** | Sufficient for v1; lower UX/support cost |
| **Risks** | Multi-destination needs deferred |
| **Alternatives considered** | In-app multi-bank picker |
| **Final proposed decision** | **D5** |
| **Status** | ✅ Proposed — pending Approve |

---

## Q3 — Reserve balances

**Question:** How are reserves withheld from owner net?

| | |
|--|--|
| **Recommendation** | Allocation inputs from PM config / property accounting — not a Connect reserve account |
| **Rationale** | Custody simplicity; ADR-010 |
| **Risks** | Incorrect reserve config |
| **Alternatives considered** | Separate Stripe reserve product |
| **Final proposed decision** | **D2** |
| **Status** | ✅ Proposed — pending Approve |

---

## Q4 — Instant payouts

**Question:** Offer Stripe Instant Payouts to owners?

| | |
|--|--|
| **Recommendation** | Out of scope for Blocker 4 v1 |
| **Rationale** | Not required for commercial money-out |
| **Risks** | Competitive feature gap |
| **Alternatives considered** | Enable Instant (needs amendment) |
| **Final proposed decision** | **D12** |
| **Status** | ✅ Proposed — pending Approve |

---

## Q5 — International payouts

**Question:** Non-US owners / multi-currency?

| | |
|--|--|
| **Recommendation** | US + USD first |
| **Rationale** | Launch risk control |
| **Risks** | Non-US owners blocked |
| **Alternatives considered** | Multi-country matrix now |
| **Final proposed decision** | **D6** |
| **Status** | ✅ Proposed — pending Approve |

---

## Q6 — 1099 generation

**Question:** Does FIN-003 generate 1099s?

| | |
|--|--|
| **Recommendation** | No automation; exportable paid totals for future tax package |
| **Rationale** | Separate compliance product |
| **Risks** | Manual tax ops interim |
| **Alternatives considered** | Build 1099 inside FIN-003 |
| **Final proposed decision** | **D7** |
| **Status** | ✅ Proposed — pending Approve |

---

## Q7 — Negative balances / owner advances

**Question:** Expenses exceed collections for an owner’s share?

| | |
|--|--|
| **Recommendation** | Skip payout / show $0; no automatic owner debit |
| **Rationale** | Avoid surprise debt creation |
| **Risks** | Deficit carry needs PM process |
| **Alternatives considered** | Auto advances / clawbacks |
| **Final proposed decision** | **D3** |
| **Status** | ✅ Proposed — pending Approve |

---

## Q8 — Clawbacks after paid

**Question:** Allocation error after `paid`?

| | |
|--|--|
| **Recommendation** | Compensating transfer + audit; never mutate paid history |
| **Rationale** | Audit integrity (A4) |
| **Risks** | Ops/legal playbook still needed at Phase E |
| **Alternatives considered** | In-place history edits (rejected) |
| **Final proposed decision** | **D9** |
| **Status** | ✅ Proposed — pending Approve |

---

## Q9 — Destination-to-owner shortcut

**Question:** Use destination-to-owner for single-owner properties in v1?

| | |
|--|--|
| **Recommendation** | Defer — always settlement Express → owner Express |
| **Rationale** | Uniform ops/reconciliation |
| **Risks** | Extra hop for simple properties |
| **Alternatives considered** | Shortcut now (ADR allows later) |
| **Final proposed decision** | **D13** |
| **Status** | ✅ Proposed — pending Approve |

---

## Q10 — Capability names

**Question:** `payout:*` vs reuse `financial:*`?

| | |
|--|--|
| **Recommendation** | `payout:onboard` + `payout:manage`; history via `financial:read` + ACL |
| **Rationale** | Least privilege |
| **Risks** | Grant matrix work at implement |
| **Alternatives considered** | financial-only capabilities |
| **Final proposed decision** | **D10** |
| **Status** | ✅ Proposed — pending Approve |

---

## Q11 — Schedule cadence default

**Question:** Monthly / weekly / PM-only?

| | |
|--|--|
| **Recommendation** | Monthly default + PM override |
| **Rationale** | Aligns with statements |
| **Risks** | Override misuse |
| **Alternatives considered** | Weekly; no default |
| **Final proposed decision** | **D4** |
| **Status** | ✅ Proposed — pending Approve |

---

## Q12 — Remittance PDFs in Vault

**Question:** Auto-generate vaulted remittance advice?

| | |
|--|--|
| **Recommendation** | Not launch-critical; optional Phase E |
| **Rationale** | Clear history UI sufficient for cert |
| **Risks** | Some PMs expect PDF |
| **Alternatives considered** | Mandatory remittance PDF |
| **Final proposed decision** | **D14** |
| **Status** | ✅ Proposed — pending Approve |

---

## Q13 — Owner invite vs self-serve onboarding

**Question:** Must PM invite owners to Connect?

| | |
|--|--|
| **Recommendation** | Self-serve for Owner Portal users; PM may nudge |
| **Rationale** | Lower friction; KYC is owner-driven |
| **Risks** | Early KYC before org settlement ready (eligibility gates handle) |
| **Alternatives considered** | Mandatory PM invite |
| **Final proposed decision** | **D11** |
| **Status** | ✅ Proposed — pending Approve |

---

## Resolution index

| Q | Decision ID | Proposed |
|---|-------------|----------|
| Q1 | D1 | Allocation profiles (v1) |
| Q2 | D5 | Single bank |
| Q3 | D2 | Reserve as allocation input |
| Q4 | D12 | Instant out of scope |
| Q5 | D6 | US + USD |
| Q6 | D7 | No 1099 automation |
| Q7 | D3 | Skip / $0 |
| Q8 | D9 | Compensating transfer |
| Q9 | D13 | No shortcut in v1 |
| Q10 | D10 | payout:onboard / payout:manage |
| Q11 | D4 | Monthly + override |
| Q12 | D14 | Remittance optional |
| Q13 | D11 | Self-serve + nudge |
