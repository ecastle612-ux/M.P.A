# 13 — Approval Checklist

**Package:** FIN-003 — Owner Payouts via Stripe Connect  
**Status:** ✅ **APPROVED** (2026-07-23) · Phase A/B ✅ **CERTIFIED PASS** · Phase C ✅ **AUTHORIZED** ([37](./37-phase-c-authorization.md)) · D–E 🔒 **LOCKED**
**Gate:** Design → Document → **Approve** → Implement  
**Design Review:** [14](./14-design-review.md) · Decisions: [15](./15-decision-record.md) · Summary: [16](./16-approval-summary.md) · Phase A: [17](./17-phase-a-readiness.md) · Phase B: [25](./25-phase-b-authorization.md)

> **Governance package APPROVED** by Product Owner (2026-07-23).  
> **Phase A is COMPLETE · CERTIFIED PASS.**  
> **Phase B is AUTHORIZED** (governance unlock only) — [25](./25-phase-b-authorization.md).  
> **Do not begin Phase B code** until explicit: `BEGIN FIN-003 PHASE B IMPLEMENTATION`.  
> **Phase C AUTHORIZED** ([37](./37-phase-c-authorization.md)) · D–E remain LOCKED · Blocker 4 OPEN.

---

## Pre-Approve verification

| # | Check | Done |
|---|-------|------|
| 1 | ADR-023 Accepted and reflected in this package | ☑ |
| 2 | ADR-024 separation respected (no SaaS mixing) | ☑ |
| 3 | Custody invariants documented (no money transmitter / no fund holding) | ☑ |
| 4 | Lifecycle stages complete ([05](./05-payout-lifecycle.md)) | ☑ |
| 5 | Webhook catalog documented ([07](./07-webhook-processing.md)) | ☑ |
| 6 | Owner UX states documented ([09](./09-user-experience.md)) | ☑ |
| 7 | Integration with OWNER-001 / API-005 / notifications / RBAC / jobs | ☑ |
| 8 | Open Questions resolved with proposed decisions ([12](./12-open-questions.md) · [15](./15-decision-record.md)) | ☑ |
| 9 | Acceptance criteria defined ([11](./11-acceptance-criteria.md)) | ☑ |
| 10 | Binding amendments recorded ([18](./18-amendments-approval.md)) | ☑ |
| 11 | Design Review complete ([14](./14-design-review.md)) | ☑ |
| 12 | Implement remains locked until Approve | ☑ |
| 13 | No code / migrations / APIs shipped under this package | ☑ |

---

## Approve decisions required

Confirm or amend the **proposed decisions** in [15](./15-decision-record.md) (D1–D14), especially:

- D1 Ownership splits (allocation profiles)  
- D2 Reserves  
- D3 Negative balances  
- D10 Capability model  
- D6 / D7 / D12 International · 1099 · Instant scope  

Full table appears in the Approval Brief below.

---

## Approval Brief

*Read this brief before signing. Full detail: [16](./16-approval-summary.md) · [15](./15-decision-record.md) · [17](./17-phase-a-readiness.md).*

### Executive summary

FIN-003 designs **owner payouts via Stripe Connect Express** for CORE-002 **Blocker 4**. Design → Document → Design Review are complete. The package is **APPROVED** (2026-07-23 · Product Owner).

Approval authorizes **documentation status → Approved** and unlocks **Phase A only** (Connect onboarding + status; **no money movement**). It does **not** authorize Phases B–E, Stripe transfer code, payout schedules, or commercial Blocker 4 CLOSE.

### Scope of FIN-003

| In scope (package design) | Out of scope |
|---------------------------|--------------|
| Owner distributions of net proceeds via Connect Express | Money transmitter / platform fund float |
| Org settlement Express → Owner Express routing | SaaS billing mix (BILL-001 / ADR-024) |
| Fees, splits, schedules, retry, clawback **policy** | Full GL / trust accounting (ADR-010) |
| Owner Portal status / history **integration contract** | Vendor Connect marketplace (ADR-004) |
| `OwnerPayoutService` → `ConnectProvider` boundary | Instant payouts (D12); international (D6); 1099 automation (D7) |

### Key architectural decisions (D1–D14) — Approved

| ID | Topic | Proposed decision |
|----|-------|-------------------|
| D1 | Ownership splits | PM allocation profiles (v1); path to ownership table |
| D2 | Reserves | Allocation inputs (not Connect reserve accounts) |
| D3 | Negative balances | Skip / $0; no auto debit |
| D4 | Schedule | Monthly default + PM override |
| D5 | Bank accounts | Single default via Express |
| D6 | International | US + USD only |
| D7 | 1099 | No automation; exportable totals |
| D8 | Retry | Max 3 transient; no retry if restricted |
| D9 | Clawback | Compensating transfer + audit only |
| D10 | Capabilities | `payout:onboard`, `payout:manage` |
| D11 | Invitations | Self-serve + PM nudge |
| D12 | Instant payouts | Out of scope v1 |
| D13 | Destination shortcut | Defer (settlement → owner always) |
| D14 | Remittance PDF | Optional / non-blocking |

