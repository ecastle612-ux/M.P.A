# 12 — Approval Checklist

**Package:** PMX-004  
**Status:** ✅ **APPROVED WITH AMENDMENTS** (2026-07-23)  

---

## 1. Gate statement

Per [Implementation Gate](../00-governance/implementation-gate.md) and [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md):

> Production application code for PMX-004 is unlocked **after** Approve **and** required amendments are incorporated into the documentation package.

Amendments 01–03 were required before code. They are now incorporated:

- [13 — Native UX Acceptance Matrix](./13-native-ux-acceptance-matrix.md)  
- [14 — Installation Success Funnel](./14-installation-success-funnel.md)  
- [15 — Real-World Pilot](./15-real-world-pilot.md)  

---

## 2. Documents reviewed

| Doc | Reviewed |
| --- | --- |
| [README](./README.md) | ✔ |
| [00 Purpose & Scope](./00-purpose-and-scope.md) | ✔ |
| [01 Current Architecture](./01-current-architecture.md) | ✔ |
| [02 Proposed Architecture](./02-proposed-architecture.md) | ✔ |
| [03 Risk Assessment](./03-risk-assessment.md) | ✔ |
| [04 Regression Risks](./04-regression-risks.md) | ✔ |
| [05 Implementation Order](./05-implementation-order.md) | ✔ (Phases 1–11) |
| [06 Acceptance Criteria](./06-acceptance-criteria.md) | ✔ (A14–A17 added) |
| [07 Rollback Strategy](./07-rollback-strategy.md) | ✔ |
| [08 Testing Strategy](./08-testing-strategy.md) | ✔ |
| [09 Unified SW Design](./09-unified-service-worker-design.md) | ✔ |
| [10 Standalone Exit Inventory](./10-standalone-exit-inventory.md) | ✔ |
| [11 Offline Queue Design](./11-offline-queue-design.md) | ✔ |
| [13 Native UX Matrix](./13-native-ux-acceptance-matrix.md) | ✔ Amendment 01 |
| [14 Install Funnel](./14-installation-success-funnel.md) | ✔ Amendment 02 |
| [15 Real-World Pilot](./15-real-world-pilot.md) | ✔ Amendment 03 |

---

## 3. Decisions confirmed at Approve

| Decision | Outcome |
| --- | --- |
| D1 Unified SW composition | **Accepted** — importScripts offline into OneSignal worker |
| D2 Phase 1 API caching | **None** |
| D3 Offline queue scope | **Accepted** allowlist (doc 11) |
| D4 Schema changes | **None** |
| D5 E-sign | **Accepted-with-return OK** |
| D6 CSP frame-src for viewers | Security review when Phase 4 needs it |
| D7 Score targets | **Accepted** — Native ≥ 95 · PWA **= 100** · Production ≥ 95 |
| D8 Amendment 01 UX matrix | **Required** — all screens PASS for COMPLETE |
| D9 Amendment 02 install funnel | **Required** — KPIs documented for COMPLETE |
| D10 Amendment 03 Phase 11 pilot | **Required** — four-device pilot PASS for COMPLETE |

---

## 4. Sign-off

| Role | Name | Date | Decision |
| --- | --- | --- | --- |
| Lead Architect | (package author) | 2026-07-23 | ✔ Amendments incorporated; recommend proceed Phase 1 |
| Product / Stakeholder | | 2026-07-23 | ✔ **Approve with Amendments** (this message) |
| Security (if CSP/viewer) | | | ☐ At Phase 4 if CSP changes |

### Approval phrase (recorded)

```
APPROVE PMX-004 WITH AMENDMENTS:
- Amendment 01 — Native UX Acceptance Matrix (doc 13)
- Amendment 02 — Installation Success Funnel (doc 14)
- Amendment 03 — Phase 11 Real-World Pilot (doc 15)
- COMPLETE blocked until scores + matrix + funnel KPIs + pilot PASS
```

---

## 5. Post-Approve unlock

1. ✔ README Status → Approved with Amendments · Implement unlocked.  
2. Begin **Phase 1 only** (unified service worker).  
3. Each phase verification doc before next hard gate.  
4. Phase 11 required before COMPLETE.  
5. Material scope changes → new amendment Approve.

---

## 6. Amendment incorporation validation

| Check | Result |
| --- | --- |
| Doc 13 created with every major screen | ✔ 111 patterns |
| Doc 14 funnel + KPIs defined | ✔ |
| Doc 15 Phase 11 pilot + device matrix | ✔ |
| Acceptance criteria A14–A17 | ✔ |
| Implementation order includes Phase 11 | ✔ |
| COMPLETE checklist updated in README | ✔ |
| Production code modified before amendments | ✗ None (correct) |

**Architect recommendation:** Amendments satisfied. **Phase 1 implementation may begin.**
