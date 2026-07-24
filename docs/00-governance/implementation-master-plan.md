# Implementation Master Plan — Platform Operational Execution

**Type:** Operational reporting document (documentation only)  
**Date:** 2026-07-23  
**Status:** Living report — reflects governed package evidence as of date  
**Policy:** [Implementation Gate](./implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)

> **This document does not authorize implementation.**  
> It does **not** change package status, approve packages, unlock slices/phases, or replace [CORE-002](../103-core-002-commercial-launch-blocker-execution/README.md).  
> It is the **single operational execution plan / reporting view** across governed packages.  
> Commercial blocker closure order remains owned by **CORE-002**.  
> Proposed cross-package sequence design lives in [CORE-003](../113-core-003-implementation-master-plan/README.md) (**Ready for Approve** — not yet binding).

**Sources of truth (status):** Package READMEs + [project-roadmap-status](./project-roadmap-status.md) + [implementation-gate](./implementation-gate.md) + [commercial-launch-master-plan](./commercial-launch-master-plan.md). Where trackers lag package READMEs, **package README wins** for that package.

---

## 1. Executive summary

| Dimension | State |
|-----------|--------|
| Commercial spine (CORE-002) | Blockers **1–4 CLOSED (PASS)**; **Blocker 5 ACTIVE** (PUSH-001); Commercial Launch not authorized |
| Money-in settlement (PAY-001) | ✅ **Verified** ([32](../108-pay-001-settlement-funding-foundation/32-package-certification.md)) · Slice 1–3 COMPLETE · live destination enable ops-gated ([26](../113-core-003-implementation-master-plan/26-pay-001-production-closeout.md)) |
| Money-out (FIN-003) | Package ✅ **CERTIFIED PASS** · Blocker 4 ✅ **CLOSED** · live transfers ops-gated |
| Platform architecture packages | AUTH / COM / OPS / UX-012 **Approved with Amendments** · all slices 🔒 until authorize |
| Native PWA (PMX-004) | Phase 1 code+deploy done · device Final PASS incomplete · Phase 2+ 🔒 |
| Cross-package order (CORE-003) | Documented · **Awaiting Approve** (not binding yet) |
| Commercial readiness | Below ≥ 9.5 target until Blockers 5–6 + launch cert |

**Current engineering focus (gate-correct):**  
1. **PUSH-001 / Blocker 5** commercial certification path  
2. Ops (non-reopening): PAY-001 destination enable + FIN-003 `FIN003_TRANSFERS_ENABLED` checklist  
3. Optional parallel (non-displacing): PMX-004 Phase 1 device evidence; ADMIN-003 Slice A / DPX polish within unlock

---

## 2. Package inventory (governed)

Legend: **Completed** · **Approved** · **Draft** · **Locked** · **Future** · **Paused**

### 2.1 Commercial launch spine (CORE-002)

| Package / unit | Bucket | Status | Depends on | Next gate action |
|----------------|--------|--------|------------|------------------|
| CORE-001 | Completed | Historical SoT | — | Maintain |
| CORE-002 #1 Live rent | Completed | CLOSED PASS | API-005 / EP-017 | — |
| CORE-002 #2 Vendor payments | Completed | CLOSED PASS | VENDOR-001 B | — |
| CORE-002 #3 Owner Portal | Completed | CLOSED PASS | OWNER-001 | — |
| CORE-002 #4 Owner Payouts | Approved / Active | OPEN — FIN-003 A/B done; C–E locked | PAY-001 Verified → FIN-003 C–E | Authorize FIN-003 C only after PAY Verified |
| CORE-002 #5 Push | Approved / Queued | Serial after #4 | PUSH-001, API-001 | Do not close before #4 |
| CORE-002 #6 Performance | Paused | Queued | EP-019 | Resume after money-ops sequencing |
| Commercial Launch cert | Future | Not started | #4–#6 | Readiness ≥ 9.5 |
| GA | Future | Not started | Launch cert | — |

### 2.2 Money path

