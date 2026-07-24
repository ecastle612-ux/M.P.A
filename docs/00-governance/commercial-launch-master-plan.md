# Commercial Launch Master Plan

**Type:** Documentation-only consolidation  
**Date:** 2026-07-23  
**Status:** Living plan — reflects post–governance-cleanup state  
**Policy:** [Implementation Gate](./implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)  
**Authoritative spine:** [CORE-002](../103-core-002-commercial-launch-blocker-execution/README.md)  
**Precedents:** [Project Roadmap Status](./project-roadmap-status.md) · [Governance Audit Closeout](./governance-audit-closeout.md)

> **This document does not authorize implementation.**  
> Any code, schema, Stripe, or UI work requires Design → Document → Approve → Implement per package and phase.

---

## 1. Executive Summary

Commercial readiness is **strong on money-in, owner self-serve, and certified money-out**, and **gated on remaining launch blockers** (push, performance, launch cert).

| Dimension | Assessment |
|-----------|------------|
| Live tenant rent collection | ✅ Certified (CORE-002 Blocker 1) |
| Vendor payments path | ✅ Certified (Blocker 2 / VENDOR-001 B) |
| Owner Portal MVP | ✅ Complete · Certified PASS (Blocker 3 / OWNER-001) |
| Owner payouts (Stripe Connect) | ✅ **CLOSED (PASS)** — FIN-003 package CERT PASS · [Blocker-4-Closeout](../103-core-002-commercial-launch-blocker-execution/Blocker-4-Closeout.md) · live enable ops-gated |
| Push commercial cert | ⏳ **ACTIVE** (Blocker 5 / PUSH-001) |
| Performance | 🔒 Queued / paused (Blocker 6 / EP-019) |
| Governance coherence | ✅ Healthy after audit closeout |
| Active commercial-spine focus | **Blocker 5** — PUSH-001 commercial certification |

**Readiness posture:** Platform is past Owner Portal and owner-payout commercial certification. Full commercial launch remains blocked until CORE-002 blockers 5–6 close, followed by launch certification toward readiness **≥ 9.5/10**. Commercial Launch is **not authorized**.

**Immediate next action:** Execute PUSH-001 real-device certification ([13](../99-push-001-pwa-push-commercial-certification/13-launch-readiness-execution.md) · [Blocker-5-Readiness](../103-core-002-commercial-launch-blocker-execution/Blocker-5-Readiness.md)). Recommended kickoff: `BEGIN PUSH-001 REAL-DEVICE CERTIFICATION`. Do not claim Commercial Launch.

**Development freeze:** [Development Freeze Checkpoint](./development-freeze-checkpoint.md) — Blocker 4 CLOSED; focus Blocker 5.

---

## 2. Completed Initiatives

| Initiative | Outcome | Evidence |
|------------|---------|----------|
| **CORE-001** | Commercial gap analysis / blocker definition (historical SoT) | [102](../102-core-001-commercial-platform-gap-analysis/README.md) — **Historical Snapshot**; live execution via CORE-002 |
| **CORE-002 Blockers 1–4** | CLOSED (PASS) | [103 README](../103-core-002-commercial-launch-blocker-execution/README.md) |
| — Blocker 1 | Live rent certification | [02](../103-core-002-commercial-launch-blocker-execution/02-blocker-1-live-rent-certification.md) |
| — Blocker 2 | Vendor payments | [VENDOR-001 18](../101-vendor-001-zero-friction-vendor-experience/18-phase-b-commercial-certification.md) |
| — Blocker 3 | Owner Portal | [Blocker-3-Closeout](../103-core-002-commercial-launch-blocker-execution/Blocker-3-Closeout.md) |
| — Blocker 4 | Owner Payouts | [Blocker-4-Closeout](../103-core-002-commercial-launch-blocker-execution/Blocker-4-Closeout.md) · [FIN-003 57](../98-fin-003-owner-payout-stripe-connect/57-fin003-package-certification.md) |
| **FIN-003** | Package CERTIFIED PASS · Blocker 4 CLOSED | [98](../98-fin-003-owner-payout-stripe-connect/README.md) · [57](../98-fin-003-owner-payout-stripe-connect/57-fin003-package-certification.md) |
| **PAY-001** | Verified (money-in predecessor) | [32](../108-pay-001-settlement-funding-foundation/32-package-certification.md) |
| **OWNER-001** | Phases 1–8 complete · CERTIFIED PASS · package closed | [104](../104-owner-001-commercial-owner-portal/README.md) · [28](../104-owner-001-commercial-owner-portal/28-owner-001-certification.md) |
| **Commercial Readiness Review** | OWNER-001 release recommendation COMPLETE; full launch still blocked on remaining CORE-002 | [29](../104-owner-001-commercial-owner-portal/29-commercial-readiness-review.md) |
| **Governance Audit** | G-1–G-5 resolved / intentional; single authoritative state | [project-roadmap-status](./project-roadmap-status.md) · [closeout](./governance-audit-closeout.md) |

