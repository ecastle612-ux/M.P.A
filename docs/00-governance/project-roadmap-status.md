# Project Roadmap Status — Governance Audit

**Type:** Repository-wide governance audit (documentation only)  
**Date:** 2026-07-23  
**Policy:** [Implementation Gate](./implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)  
**Commercial execution:** [CORE-002](../103-core-002-commercial-launch-blocker-execution/README.md)  
**Cross-package implementation order:** [CORE-003](../113-core-003-implementation-master-plan/README.md) (✅ **APPROVED** · binding)

> **No implementation is authorized by this document.**  
> Audit only — statuses reflect repository evidence as of the audit date.

---

## 1. Commercial Launch roadmap (active spine)

```
CORE-001 (Approved · audit / roadmap)
    ↓
CORE-002 (Approved · blocker execution)
    ↓
┌─────────────────────────────────────────────────────────────┐
│  #1 Live rent cert     ✅ CLOSED (PASS)                     │
│  #2 Vendor payments    ✅ CLOSED (PASS)  VENDOR-001 B       │
│  #3 Owner Portal       ✅ CLOSED (PASS)  OWNER-001          │
│  #4 Owner Payouts      ✅ CLOSED (PASS)  FIN-003 · [B4 Closeout](../103-core-002-commercial-launch-blocker-execution/Blocker-4-Closeout.md) │
│  #5 Push notifications ⏳ ACTIVE         PUSH-001           │
│  #6 Performance        ⏳ QUEUED         EP-019             │
└─────────────────────────────────────────────────────────────┘
    ↓
CORE-003 (✅ APPROVED · binding M0–M6 order)
    ↓
Commercial Launch readiness target ≥ 9.5
    ↓
UI-001 (inherits UX-012 — Future Release polish package)
```

**Current choke points:** (1) M0 **NO-GO** — last gate **PMX-004 real-device cert ❌ FAIL / BLOCKED** ([35](../113-core-003-implementation-master-plan/35-pmx-004-real-device-certification.md); devices NOT RUN). Assign Galaxy/Pixel/iPhone operators → re-intake → Final M0 [36] only on PASS. Auth regression ✅ · REG-ACL-001 ✅ · three AUTH roles Deferred Slice D · REG-STOR/Infra/PAY/Perf CONDITIONAL ✅; (2) UX-012 A locked until M0 GO; (3) CORE-002 Blocker 5 (PUSH-001) — Blocker 4 ✅ CLOSED ([Blocker-4-Closeout](../103-core-002-commercial-launch-blocker-execution/Blocker-4-Closeout.md)).

**Master plan:** [Commercial Launch Master Plan](./commercial-launch-master-plan.md) · **Implementation order:** [CORE-003](../113-core-003-implementation-master-plan/README.md)

---

## 2. Active package status matrix