| Package / unit | Bucket | Status | Depends on | Next gate action |
|----------------|--------|--------|------------|------------------|
| API-005 | Completed | Approved · Implemented | — | Maintain; extended by PAY-001 |
| PAY-001 Slice 1 | Completed | PASS | API-005, FIN-003 org settlement | — |
| PAY-001 Slice 2 | Completed | ✅ **PASS** ([26](../108-pay-001-settlement-funding-foundation/26-slice-2-final-certification.md)) | Slice 1 | C1–C7 closed |
| PAY-001 Slice 3 | Completed | ✅ COMPLETE | Slice 2 PASS | Ops/docs + readiness helpers |
| PAY-001 Verified (A1–A21) | Completed | ✅ **VERIFIED** ([32](../108-pay-001-settlement-funding-foundation/32-package-certification.md)) | Slice 3 + matrix | Live destination still needs PR3/PR5/PR6 |
| FIN-003 Phase A | Completed | CERTIFIED PASS | ADR-023/024, OWNER-001 | — |
| FIN-003 Phase B | Completed | CERTIFIED PASS | Phase A | — |
| FIN-003 Phase C | Locked | Locked | **PAY-001 Verified** + authorize | No transfers until then |
| FIN-003 Phase D | Locked | Locked | Phase C | — |
| FIN-003 Phase E / Blocker 4 CLOSE | Locked | Locked | Phase D | — |
| BILL-001 Phase A | Completed | Implemented | ADR-024 | — |
| BILL-001 B–E | Locked | Locked | Phase authorize | — |

### 2.3 Platform architecture (post–commercial depth)

| Package | Bucket | Status | Depends on | Next gate action |
|---------|--------|--------|------------|------------------|
| AUTH-001 | Approved / Locked | Approved with Amendments · Slices A–E 🔒 | ADR-026, BILL-001, COM-001 SoC | `AUTHORIZE AUTH-001 SLICE A` |
| COM-001 | Approved / Locked | Approved with Amendments · Slices A–E 🔒 | AUTH-001, BILL-001, FIN-003 SoC, ADR-027 | `AUTHORIZE COM-001 SLICE A` |
| OPS-001 | Approved / Locked | Approved with Amendments · Slices A–E 🔒 | ADR-028, API-001, EML-001, emitters | `AUTHORIZE OPS-001 SLICE A` |
| UX-012 | Approved / Locked | Approved with Amendments · Slices A–E 🔒 | Canopy, OPS-001, ADR-029 | `AUTHORIZE UX-012 SLICE A` |
| CORE-003 | Draft / Ready | Ready for Approve · no app code | Above packages | Approve to bind M0–M6 order |
| PMX-004 Phase 1 | Approved / Incomplete | Code+deploy ✔ · Final PASS ⛔ | Package Approve | Device certification evidence |
| PMX-004 Phase 2+ | Locked | Locked | Phase 1 Final PASS + authorize | — |
| PUSH-001 | Approved / Queued | Implement unlocked; Blocker 5 serial | API-001/001A | Ops evidence OK; close after #4 |
| UI-001 | Future | Not opened for Implement | Commercial Launch | Do not open early |

### 2.4 Experience / admin / supporting

| Package | Bucket | Status | Depends on | Next |
|---------|--------|--------|------------|------|
| Canopy / Exp Architecture | Completed | Approved | — | Inherit |
| DPX-001 / DPX-003 | Approved | Unlocked within scope | DPX-002 PASS | Polish only |
| DPX-002 | Completed | PASS | DPX-001 | Freeze binds |
| OWNER-001 | Completed | CERTIFIED PASS · closed | CORE-002 #3 | — |
| VENDOR-001 | Completed | A/B PASS | CORE-002 #2 | Vendor Connect deferred |
| FIN-001 | Completed | Reporting foundation | — | Consume-only |
| ADMIN-001 | Approved | Unlocked | — | Maintain |
| ADMIN-002 | Draft | Awaiting Approval · locked | ADMIN-001 | Approve when prioritized |
| ADMIN-003 | Approved | Slice A unlocked | ADMIN-001 | Stay in Slice A |
| UX-010 | Draft | Awaiting Approval · locked | — | Approve when prioritized |
| EP-017 | Approved | Pilot readiness scoreboard | EP-016 | Refresh after blockers |
| EP-019 | Paused | Locked | UX-009 / sequencing | Blocker 6 later |

### 2.5 Foundations (historical — Completed)

Phase 2–5 foundations, API-001/001A notifications, EML-001, MIG/PR/UX hardening packages, etc. — **Completed** for commercial baseline; not reopened by this plan unless a successor package restarts the gate.

---

## 3. Implementation dependency graph

### 3.1 Commercial blocker spine (authoritative — CORE-002)