Supporting completed spine inputs (not reopened here): API-005 rent path, BILL-001 Phase A, DPX-002 PASS, Canopy / Experience Architecture foundations.

---

## 3. Completed money-out initiative — FIN-003

| Field | Value |
|-------|-------|
| **Package** | [FIN-003 — Owner Payouts via Stripe Connect](../98-fin-003-owner-payout-stripe-connect/README.md) |
| **CORE-002 role** | Blocker 4 — ✅ **CLOSED** |
| **Status** | ✅ **APPROVED** (2026-07-23 · Product Owner) · Package ✅ **CERTIFIED PASS** |
| **Implementation** | Phases A–E ✅ delivered · package cert ✅ PASS · Blocker 4 ✅ CLOSED |
| **Phase A** | ✅ **COMPLETE · CERTIFIED PASS** — [23](../98-fin-003-owner-payout-stripe-connect/23-phase-a-certification.md) |
| **Phase B** | ✅ **COMPLETE · CERTIFIED PASS** — [28](../98-fin-003-owner-payout-stripe-connect/28-phase-b-certification.md) |
| **Phases C–E** | ✅ Delivered · C PASS · D CONDITIONAL PASS (residuals closed in E) · E COMPLETE |
| **Package cert** | ✅ **PASS** — [57](../98-fin-003-owner-payout-stripe-connect/57-fin003-package-certification.md) |
| **Design Review** | PASS — [14](../98-fin-003-owner-payout-stripe-connect/14-design-review.md) |
| **Approval Summary** | [16](../98-fin-003-owner-payout-stripe-connect/16-approval-summary.md) |
| **Closeout** | [Blocker-4-Closeout](../103-core-002-commercial-launch-blocker-execution/Blocker-4-Closeout.md) |

### Approval record ([13](../98-fin-003-owner-payout-stripe-connect/13-approval-checklist.md))

| Field | Value |
|-------|-------|
| Decision | **APPROVED** |
| Approved By | Product Owner |
| Date | 2026-07-23 |
| Phase A–E | ✅ Delivered · package CERTIFIED PASS |
| Blocker 4 | ✅ **CLOSED** — [Blocker-4-Closeout](../103-core-002-commercial-launch-blocker-execution/Blocker-4-Closeout.md) |

### Binding after Blocker 4 CLOSE

1. ✅ FIN-003 package certified PASS.  
2. ✅ Blocker 4 CLOSED.  
3. Live transfers remain ops-gated (`FIN003_TRANSFERS_ENABLED` + migrations + eligibility).  
4. Serial commercial focus advances to Blocker 5 (PUSH-001).  
5. Commercial Launch / GA require separate authorizations — **not** granted by Blocker 4 closeout.

---

## 4. Remaining Commercial Roadmap

Execution order is **serial for commercial blocker closure**. Package Approve ≠ permission to skip CORE-002 order.

```
✅ FIN-003 package CERTIFIED PASS · Blocker 4 CLOSED
    ↓
PUSH-001 — Blocker 5 commercial certification (ACTIVE focus)
    ↓
EP-019 — Blocker 6 performance (resume / cert-only path)
    ↓
Commercial Launch Certification (readiness ≥ 9.5)
    ↓
General Availability
    ↓
UI-001 — Future Release (not opened until launch blockers clear)
```

### Order rules (binding)

| Rule | Binding |
|------|---------|
| Do not mark Blocker 5 CLOSED without commercial cert | **Yes** |
| Do not claim Commercial Launch from Blocker 4 CLOSE | **Yes** |
| PUSH-001 package may be Approved / Implement unlocked | **Yes** — does **not** authorize claiming Blocker 5 CLOSED early |
| EP-019 remains paused / locked until Blocker 5 path allows | **Yes** |
| UI-001 after GA path — Future Release | **Yes** |
| ADMIN-002 Draft — not on commercial spine | Optional parallel only after its own Approve |

Closeout evidence: [Blocker-4-Closeout](../103-core-002-commercial-launch-blocker-execution/Blocker-4-Closeout.md) · package cert [57](../98-fin-003-owner-payout-stripe-connect/57-fin003-package-certification.md).

---

## 5. Commercial Launch Checklist

Single checklist for launch readiness. Items may be Partially Complete where prior certs exist; **unchecked does not authorize work** — each gap still follows the Implementation Gate.

### Security

- [ ] FIN-003 custody / Connect boundaries certified in production path
- [ ] Stripe secrets, webhook verification, and Connect account isolation verified
- [ ] RBAC: no cross-org / cross-role leakage on owner, tenant, manager, vendor, admin
- [ ] Impersonation / admin surfaces remain audit-logged (ADMIN-001)
- [ ] SaaS billing vs property money separation (ADR-024) held under payouts