| Package ID | Status | Phase / slice | Implementation Gate | Dependencies | Owner (gate) | Next required action |
|------------|--------|---------------|---------------------|--------------|--------------|----------------------|
| **CORE-001** | Approved (superseded for execution) | Audit complete | N/A (docs-only package) | — | Product + Architect | Maintain as historical SoT; live status via CORE-002 |
| **CORE-002** | Approved · Blockers 1–4 CLOSED | Focus: Blocker 5 | PUSH-001 commercial cert | CORE-001 | Product + Architect + Commercial | Keep Blocker 5 serial; #6 only under parallel exception; Commercial Launch not authorized |
| **CORE-003** | ✅ **APPROVED** (2026-07-23) | M0 AUTHORIZED · **NO-GO** ([35](../113-core-003-implementation-master-plan/35-pmx-004-real-device-certification.md)) | N/A (governance · M0 blocked on devices) | COM/AUTH/FIN/OPS/PMX/UX (+ PAY-001 Verified) | Product + Architect + CTO | Assign device operators → PMX-004 PASS → [36] M0 GO; then await `AUTHORIZE UX-012 SLICE A` |
| **FIN-003** | ✅ **APPROVED** | Package ✅ **CERTIFIED PASS** | Blocker 4 ✅ **CLOSED** | ADR-023/024, OWNER-001, API-005, **PAY-001**, CORE-002 #4, **CORE-003** | Product Owner (2026-07-23) | Ops enable checklist only; [57](../98-fin-003-owner-payout-stripe-connect/57-fin003-package-certification.md) · [B4 Closeout](../103-core-002-commercial-launch-blocker-execution/Blocker-4-Closeout.md) |
| **PAY-001** | ✅ **Verified** ([32](../108-pay-001-settlement-funding-foundation/32-package-certification.md)) | Slice 1–3 ✅ · A1–A21 PASS | Q3b/Q4 before production enable | API-005, FIN-003 A/B org settlement, ADR-023/024 | Product Owner (2026-07-23) | Destination enable remains ops-gated; FIN-003 / Blocker 4 CLOSED |
| **OWNER-001** | COMPLETE · CERTIFIED PASS · Blocker 3 CLOSED | Phases 1–8 done | Implement **finished** / package closed | CORE-002 #3 | Product + Architect | None for MVP; material changes restart gate |
| **VENDOR-001** | Approved · Phase A/B PASS | B certified | Closed for B scope | CORE-002 #2 | Product + Architect | No active implement; Connect vendor payouts deferred |
| **API-005** | Approved · Implemented | Resident payments | Extended by PAY-001 (Approved · Slice 1) | — | Architect | Maintain; PAY-001 Slice 1 adds destination routing when kicked off |
| **BILL-001** | Approved · Phase A implemented | B–E locked | Phase A done; later phases locked | ADR-024 | Product + Architect | Operator sandbox walk / later phases when authorized |
| **AUTH-001** | ✅ **Approved with Amendments** | Slices A–E 🔒 | Implement **locked** until slice authorize | ADR-026, BILL-001, ADR-003/014, **COM-001**, **CORE-003** | Product + Architect + Security | After M0 + UX-A + OPS-A Validated: `AUTHORIZE AUTH-001 SLICE A` |
| **COM-001** | ✅ **Approved with Amendments** | Slices A–E 🔒 | Implement **locked** until slice authorize | AUTH-001, BILL-001, FIN-003 (SoC), ADR-027, **CORE-003** | Product + Commercial + Architect + Finance | M2 after AUTH-B path; do not Authorize before M1 complete |
| **OPS-001** | ✅ **Approved with Amendments** | Slices A–E 🔒 | Implement **locked** until slice authorize | ADR-005, ADR-028, MHF-001, API-001, EML-001, **CORE-003** | Product + Architect + Platform | After M0 + UX-A Validated: `AUTHORIZE OPS-001 SLICE A` |
| **UX-012** | ✅ **Approved with Amendments** | Slices A–E 🔒 | Implement **locked** until slice authorize | Canopy Approved, OPS-001, ADR-029, UI-001 inherits, **CORE-003** | Product + UX + Architect | **Next code unlock after M0:** `AUTHORIZE UX-012 SLICE A` |
| **PUSH-001** | Approved · Implement unlocked | Real-device cert pending | Unlocked (ops cert) | API-001/001A | Product + Architect | **Active** Blocker 5 — [Blocker-5-Readiness](../103-core-002-commercial-launch-blocker-execution/Blocker-5-Readiness.md); `BEGIN PUSH-001 REAL-DEVICE CERTIFICATION` |
| **EP-019** | Paused · ❌ Not Approved · Implement locked | None (locked) | Locked | UX-009 complete + Blocker 5 CLOSE | Architect | Blocker 6 **QUEUED** — [Blocker-6-Readiness](../103-core-002-commercial-launch-blocker-execution/Blocker-6-Readiness.md); do not Approve until UX-009 complete + serial allows |
| **EP-017** | Approved for Implement | Pilot readiness | In progress / scoreboard | EP-016 | Commercial + Architect | Refresh score after CORE-002 blockers close |
| **DPX-001** | Approved · Implement unlocked | Philosophy + measurement | Unlocked within scope | — | Product | Ongoing filter for product work |
| **DPX-002** | Approved · PASS | Daily workflow cert | Closed (PASS) | DPX-001 | Product | Freeze binds successors |
| **DPX-003** | Approved · Implement unlocked | Commercial polish | Unlocked within scope | DPX-002 | Product | No new modules; polish only |
| **ADMIN-001** | Approved · Implement unlocked | Impersonation | Unlocked | — | Architect | Maintain |
| **ADMIN-002** | 📝 **Draft — Awaiting Approval** | Role switcher | Implement **locked** | ADMIN-001 | Architect | Approve when prioritized (not commercial spine) |
| **ADMIN-003** | Approved · Slice A unlocked | Ops center | Slice A only | ADMIN-001 | Architect | Stay within Slice A |
| **FIN-001** | Approved · Implemented (reporting foundation) | — | Complete for foundation | — | Architect | Consume-only for owners via OWNER-001 |
| **UI-001** | Future Release | Not opened | Locked | Commercial Launch | Product | Do not open until launch blockers clear |

