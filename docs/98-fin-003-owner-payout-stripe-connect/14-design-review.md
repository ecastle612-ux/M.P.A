# 14 — FIN-003 Design Review

**Package:** FIN-003  
**Review date:** 2026-07-23  
**Status:** Design Review complete (historical) → package now ✅ **APPROVED** (2026-07-23 · Product Owner)  
**Implement:** Phase A ✅ **AUTHORIZED** (governance) · Phases B–E 🔒 **LOCKED** · code awaits begin phrase  
**Decisions:** [15 — Decision Record](./15-decision-record.md) (**Approved**)  
**Open Questions:** [12](./12-open-questions.md) (binding resolutions recorded)

---

## Executive summary

FIN-003 documentation is architecturally coherent with ADR-023 / ADR-024, OWNER-001 integration points, and CORE-002 Blocker 4 readiness. All thirteen open questions now have **proposed binding decisions** suitable for gate-owner Approve.

**Verdict (at Design Review):** Move package status from **Draft** → **Approval Ready**.  
**Post-Approve (2026-07-23):** Package ✅ **APPROVED** · Phase A ✅ **AUTHORIZED** · Phases B–E 🔒 **LOCKED**. See [13](./13-approval-checklist.md) · [16](./16-approval-summary.md).

No conflicts require package redesign. One governance nuance with ADR-023 Phase A language is resolved in favor of the Implementation Gate (see ADR compliance).

---

## Architecture review

| Check | Result |
|-------|--------|
| `OwnerPayoutService` → `ConnectProvider` boundary | Pass — matches ADR-023 |
| No Stripe SDK in business modules | Pass — documented |
| Destination charge → org Express → owner Express | Pass — no platform float |
| Reuse OWNER-001 placeholders (no IA redesign) | Pass |
| Reuse API-005 ledger as SoR for rent facts | Pass |
| Separate webhook rail from payments + SaaS | Pass |
| Background jobs for schedule/retry/webhook apply | Pass |
| ADR-010 GL deferral respected | Pass — no trust accounting product |

**Finding:** Phase C depends on allocation profile persistence (D1). Phases A–B do not. Phase lock (A first) remains correct.

---

## ADR compliance review

### ADR-023 (Accepted)

| ADR decision | FIN-003 alignment |
|--------------|-------------------|
| Connect Express for org + owner | ✅ |
| Destination charges + app fees; transfers to owners | ✅ |
| Defer Custom; shortcut later | ✅ (D13 defers shortcut) |
| OwnerPayoutService → ConnectProvider | ✅ |
| Vendor scope separate | ✅ |
| Amendments in package 18 | ✅ |

**Governance nuance:** ADR-023 text says “Phase A implementation unlocked only.” CORE-002 + Implementation Gate + this full Draft package require **FIN-003 Approve** before any implement.  

**Resolution (proposed):** Treat ADR-023 as unlocking the *architecture*, not bypassing package Approve. **No implement until FIN-003 Status = Approved** and Phase A is explicitly authorized. Update ADR note at Approve if desired (non-blocking).

### ADR-024 (Accepted)

| Rule | Alignment |
|------|-----------|
| SaaS Billing separate from Connect | ✅ Dedicated `/api/webhooks/connect` |
| No reuse of `payment_customers` / SaaS customers for Connect | ✅ |
| No mixing invoice webhooks | ✅ |

### Implementation Gate (ADR-012)

| Rule | Alignment |
|------|-----------|
| Design → Document → Approve → Implement | ✅ Document complete; Approve pending; Implement closed |
| No code while Draft | ✅ Honored |

### CORE-002

| Rule | Alignment |
|------|-----------|
| Blocker 4 after Blocker 3 | ✅ Blocker 3 CLOSED |
| Serial money-out after portal | ✅ |
| Cert evidence required | ✅ [11](./11-acceptance-criteria.md) |

**Conflicts requiring redesign:** **None.**

---

## Security review

| Topic | Assessment |
|-------|------------|
| Webhook signatures + replay dedupe | Documented adequately for Approve |
| Idempotent transfers | Documented |
| Owner property ACL on reads | Documented; uses OWNER-001 scope |
| Least-privilege capabilities | Proposed `payout:onboard` / `payout:manage` (D10) |
| Secrets separation across rails | Documented |
| Fail closed on authz/signature | Documented |
| Cross-owner negative test in cert | Required in A5 / [11](./11-acceptance-criteria.md) |