### Performance

- [ ] EP-019 resumed and commercial performance bar met (or cert-only PASS)
- [ ] Critical portal routes within agreed latency budgets
- [ ] No launch-blocking P0 performance regressions on money paths

### Payments

- [x] Live tenant rent collection certified (Blocker 1)
- [x] Vendor payment path certified (Blocker 2)
- [x] Owner payouts: onboarding Eligible → transfer → remittance path certified (Blocker 4 / FIN-003) — [57](../98-fin-003-owner-payout-stripe-connect/57-fin003-package-certification.md) · [B4 Closeout](../103-core-002-commercial-launch-blocker-execution/Blocker-4-Closeout.md)
- [x] Failure, retry, and restricted-account behaviors verified (package cert / Phase C–E)
- [x] Ledger / reporting consistency for payouts (remittance + owner history; ops enable separate)

### Notifications

- [ ] PUSH-001 real-device commercial certification PASS (Blocker 5)
- [ ] Critical money and onboarding notification paths covered
- [ ] Preference / quiet-hour behavior respected where product requires

### Owner Portal

- [x] OWNER-001 MVP certified PASS (Blocker 3)
- [x] FIN-003 surfaces: onboarding / status / pending / completed honest (Phases A–D)
- [x] No payout placeholders claiming live money movement before Phase C+ (kill switch fail-closed)

### Tenant Portal

- [x] Rent pay path certified for launch scope
- [ ] Post–FIN-003 / push regression smoke on resident money + alerts

### Manager Portal

- [ ] Org Connect / settlement status operable for payout ops
- [ ] Allocation / schedule controls authorized only in approved FIN-003 phases
- [ ] Regression smoke after Blockers 4–5

### Vendor Portal

- [x] VENDOR-001 Phase B commercial cert PASS
- [ ] No accidental coupling to owner Connect payouts (ADR-004 separate)

### Documentation

- [x] CORE-002 / FIN-003 / OWNER-001 packages current
- [x] Governance audit closeout complete
- [ ] Launch runbooks for payouts, push, and incident response published
- [ ] Support playbooks updated for Connect KYC and payout failures

### Governance

- [x] Implementation Gate coherent (ADMIN-002 Draft; FIN-003 CERT PASS; Blocker 4 CLOSED; Blocker 5 focus)
- [x] Serial Blocker 4 → 5 documented
- [x] FIN-003 Approved (Product Owner 2026-07-23) · package CERTIFIED PASS · Blocker 4 CLOSED
- [x] Each FIN-003 phase unlock recorded before implement
- [ ] Commercial Launch Certification package/evidence accepted

### Support

- [ ] Escalation path for Connect verification stuck states
- [ ] Owner / PM guidance for payout eligibility and bank issues
- [ ] Known-issue list for GA week

### Operations

- [ ] Stripe Connect platform settings verified in production
- [ ] Job / schedule runners for payouts enabled only after Phase C authorize
- [ ] On-call ownership for money-out incidents

### Monitoring

- [ ] Alerts on Connect webhook failures, transfer failures, eligibility drops
- [ ] Dashboards for payout success rate and KYC backlog
- [ ] Audit log coverage for payout admin actions

### Disaster Recovery

- [ ] Stripe / Connect outage playbook
- [ ] Ability to pause schedules without corrupting ledger
- [ ] Backup / restore assumptions documented for payout-critical tables (post–schema)

---

## 6. Risk Register

### High

| Risk | Why it matters | Mitigation |
|------|----------------|------------|
| Premature live transfer enable without ops checklist | Production money-out incident | Kill switch + [56](../98-fin-003-owner-payout-stripe-connect/56-operations-runbook.md) · [B4 Closeout](../103-core-002-commercial-launch-blocker-execution/Blocker-4-Closeout.md) |
| Custody / money-transmitter mis-step | Legal / compliance launch killer | Custody invariants + ADR-023; no fund float; cert PASS held |
| Claiming Blocker 5 CLOSED without commercial cert | Governance / readiness false positive | Serial rule in CORE-002 + Blocker 5 evidence bar |
| Claiming Commercial Launch from Blocker 4 CLOSE | False launch readiness | Explicit non-claim in closeout |

### Medium

| Risk | Why it matters | Mitigation |
|------|----------------|------------|
| Allocation / split honesty (D1) | Wrong owner amounts | Profiles with Σ=100% before transfers; defer full ownership schema |
| Webhook / idempotency gaps | Duplicate or lost payouts | Catalog in FIN-003; money webhooks only in authorized phases |
| EP-019 still paused at launch window | Performance below bar | Cert-only path or resume after money-ops |
| Ops-only PUSH evidence mistaken for full Blocker 5 | Incomplete notification readiness | Distinguish evidence collection vs CLOSED |
| Support unready for KYC friction | Churn / ticket volume at GA | Runbooks before Phase A prod enablement |