### Risks accepted (at Approve of this design)

| Risk | Acceptance posture |
|------|-------------------|
| Interim owner ACL may be broader than future allocation profiles until Phase C | Documented; Phase A is status-only |
| US/USD-only launch (D6) | Explicit commercial constraint |
| No 1099 automation (D7) | Exportable totals only |
| Allocation profiles before full ownership schema (D1) | Unblocks Phase C without blocking Phase A |
| ADR-023 “Phase A unlocked” language | Subordinated: **package Approve still required** before any code |

### Risks deferred (not accepted as Phase A work)

| Risk / item | Deferred to |
|-------------|-------------|
| Money movement / transfers / schedules | Phase C+ |
| Split math & reserve application in product | Phase C (D1/D2) |
| Clawback legal/ops playbook depth | Phase E |
| Remittance PDF pipeline | Phase E / optional (D14) |
| Instant / international / 1099 automation | Future Approve amendments |
| Counsel formal custody opinion | Expected at/with Approve; not a substitute for engineering Phase A unlock alone |

### ADR-023 compliance

| Check | Result |
|-------|--------|
| Connect Express for owners | ✅ |
| No platform float / money transmitter posture | ✅ |
| Destination → org settlement → owner Express | ✅ |
| Provider boundary (no Stripe SDK in business modules) | ✅ |
| Package Approve before code (Gate wins over ADR wording) | ✅ |

### ADR-024 compliance

| Check | Result |
|-------|--------|
| SaaS Billing rail separate from Connect payouts | ✅ |
| No shared Customers / webhooks / Connect accounts with BILL-001 | ✅ |
| Tenant rent (API-005) remains upstream SoR for rent facts | ✅ |

### Phase A scope (only slice unlockable by this Approve)

| Include | Exclude |
|---------|---------|
| Org + owner Express onboarding (Account Link / approved embedded) | Scheduled payouts |
| Persist connection / verification / eligibility status | Transfers / money movement |
| Read-only status in Owner Portal / PM org surfaces | Allocation profiles & reserve math |
| Account-status webhooks if needed for KYC mirror | Transfer/payout money webhooks |
| Prove `ConnectProvider` boundary | Instant / international / 1099 |

Authoritative boundaries: [17 — Phase A readiness](./17-phase-a-readiness.md).

### Out-of-scope items (reminders)

- Stripe SDK / schema / APIs / UI **until** Approved + Phase A unlock  
- Phases B–E without separate authorize  
- Vendor payouts, full trust accounting, Instant payouts  

### Recommendation

**Recommend Approve** (or Approve with amendments to D1–D14) for **Phase A authorization only**, after counsel custody confirmation as Finance/Commercial requires.

**Do not** treat Approve as commercial Blocker 4 CLOSE or as permission to implement transfers.

---

## Role review sections

*Each approver should complete their section before signing. Check ☑ when reviewed.*

### Product

| Focus | Review prompts | Done |
|-------|----------------|------|
| **Business scope** | FIN-003 correctly scopes owner money-out for Blocker 4; D6/D7/D12 deferrals acceptable commercially | ☑ |
| **User experience** | Owner Portal status/onboarding path ([09](./09-user-experience.md)) is honest; no fake “paid” before transfers exist | ☑ |
| **Commercial readiness** | Phase A–E plan and D1–D14 support a credible path to Blocker 4 PASS without over-scoping v1 | ☑ |

**Product notes / amendments:**  
Product Owner Approval (2026-07-23) authorizes the FIN-003 governance package and Phase A only. Phases B–E remain locked.

### Lead Architect

| Focus | Review prompts | Done |
|-------|----------------|------|
| **Architecture** | `OwnerPayoutService` → `ConnectProvider`; Express routing; phase locks A→E coherent with [02](./02-system-architecture.md) / ADR-023 | ☐ |
| **Reuse of existing systems** | OWNER-001 host, API-005 ledger SoR, notifications, jobs, vault — no parallel payment stack | ☐ |
| **Technical boundaries** | Phase A excludes transfers; schema/API invent only within authorized phase later; no Stripe in domain modules | ☐ |

**Lead Architect notes / amendments:**  
________________________________________________________________________________

### Security

| Focus | Review prompts | Done |
|-------|----------------|------|
| **RBAC** | D10 `payout:onboard` / `payout:manage`; owner history under `financial:read` + ACL acceptable | ☐ |
| **Secrets** | Connect keys / webhook secrets server-only; separate from SaaS and rent rails | ☐ |
| **Webhooks** | Signature verify, dedupe, Connect rail isolation ([07](./07-webhook-processing.md)); Phase A limited to account-status | ☐ |
| **Audit** | Onboarding and status changes auditable; paid history immutable (D9) for later phases | ☐ |
| **Compliance assumptions** | Custody / money-transmitter posture understood; counsel path noted | ☐ |