```
CORE-001 (historical)
    └── CORE-002
            ├── #1 Live rent ✅
            ├── #2 Vendor ✅
            ├── #3 Owner Portal ✅
            ├── #4 Owner Payouts ⏳ OPEN
            │         FIN-003 A ✅ → B ✅
            │              └── C 🔒 ← requires PAY-001 Verified
            │                   └── D 🔒 → E 🔒 → Blocker 4 CLOSE
            ├── #5 PUSH-001 ⏳ queued (serial after #4)
            ├── #6 EP-019 ⏳ paused/queued
            └── Commercial Launch cert → GA → UI-001 (Future)
```

### 3.2 Money-in → money-out chain (binding for transfers)

```
API-005 (rent path) ✅
    └── PAY-001 Approved
            ├── Slice 1 ✅ PASS
            ├── Slice 2 ✅ COMPLETE (cert CONDITIONAL PASS)
            │         └── hardening C1–C7 (Slice 2 scope)
            ├── Slice 3 🔒 NOT AUTHORIZED
            └── Verified (A1–A21) ❌
                    └── FIN-003 Phase C Authorize eligibility
                            └── FIN-003 C → D → E → Blocker 4 CLOSE
```

### 3.3 Platform architecture chain (proposed — CORE-003; binding only after CORE-003 Approve)

```
Canopy ✅
    ├── UX-012 A→E 🔒
    └── OPS-001 A→E 🔒 ──► UX Command Center validate
BILL-001 A ✅
    ├── AUTH-001 A→E 🔒
    └── COM-001 A→E 🔒  (AUTH-B ↔ COM-A activation hinge)
PMX-004 P1 (evidence gap) → P2…P11 🔒
```

### 3.4 Cross-edges (do not collapse rails)

| From | To | Rule |
|------|-----|------|
| PAY-001 Verified | FIN-003 C | Hard gate |
| FIN-003 C–E | CORE-002 #4 CLOSE | Hard gate |
| CORE-002 #4 CLOSE | Blocker 5 CLOSE claim | Serial |
| AUTH-B + COM-A | Usable org activation | Shared contract |
| OPS-A | Module emitters | No private buses |
| OPS-E + UX-C/D/E | Command Center product claim | Data + chrome |
| PUSH-001 / PMX Phase 6 | Native push parity | Align; Blocker 5 ≠ PMX COMPLETE |
| ADR-024 | BILL-001 vs property money | Never merge SaaS and rent rails |

---

## 4. Critical path

Three poles compete; capacity must cover all without skipping CORE-002 serial rules.

| Pole | Path | Why critical |
|------|------|--------------|
| **P0 Launch blocker** | PAY-001 harden → Slice 3 → Verified → FIN-003 C→D→E → Blocker 4 CLOSE → PUSH → EP-019 → Launch cert | Closes commercial GA gate |
| **P1 Revenue ops** | AUTH-A→B ↔ COM-A → AUTH-C… + COM-B…E | Safe “Payment Successful → org” |
| **P1 Platform OS** | OPS-A→E + UX-A→E | Anti-fragmentation; Command Center |

**Immediate critical path (today):**  
`PAY-001 Slice 2 hardening (C1–C7) → re-cert PASS → Slice 3 authorize → A12/A1–A21 Verified`  
then (separate authorize) `FIN-003 Phase C`.

**Longest eng pole after unlocks:** OPS-001 full (event → notify → tasks → AI → Command Center).  
**Longest calendar/risk pole:** Money path (reviews, custody, Stripe attestation).

---

## 5. Parallel workstreams

Allowed **only** where package unlocks exist and CORE-002 serial closure rules are respected.

| Stream | Contents | Parallel rules |
|--------|----------|----------------|
| **Money** | PAY-001 hardening/Verified → FIN-003 C–E | Serial internally; may parallel AUTH/OPS/UX **code** only after those packages authorize |
| **Identity & Customer** | AUTH-001 + COM-001 | After authorize; AUTH-B ∥ COM-A on shared activation contract |
| **Platform OS** | OPS-001 | After authorize; lead OPS-A early to avoid private buses |
| **Experience** | UX-012 | After authorize; tokens before components |
| **Native** | PMX-004 evidence → later phases | Phase 1 Final PASS before Phase 2; avoid AUTH login thrash during AUTH-A |
| **Ops cert (limited)** | PUSH-001 device evidence | Ops-only; **must not** claim Blocker 5 CLOSED early |
| **Admin polish** | ADMIN-003 A / DPX | Must not displace money critical path |