**Residual security risk:** Interim org-wide owner ACL (OWNER-001) may over-expose pending amounts until allocation profiles + property scope are enforced on every payout row — mitigated by D1 + ACL filter requirement in acceptance criteria.

---

## Operational review

| Topic | Assessment |
|-------|------------|
| Retry / return / partial runs | Clear ([08](./08-failure-recovery.md), D8) |
| Manual intervention audited | Clear (A4, D9) |
| Monitoring signals | Listed in [06](./06-security-and-compliance.md) |
| Reconciliation job | Designed |
| Support path (Account Link remediation) | Clear |

**Ops gap (non-blocking for Approve):** Live runbooks and Stripe Dashboard access procedures are implement/ops deliverables, not doc blockers.

---

## Financial workflow review

| Stage | Documented | Decision |
|-------|------------|----------|
| Org settlement readiness | ✅ | — |
| Owner onboarding / KYC / bank | ✅ | D5, D11 |
| Eligibility | ✅ | — |
| Allocation + splits | ✅ | D1 |
| Reserves | ✅ | D2 |
| Schedule | ✅ | D4 |
| Pending / paid / failed / returned | ✅ | — |
| Negative net | ✅ | D3 |
| Clawback | ✅ | D9 |
| Notifications | ✅ | — |

Workflow is complete enough for Phase A–E planning without architectural redesign.

---

## Compliance review

| Topic | Assessment |
|-------|------------|
| Not a money transmitter / no fund holding | Binding in README + A1 + ADR-023 |
| Counsel confirmation | **Still required at Approve** (assumption, not engineering gap) |
| US + USD first | D6 |
| 1099 deferred with exportable totals | D7 |
| PCI (no PAN in FIN-003) | Pass |

---

## Open Questions — design resolutions

Each item: Recommendation · Rationale · Risks · Alternatives · Final proposed decision.

### Q1 — Ownership splits

| | |
|--|--|
| **Recommendation** | PM-configured allocation profiles (B) for v1 |
| **Rationale** | Unblocks Phase C without waiting on ownership entity schema; avoids dishonest equal split |
| **Risks** | PM misconfiguration; must validate Σ=100% |
| **Alternatives** | A ownership table (better long-term, slower); C equal split (rejected) |
| **Final proposed decision** | **D1 — Profiles for v1; path to ownership table** |

### Q2 — Multiple bank accounts

| | |
|--|--|
| **Recommendation** | Single default bank |
| **Rationale** | Express default destination sufficient |
| **Risks** | Owners wanting operating vs personal accounts |
| **Alternatives** | Multi-bank picker (deferred) |
| **Final proposed decision** | **D5** |

### Q3 — Reserve balances

| | |
|--|--|
| **Recommendation** | Allocation inputs, not Connect reserve accounts |
| **Rationale** | Custody simplicity; ADR-010 |
| **Risks** | PM must configure reserves correctly |
| **Alternatives** | Separate Stripe reserve account (rejected for v1) |
| **Final proposed decision** | **D2** |

### Q4 — Instant payouts

| | |
|--|--|
| **Recommendation** | Out of scope |
| **Rationale** | Not required for Blocker 4 |
| **Risks** | Competitive ask later |
| **Alternatives** | Enable Instant (requires amendment) |
| **Final proposed decision** | **D12** |

### Q5 — International

| | |
|--|--|
| **Recommendation** | US + USD only |
| **Rationale** | Launch risk control |
| **Risks** | Non-US owners blocked |
| **Alternatives** | Multi-country Connect matrix (deferred) |
| **Final proposed decision** | **D6** |

### Q6 — 1099

| | |
|--|--|
| **Recommendation** | No automation; exportable totals |
| **Rationale** | Separate tax product |
| **Risks** | Manual tax ops interim |
| **Alternatives** | Build 1099 in FIN-003 (rejected) |
| **Final proposed decision** | **D7** |

### Q7 — Negative balances

| | |
|--|--|
| **Recommendation** | Skip payout / show $0; no auto debit |
| **Rationale** | Avoid surprise owner debt |
| **Risks** | Accumulated deficits need PM process |
| **Alternatives** | Auto advances/clawbacks (rejected for v1) |
| **Final proposed decision** | **D3** |