### Low

| Risk | Why it matters | Mitigation |
|------|----------------|------------|
| ADMIN-002 Draft confusion | Distraction from spine | Documented as non-spine; Implement locked |
| CORE-001 historical FAIL rows misread | False urgency | Historical Snapshot banners |
| UI-001 pressure pre-GA | Scope creep | Future Release until blockers clear |
| Deferred Instant / international / 1099 (D6/D7/D12) | Feature requests | Explicit out of v1 |

---

## 7. Success Metrics

| Metric | Target / signal |
|--------|-----------------|
| Successful owner portal use | OWNER-001 already PASS; sustained zero P0 owner-home blockers |
| Successful payout onboarding | Owners/orgs reach **Eligible** via Connect Express (Phase A+) |
| Successful first payout | Settlement → owner transfer completes with remittance visibility (Phase C–E) |
| Push delivery | PUSH-001 real-device commercial cert PASS |
| Performance | EP-019 / Blocker 6 meets agreed budgets |
| Zero RBAC leaks | No cross-tenant/org data exposure in cert + monitoring |
| Audit coverage | Payout onboarding, status changes, transfers, admin actions logged |
| Production monitoring | Money-out alerts live before GA |
| Commercial readiness score | CORE-002 target **≥ 9.5/10** before GA |
| Governance compliance | No implement outside Approve + phase unlock |

---

## 8. Future Initiatives

Not on the critical path to first commercial GA. Do **not** open as substitutes for FIN-003 / Blockers 5–6.

| Initiative | Note |
|------------|------|
| **UI-001** | Future Release — after commercial launch blockers clear |
| **API improvements** | Incremental; gate per change |
| **Owner ACL migration** (`owner_property_access`) | Post–OWNER-001; intentional stub today |
| **Advanced accounting / full GL / trust** | ADR-010 territory — deferred |
| **Analytics** | Post-launch product; no spine displace |
| **Internationalization** | FIN-003 D6: US + USD only for v1 |
| **Instant payouts / 1099 automation** | D12 / D7 deferred |
| **Vendor Connect payouts** | ADR-004 — separate from owner FIN-003 |
| **ADMIN-002** | Draft — Approve when Product prioritizes (not launch-critical) |
| **BILL-001 Phases B–E** | Locked pending separate authorize |

---

## 9. Verification (this plan)

| Check | Result |
|-------|--------|
| No roadmap conflicts with CORE-002 | ✅ Same serial order 4 → 5 → 6 → cert → GA → UI-001 |
| No dependency conflicts | ✅ FIN-003 before PUSH Blocker 5 closure; Phase A before money phases |
| No implementation authorized outside governance | ✅ Phase A code awaits begin phrase; B–E locked; this plan docs-only |
| FIN-003 Approved · Phase A CERTIFIED · Phase B AUTHORIZED · C–E LOCKED | ✅ Consistent |
| ADMIN-002 not marked Approved | ✅ Draft |
| CORE-001 not treated as live scorecard | ✅ Historical Snapshot |

---

## 10. Launch readiness summary

| Area | State |
|------|-------|
| Money-in | Ready (certified) |
| Owner self-serve | Ready (OWNER-001 PASS) |
| Money-out | **Certified** (Blocker 4 CLOSED) — live enable ops-gated |
| Notifications / performance | Blocker 5 ACTIVE · Blocker 6 queued |
| Governance | Ready to govern next Approves |
| Overall | **Not GA** — critical path: Blockers 5–6 → Commercial Launch Certification |

### Remaining critical blockers

1. **PUSH-001 / Blocker 5** CLOSED  
2. **EP-019 / Blocker 6** CLOSED  
3. **Commercial Launch Certification** ≥ 9.5 → **GA**

---

## Related documents

| Doc | Role |
|-----|------|
| [Implementation Gate](./implementation-gate.md) | Binding policy |
| [Project Roadmap Status](./project-roadmap-status.md) | Package matrix |
| [Governance Audit Closeout](./governance-audit-closeout.md) | G-1–G-5 |
| [CORE-002](../103-core-002-commercial-launch-blocker-execution/README.md) | Blocker execution |
| [FIN-003](../98-fin-003-owner-payout-stripe-connect/README.md) | Money-out complete · Blocker 4 CLOSED |
| [PUSH-001](../99-push-001-pwa-push-commercial-certification/README.md) | Active Blocker 5 focus |
| [OWNER-001](../104-owner-001-commercial-owner-portal/README.md) | Completed portal MVP |