**Not parallel for blocker closure:** Skipping CORE-002 #4 to close #5/#6.

---

## 6. Blocked work

| Work | Blocked by |
|------|------------|
| PAY-001 Slice 3 | Unresolved Slice 2 C1–C7 · authorize denied ([23](../108-pay-001-settlement-funding-foundation/23-slice-3-authorization.md)) |
| PAY-001 Verified / FIN-003 Phase C | Slice 3 + A1–A21 + Q3b/Q4 attestations |
| FIN-003 D–E / Blocker 4 CLOSE | Phase C |
| CORE-002 Blocker 5 CLOSED claim | Blocker 4 CLOSE |
| EP-019 resume as Blocker 6 | Money-ops sequencing / authorize |
| AUTH / COM / OPS / UX-012 any slice | Package slice authorize phrases |
| CORE-003 binding order | CORE-003 Approve |
| PMX-004 Phase 2+ | Phase 1 Final PASS + authorize |
| BILL-001 B–E | Phase authorize |
| ADMIN-002 / UX-010 Implement | Package Approve |
| UI-001 Implement | Future Release / launch blockers |

---

## 7. Current active work

| Track | State | Notes |
|-------|-------|-------|
| **PAY-001 package** | ✅ Verified | Destination enable ops-gated |
| **FIN-003 package** | ✅ CERTIFIED PASS | Blocker 4 ✅ CLOSED — [Blocker-4-Closeout](../103-core-002-commercial-launch-blocker-execution/Blocker-4-Closeout.md) |
| **CORE-002 Blocker 5** | ACTIVE | PUSH-001 commercial certification |
| PUSH-001 / ADMIN-003 A / DPX | Unlocked | Do not claim Blocker 5 CLOSED without cert |
| CORE-003 | Docs Ready for Approve | Governance sequence — no app code |

---

## 8. Future work

| Item | Horizon |
|------|---------|
| UI-001 platform experience Implement | Post commercial launch path |
| Full GL / trust accounting (ADR-010) | Future |
| Vendor Connect payouts (ADR-004) | Post–owner payouts |
| FIN-003 instant / international / 1099 automation | Deferred D6/D7/D12 |
| `owner_property_access` schema | Post–OWNER-001 isolation |
| Owner announcements read-path | Future / capability |
| Marketplace (COM-001 prep only) | After COM-E foundations |

---

## 9. Engineering milestones (relative)

Estimates assume focused capacity after required Approves/Authorizes. **Not a schedule commitment.**

| Milestone | Exit criteria | Rough eng effort* |
|-----------|---------------|-------------------|
| **EM-0** Money books trustworthy | PAY-001 Slice 2 hardening + re-cert PASS | S–M (defect fix) + L test |
| **EM-1** PAY-001 Verified | Slice 3 (runbooks/A1–A21) + attestations | M–L |
| **EM-2** Blocker 4 CLOSE | FIN-003 C→D→E certified | L–XL + XL test (C dominates) |
| **EM-3** Blockers 5–6 | PUSH cert + EP-019 | M–L each |
| **EM-4** Launch cert / GA | Readiness ≥ 9.5 | Cert/ops heavy |
| **EM-5** Platform foundation unlock | CORE-003 Approve + AUTH-A ∥ OPS-A ∥ UX-A | 12–20 eng PW (M1 rollup) |
| **EM-6** Customer activation live | AUTH-B + COM-A Validated | Contained in customer stream |
| **EM-7** Command Center | OPS-E + UX validate | Contained in OPS/UX streams |
| **EM-8** Native COMPLETE | PMX-004 Phase 11 | Device/pilot tax dominates |

\*PW = person-weeks planning ranges from [CORE-003 §06](../113-core-003-implementation-master-plan/06-resource-plan.md).

---

## 10. Commercial milestones