---

## 3. Package buckets

### Completed / CLOSED (commercial spine)

| Package | Evidence |
|---------|----------|
| CORE-002 Blocker 1 | Live rent certification |
| CORE-002 Blocker 2 | VENDOR-001 Phase B cert |
| CORE-002 Blocker 3 | OWNER-001 cert + closeout |
| OWNER-001 | Phases 1–8 + certification PASS |
| DPX-002 | PASS |
| API-005 (rent path) | Implemented · Blocker 1 PASS |

### Approved (implement finished or unlocked within slice)

| Package | Note |
|---------|------|
| CORE-001 / CORE-002 | Execution packages |
| VENDOR-001 | A/B PASS |
| BILL-001 | Phase A implemented; B–E locked |
| PUSH-001 | Approved · Implement unlocked · Blocker 5 **ACTIVE** commercial focus |
| DPX-001 / DPX-003 | Unlocked within scope |
| ADMIN-001 / ADMIN-003 Slice A | Unlocked |
| Canopy / Experience Architecture | Approved foundations |
| **FIN-003** | ✅ APPROVED · Package ✅ CERTIFIED PASS · Blocker 4 ✅ CLOSED · live transfers ops-gated |
| **PAY-001** | ✅ **VERIFIED** ([32](../108-pay-001-settlement-funding-foundation/32-package-certification.md)) · Slice 1–3 COMPLETE · Q4/Q3b before production enable |

### Draft / Awaiting Approval

| Package | Note |
|---------|------|
| ADMIN-002 | Authoritative Draft — gate registry corrected (see [closeout](./governance-audit-closeout.md)) |

### Paused / Blocked

| Package | Reason |
|---------|--------|
| EP-019 | Paused behind UX-009 / sequencing; CORE-002 #6 later |
| BILL-001 B–E | Locked pending phase authorize |

### Future Release

| Item | Note |
|------|------|
| UI-001 | Future Release — principles package opened · Implement locked ([107](../107-ui-001-platform-experience/README.md)) |
| FIN-003 Instant / international / 1099 automation | Deferred decisions D6/D7/D12 |
| Vendor Connect payouts | ADR-004 separate |
| Full GL / trust accounting | ADR-010 |
| `owner_property_access` schema | Post–OWNER-001 |

### Implementation Authorized (active code work allowed)

| Package | Authorized slice |
|---------|------------------|
| **PAY-001 Slice 1** | ✅ PASS ([18](../108-pay-001-settlement-funding-foundation/18-slice-1-final-certification.md)) |
| **PAY-001 Slice 2** | ✅ PASS ([26](../108-pay-001-settlement-funding-foundation/26-slice-2-final-certification.md)) |
| **PAY-001 package** | ✅ **VERIFIED** — [32](../108-pay-001-settlement-funding-foundation/32-package-certification.md); destination enable ops-gated |
| **FIN-003 package** | ✅ **CERTIFIED PASS** · Blocker 4 ✅ **CLOSED** — [Blocker-4-Closeout](../103-core-002-commercial-launch-blocker-execution/Blocker-4-Closeout.md) |
| PUSH-001 | Package unlocked; **Blocker 5 current commercial focus**; closure not yet claimed |
| ADMIN-003 Slice A / DPX polish | Unlocked but must not displace CORE-002 serial Blocker 5 |

---

## 4. Implementation Gate verification

### Checks performed

| Check | Result |
|-------|--------|
| Implementation begun before approval (FIN-003) | ✅ Pass — no Stripe/payout code authorized; docs only |
| OWNER-001 implement after Approve | ✅ Pass — phased authorize → complete → closed |
| Draft package marked implemented | ✅ No FIN-003 implement claim |
| Approval Ready marked Approved | ✅ FIN-003 correctly **APPROVED** (2026-07-23) |
| Approved package missing implement status | ✅ Pass — Phase 4/5 registry rows marked COMPLETE |
| ADMIN-002 status conflict | ✅ **Resolved** — Draft authoritative ([closeout](./governance-audit-closeout.md)) |

### Governance inconsistencies