**Security notes / amendments:**  
________________________________________________________________________________

### Finance / Commercial

| Focus | Review prompts | Done |
|-------|----------------|------|
| **Custody model** | No M.P.A. float; Stripe moves money; ledger remains SoR for rent facts | ☐ |
| **Stripe Connect separation** | Owner Connect ≠ SaaS Billing ≠ tenant Checkout; three rails clear | ☐ |
| **Payout lifecycle** | Stages in [05](./05-payout-lifecycle.md) adequate for v1; D3/D8/D9 acceptable | ☐ |
| **Commercial assumptions** | US/USD, no Instant, no 1099 automation; fee/transparency expectations OK | ☐ |

**Finance / Commercial notes / amendments:**  
________________________________________________________________________________

---

## Final approval statement

> **By signing below, the approver confirms that FIN-003 is approved for Phase A implementation only.**  
> **Approval does not authorize Phases B–E.**  
> **Approval does not authorize money movement, transfers, schedules, allocation execution, or Blocker 4 commercial CLOSE.**  
> Phase A may begin only after: (1) all required signatures are recorded, (2) package Status is set to **Approved**, and (3) Phase A is explicitly unlocked per [17](./17-phase-a-readiness.md) and the Implementation Gate registry.  
> Until those steps complete, **implementation remains locked**.

---

## Sign-off

| Role | Name | Date | Decision |
|------|------|------|----------|
| Product | Product Owner | 2026-07-23 | **Approve** |
| Lead Architect | — | — | Covered by Product Owner Approval (governance package) |
| Security | — | — | Covered by Product Owner Approval (governance package) |
| Finance / Commercial | — | — | Covered by Product Owner Approval (governance package) |

### Official approval record

| Field | Value |
|-------|-------|
| **Decision** | **APPROVED** |
| **Approved By** | Product Owner |
| **Date** | 2026-07-23 |
| **Scope** | FIN-003 Governance Package |
| **Phase A** | ✅ **COMPLETE · CERTIFIED PASS** |
| **Phase B** | ✅ **COMPLETE · CERTIFIED PASS** — [28](./28-phase-b-certification.md) |
| **Phase C** | ✅ **AUTHORIZED** — [37](./37-phase-c-authorization.md) · code awaits kickoff |
| **Phases D–E** | 🔒 **LOCKED** |

### On Approve (governance operators — completed 2026-07-23)

1. ✅ Set [README](./README.md) Status → **Approved**.  
2. ✅ Mark [15](./15-decision-record.md) decisions as Approved.  
3. ✅ Record approval in [18](./18-amendments-approval.md).  
4. ✅ Update [CORE-002](../103-core-002-commercial-launch-blocker-execution/README.md) Blocker 4 for Approved + Phase A slice.  
5. ✅ Update [Implementation Gate](../00-governance/implementation-gate.md) registry: **Phase A authorized only**.  
6. ✅ Unlock **Phase A only** — **not** Phases B–E.

### Phase B authorization (governance operators — completed 2026-07-23)

1. ✅ Readiness review — Phase A certified; [24](./24-phase-b-planning.md) complete — [25](./25-phase-b-authorization.md).  
2. ✅ Authorize **Phase B only** — Phases C–E remain locked.  
3. ✅ Update Implementation Gate + roadmap pointers.  
4. 🔒 Code awaits `BEGIN FIN-003 PHASE B IMPLEMENTATION`.

---

## Implementation authorization boundary (verify)

| Item | Authorized? |
|------|-------------|
| Package → **Approved** | ✅ Yes (governance) |
| **Phase A** implement (onboarding/status) | ✅ Complete · Certified PASS |
| **Phase B** (owner onboarding polish) | ✅ Complete · Certified PASS — [28](./28-phase-b-certification.md) |
| Phase C (allocation + transfers / money movement) | ✅ **AUTHORIZED** — code awaits kickoff — [37](./37-phase-c-authorization.md) |
| Phase D–E | **No** — 🔒 LOCKED |
| Stripe money-movement APIs / transfer schema | 🔒 Until Phase C kickoff |

### Phase C authorization (governance operators — completed 2026-07-23)

1. ✅ Docs readiness [35](./35-phase-c-readiness-amendments.md) · [36](./36-phase-c-authorization-readiness.md).  
2. ✅ Authorize **Phase C only** — [37](./37-phase-c-authorization.md).  
3. ✅ Phases D–E remain locked; Blocker 4 OPEN.  
4. 🔒 Code awaits `BEGIN FIN-003 PHASE C IMPLEMENTATION`.

---

## Implementation Gate reminder

> **FIN-003 Status is APPROVED.** Phase A/B **CERTIFIED PASS**.  
> **Phase C is AUTHORIZED** (governance) — [37](./37-phase-c-authorization.md).  
> **Do not begin Phase C code** until explicit: `BEGIN FIN-003 PHASE C IMPLEMENTATION`.  
> Phases D–E remain **LOCKED**. Blocker 4 remains **OPEN**.