| Milestone | Depends on | Outcome |
|-----------|------------|---------|
| **CM-1** Settlement funding Verified | PAY-001 | Eligible to consider FIN-003 Phase C Authorize |
| **CM-2** Owner payouts live (certified) | FIN-003 E · Blocker 4 CLOSE | Money-out commercial bar |
| **CM-3** Push commercial cert | Blocker 5 | Mobile engagement bar |
| **CM-4** Performance bar | Blocker 6 / EP-019 | Latency/reliability bar |
| **CM-5** Commercial Launch | CM-2–4 + launch checklist | Readiness ≥ 9.5 |
| **CM-6** GA | CM-5 | General availability |
| **CM-7** Self-serve org activation | AUTH+COM validated path | Revenue ops without manual provision |
| **CM-8** Future UI-001 | Post-GA path | Next experience program |

---

## 11. Estimated engineering effort (program rollup)

From CORE-003 resource planning (indicative; not a budget authorize):

| Stream | Eng PW | Test PW | Notes |
|--------|--------|---------|-------|
| PAY remainder + FIN C–E | 20–35 | 25–40 | Review calendar > coding |
| Customer (AUTH+COM full) | 35–55 | 30–45 | Security/cert heavy |
| OPS full | 40–60 | 30–45 | Longest eng pole |
| UX-012 full | 18–28 | 16–24 | FE + a11y |
| PMX remaining | 15–25 | 25–40 | Device lab tax |
| Foundation M1 only | 12–20 | 10–16 | After CORE-003 + slice authorizes |
| **Full program (if all complete)** | **~140–220** | **~135–210** | Not all required before revenue ops |

**Near-term (pre–platform unlock):** PAY-001 hardening + Slice 3/Verified + FIN-003 C–E ≈ majority of commercial launch eng risk.

---

## 12. Risk matrix

| ID | Risk | L | I | Score | Mitigation |
|----|------|---|---|-------|------------|
| R1 | FIN-003 Phase C custody / money-transmitter error | 3 | 5 | 15 | PAY-001 Verified; P1–P10; dual control; kill switches |
| R2 | PAY-001 Slice 2 unsafe books shipped to prod | 4 | 5 | 20 | Close C1–C7; re-cert PASS before production corrections trust |
| R3 | AUTH-001 Slice A identity breakage | 3 | 5 | 15 | Staged rollout; session cert; no public signup |
| R4 | Authorize FIN-003 C before PAY Verified | 2 | 5 | 10 | Gate refusal; CORE-002 / PAY-001 docs |
| R5 | OPS-001 Slice A event contract thrash | 3 | 4 | 12 | Freeze envelope early; version topics |
| R6 | AUTH-B ↔ COM-A double-provision | 3 | 4 | 12 | Single idempotency; Payment Successful only |
| R7 | PMX-004 Phase 1 Final PASS gap | 4 | 3 | 12 | Device lab; do not claim native COMPLETE |
| R8 | Premature Blocker 5 CLOSED | 2 | 5 | 10 | Serial after Blocker 4 |
| R9 | CORE-003 never Approved → parallel chaos | 3 | 3 | 9 | Approve CORE-003; until then follow CORE-002 + package locks |
| R10 | Starving money path for UX polish | 3 | 4 | 12 | Capacity isolation; weekly critical-path check |

**Highest risks now:** R2 (PAY-001 books) → R1 (FIN-003 C) → R8/R4 (governance skips).

---

## 13. How to use this document

| Need | Use |
|------|-----|
| Commercial blocker order / CLOSE claims | **CORE-002** |
| Launch checklist / commercial narrative | [Commercial Launch Master Plan](./commercial-launch-master-plan.md) |
| Cross-package M0–M6 sequence (after Approve) | **CORE-003** |
| Live matrix / audit | [Project Roadmap Status](./project-roadmap-status.md) |
| Gate policy | [Implementation Gate](./implementation-gate.md) |
| Debt | [Technical Debt Register](./technical-debt-register.md) |
| **Operational rollup (this file)** | Weekly eng + product sync |

Refresh this report when package READMEs or CORE-002 status change. Do not treat edits here as Approves or Authorizes.

---

## Related

- [CORE-002](../103-core-002-commercial-launch-blocker-execution/README.md)  
- [CORE-003](../113-core-003-implementation-master-plan/README.md)  
- [PAY-001](../108-pay-001-settlement-funding-foundation/README.md)  
- [FIN-003](../98-fin-003-owner-payout-stripe-connect/README.md)  
- [Commercial Launch Master Plan](./commercial-launch-master-plan.md)  
- [Project Roadmap Status](./project-roadmap-status.md)  
- [Development Freeze Checkpoint](./development-freeze-checkpoint.md)  