| ID | Issue | Status |
|----|-------|--------|
| G-1 | ADMIN-002 Approved vs Draft | ✅ **Resolved** — Draft authoritative |
| G-2 | Stale Phase 4/5 “in progress” | ✅ **Resolved** — marked COMPLETE |
| G-3 | CORE-001 read as live | ✅ **Resolved** — Historical Snapshot banners |
| G-4 | ADR-023 Phase A wording | ✅ Intentional exception (package Approve wins) |
| G-5 | PUSH-001 vs serial Blocker 5 | ✅ **Resolved** — serial for blocker closure documented |

**Closeout:** [governance-audit-closeout.md](./governance-audit-closeout.md)

**No finding** that FIN-003 or OWNER-001 violated the gate.

---

## 5. Dependency graph (documentation)

```
CORE-001 ──(defines P0 blockers)──► CORE-002
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
              Blocker 1           Blocker 2         Blocker 3
           EP-017/API-005       VENDOR-001 B       OWNER-001
              ✅ CLOSED           ✅ CLOSED          ✅ CLOSED
                                      │
                                      ▼
                                 Blocker 4
                                  FIN-003
                         ✅ CLOSED (PASS) · package CERT PASS
                                      │
                                      ▼
                                 Blocker 5
                                 PUSH-001
                            Approved · ACTIVE focus
                                      │
                                      ▼
                                 Blocker 6
                                  EP-019
                                 Paused/queued
                                      │
                                      ▼
                            Commercial Launch
                           (readiness ≥ 9.5)
                                      │
                                      ▼
                                   UI-001
                              (Future Release)
```

### Supporting dependencies (FIN-003)

```
ADR-023 (Accepted) ──┐
ADR-024 (Accepted) ──┼──► FIN-003 design
API-005 ledger ──────┤
OWNER-001 placeholders
Notification / RBAC / Jobs / Audit
```

---

## 6. Roadmap status (summary)

| Track | State |
|-------|-------|
| Commercial money-in (rent) | ✅ Closed |
| Vendor payments | ✅ Closed |
| Owner Portal | ✅ Closed |
| Owner Payouts | ✅ **CLOSED (PASS)** — FIN-003 package CERT PASS · [Blocker-4-Closeout](../103-core-002-commercial-launch-blocker-execution/Blocker-4-Closeout.md) |
| Push commercial cert | ⏳ **Active** (#5) |
| Performance cert | Queued/paused (#6) |
| SaaS billing | Phase A done; not a CORE-002 blocker |
| Future UI-001 | Not opened |

**Commercial readiness:** Still tracking ~8.3/10 baseline (EP-017) until Blockers 5–6 close and score is re-measured. Commercial Launch **not authorized**.

---

## 7. Recommendation for next engineering effort

### Primary (gate-correct)

**Execute CORE-002 Blocker 5 — PUSH-001 commercial certification / closeout path.**

- ✅ Blocker 4 CLOSED ([Blocker-4-Closeout](../103-core-002-commercial-launch-blocker-execution/Blocker-4-Closeout.md))  
- ✅ FIN-003 package CERTIFIED PASS ([57](../98-fin-003-owner-payout-stripe-connect/57-fin003-package-certification.md))  
- Do **not** claim Blocker 5 CLOSED without commercial cert evidence  
- Do **not** authorize Commercial Launch  

### Secondary (ops / deployment — not Blocker 4 reopen)

- FIN-003 / PAY-001 production enable checklist (`FIN003_TRANSFERS_ENABLED`, migrations, destination readiness)  
- Optional live Stripe drill archival per [56](../98-fin-003-owner-payout-stripe-connect/56-operations-runbook.md)

### Do not recommend

- Reopening FIN-003 phases for Blocker 4  
- Opening UI-001  
- Skipping to EP-019 / Blocker 6 closure as a substitute for Blocker 5  
- Claiming Commercial Launch / GA

---

## 8. Audit sign-off (documentation)

| Item | Result |
|------|--------|
| Active commercial spine audited | ✅ |
| FIN-003 gate integrity | ✅ APPROVED · Package CERTIFIED PASS · Blocker 4 CLOSED |
| Inconsistencies | ✅ G-1–G-5 resolved / intentional — [closeout](./governance-audit-closeout.md) |
| Next effort | **Blocker 5 — PUSH-001 commercial certification** |

---

## Related

- [Implementation Gate](./implementation-gate.md)  
- [Definition of Done](./definition-of-done.md)  
- [CORE-002](../103-core-002-commercial-launch-blocker-execution/README.md)  
- [FIN-003 Approval Summary](../98-fin-003-owner-payout-stripe-connect/16-approval-summary.md)  