### Q8 — Clawbacks

| | |
|--|--|
| **Recommendation** | Compensating transfer + audit; immutable paid rows |
| **Rationale** | Audit integrity |
| **Risks** | Ops complexity; legal playbook needed |
| **Alternatives** | Mutate history (rejected) |
| **Final proposed decision** | **D9** |

### Q9 — Destination-to-owner shortcut

| | |
|--|--|
| **Recommendation** | Defer; always settlement → owner |
| **Rationale** | Uniform reconciliation |
| **Risks** | Extra hop for single-owner properties |
| **Alternatives** | Shortcut now (deferred per ADR) |
| **Final proposed decision** | **D13** |

### Q10 — Capabilities

| | |
|--|--|
| **Recommendation** | `payout:onboard` + `payout:manage` |
| **Rationale** | Least privilege |
| **Risks** | Grant matrix work at implement |
| **Alternatives** | Reuse only `financial:*` (rejected) |
| **Final proposed decision** | **D10** |

### Q11 — Schedule cadence

| | |
|--|--|
| **Recommendation** | Monthly default + PM override |
| **Rationale** | Statement-aligned |
| **Risks** | Override misuse |
| **Alternatives** | Weekly-only / PM-only with no default |
| **Final proposed decision** | **D4** |

### Q12 — Remittance PDFs

| | |
|--|--|
| **Recommendation** | Optional / non-blocking |
| **Rationale** | History UI sufficient for cert |
| **Risks** | Some PMs want PDF remittance |
| **Alternatives** | Mandatory vault PDF (deferred) |
| **Final proposed decision** | **D14** |

### Q13 — Owner invitations

| | |
|--|--|
| **Recommendation** | Self-serve + PM nudge |
| **Rationale** | Lower friction; matches portal auth |
| **Risks** | Owners start KYC before PM ready |
| **Alternatives** | Mandatory PM invite (rejected) |
| **Final proposed decision** | **D11** |

---

## Remaining risks

| Risk | Level | Mitigation |
|------|-------|------------|
| Counsel has not yet signed custody framing | Medium | Approve includes Finance/Security; counsel note |
| Allocation profile misconfiguration | Medium | Σ=100% validation; PM preview before run |
| Interim owner ACL over-broad | Medium | Enforce property scope on every payout query |
| ADR-023 “Phase A unlocked” wording confusion | Low | Gate: package Approve required (this review) |
| Clawback legal playbook incomplete | Medium | Ops doc at Phase E; model allows compensating transfers |
| Stripe event name drift vs Connect API version | Low | Confirm at Phase A implement against Stripe version |

---

## Readiness assessment (except governance Approve)

| Prerequisite | Satisfied? |
|--------------|------------|
| ADR-023 / ADR-024 Accepted | ✅ |
| Blocker 3 Owner Portal CLOSED | ✅ |
| Full FIN-003 Document package | ✅ |
| Lifecycle / webhooks / UX / security / APIs documented | ✅ |
| Open Questions proposed resolutions | ✅ ([15](./15-decision-record.md)) |
| Acceptance criteria defined | ✅ |
| Custody invariants explicit | ✅ |
| Phase plan A–E | ✅ |
| Gate-owner **Approve** signatures | ❌ **Outstanding** |
| Counsel custody confirmation | ❌ Outstanding (Approve companion) |
| Stripe platform Connect settings in target env | ❌ Ops/implement (not a doc blocker) |
| Schema/API/code | ❌ Correctly locked until Approve |

**Conclusion:** Every **documentation/design** prerequisite for implementation is satisfied except **governance approval** (and counsel confirmation as part of Approve). Environment Stripe Connect setup is an implement/ops prerequisite, not a design gap.

---

## Recommendation

| Item | Decision |
|------|----------|
| Package status (at review) | **Approval Ready** (awaiting sign-off) |
| Package status (current) | ✅ **APPROVED** (2026-07-23 · Product Owner) |
| Phase A | ✅ **AUTHORIZED** |
| Phases B–E | 🔒 **LOCKED** |
| Next step | Await `BEGIN FIN-003 PHASE A IMPLEMENTATION` for Phase A code |

**Approved** upon Product Owner sign-off — see [13](./13-approval-checklist.md) · [16](./16-approval-summary.md).
