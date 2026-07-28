# 09 — Implementation Lock

**Package:** UX-013  
**Status:** 🔒 **LOCKED** until [08 — Approval record](./08-approval-record.md) is signed  
**Date:** 2026-07-28  
**Policy:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)

---

## Verdict

**Do not implement application/UI code for UX-013 yet.**

Design and documentation are in progress / ready for approval. Material changes to approved ACQ-001 journey, BILL public catalog messaging, and shell navigation patterns require explicit Approve before code.

---

## What must not ship until Approve + slice authorize

| Area | Locked work |
|------|-------------|
| Acquire / marketing | Module-selection UI, Trial CTA removal, pricing order changes |
| Checkout | Rejecting public `trial`, requiring `module_selection` metadata |
| Entitlements | Selection-aware module bind / capability matrix SKU split |
| Shell navigation | Per-surface sidebar rewrite / new nav group models |
| Portals | Nav matrix refactors beyond approved OWNER/tenant packages |
| Schema | New entitlement columns/tables solely for UX-013 |
| Release | Commit/push/deploy of UX-013 **product** code citing this package |

Documentation, ADRs, and amendments **are allowed** and are the current work.

---

## What is allowed now

- Refine this Blueprint and companion amendments  
- Record stakeholder decisions into [05](./05-open-questions.md) / [08](./08-approval-record.md)  
- Bug fixes that do not change acquisition journey or nav architecture patterns  

---

## After Approve (Implement checklist)

When `APPROVE UX-013` (and companion accepts) are recorded **and** a slice authorize phrase is issued:

1. Implement **only** the authorized slice scope  
2. Add/adjust tests (unit + journey where applicable)  
3. Build / typecheck for touched packages  
4. Commit with message citing UX-013 + approval/authorize phrases  
5. Push and open PR (when requested)  
6. Deploy per environment policy  
7. Verify against [06 — Acceptance criteria](./06-acceptance-criteria.md)  
8. Record slice implementation notes under this package  

Until those gate phrases exist, agents must **refuse** Implement requests and point here.

---

## Todo mapping

| Plan todo | Status |
|-----------|--------|
| Draft UX-013 package | Documentation in this folder |
| Amend ACQ / BILL (+ ADR) | Companion drafts linked from README |
| Approval checklist + empty approval record | [07](./07-approval-checklist.md) · [08](./08-approval-record.md) |
| Implement after Approve | **BLOCKED** — this document |
