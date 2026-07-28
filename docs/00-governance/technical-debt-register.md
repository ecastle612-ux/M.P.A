# Technical Debt Register

**Type:** Inventory only — does **not** authorize implementation  
**Date:** 2026-07-23  
**Context:** Post–development-freeze health verification  
**Policy:** [Implementation Gate](./implementation-gate.md) · [Development Freeze](./development-freeze-checkpoint.md)

> Items below are known limitations or deferred work.  
> **Blocking? = Yes** means it blocks commercial GA / a named CORE-002 blocker.  
> Most OWNER-001 debt is **non-blocking** for FIN-003 Phase A.

**Sources:** OWNER-001 cert / readiness · FIN-003 decisions · CORE-002 closeouts · master plan future list.

---

## Architecture

| ID | Description | Priority | Owner | Blocking? | Planned milestone |
|----|-------------|----------|-------|-----------|-------------------|
| TD-ARCH-1 | **`owner_property_access` migration** — Interim org-role / contact-email ACL may overshare in multi-owner orgs; swap isolated in `access.ts` but table not migrated | High | Architect + Product | No (not FIN-003 Phase A) | Post–OWNER-001 / post–Blocker 4 product isolation |
| TD-ARCH-2 | **FIN-003 allocation profiles → ownership interest** — Profiles are interim adapter; long-term ownership entity model deferred (D1) | Medium | Architect | No | After FIN-003 v1 / when ownership schema designed |
| TD-ARCH-3 | **Full GL / trust accounting** — Out of commercial MVP (ADR-010) | Low | Architect | No | Future Release |
| TD-ARCH-4 | **Vendor Connect payouts** — Separate from owner FIN-003 (ADR-004) | Medium | Architect + Product | No | Post-owner payouts / marketplace track |
| TD-ARCH-5 | **PortalShell owner-specific bottom nav coupling** — Acceptable; generalize if other portals adopt tabs | Low | Web | No | Opportunistic DX / portal chassis |

---

## Security

| ID | Description | Priority | Owner | Blocking? | Planned milestone |
|----|-------------|----------|-------|-----------|-------------------|
| TD-SEC-1 | **`message:create` RBAC decision (Q2 / P-MSG-1)** — Owner reply UI gated correctly; many owners lack grant → read-only | High | Product + Security / RBAC | No | Product confirm → grant matrix update (post-freeze OK only after Approve if new pattern) |
| TD-SEC-2 | **Interim ACL overshare** — Same root as TD-ARCH-1; security/product isolation risk in multi-owner orgs | High | Security + Architect | No for Blocker 4 start | With `owner_property_access` |
| TD-SEC-3 | **Download / vault audit trail ops confirmation (H4)** — Needs production ops validation | Medium | Ops + Security | No | Pre-GA ops checklist |
| TD-SEC-4 | **FIN-003 custody / webhook hardening** — Not debt yet; risk if Phase C rushed | High | Security + Architect | Yes for Blocker 4 CLOSE | FIN-003 Phases C–E cert |

---

## Performance

| ID | Description | Priority | Owner | Blocking? | Planned milestone |
|----|-------------|----------|-------|-----------|-------------------|
| TD-PERF-1 | **>20 property summary cap** — Dashboard / list MTD revenue & WO fan-out capped at 20 with honest load note; large portfolios under-count KPIs | Medium | Architect + Web | No | Scale milestone / aggregate service |
| TD-PERF-2 | **Large-portfolio query fan-out** — Broader than the 20-cap; needs aggregate reads | Medium | Architect | No | Post-GA / EP-019 adjacency |
| TD-PERF-3 | **EP-019 commercial performance bar** — Paused; Blocker 6 | High | Architect | Yes for GA | CORE-002 Blocker 6 after money-ops |

---

## UI/UX

| ID | Description | Priority | Owner | Blocking? | Planned milestone |
|----|-------------|----------|-------|-----------|-------------------|
| TD-UX-1 | **Announcements owner read-path (Q3 / P-ANN-1)** — Not shipped; deferred Future Release / capability decision | Medium | Product | No | Future Release / capability package |
| TD-UX-2 | **Dashboard recent reports from vault versions** — Nice-to-have depth | Low | Product + Web | No | Owner polish / DPX |
| TD-UX-3 | **Build-time version injection for Settings About** | Low | Web | No | Opportunistic |
| TD-UX-4 | **Full WCAG audit not re-run for OWNER-001** — Inherits platform baseline | Medium | Product + Web | No | Pre-GA a11y pass |
| TD-UX-5 | **Financial period selector depth** — Beyond current helpers where still thin | Low | Web | No | Owner financials polish |
| TD-UX-6 | **Label consistency** — Historical “Revenue” vs “Recent collections” wording (Phase 1 note; may be resolved—verify before rewrite) | Low | Web | No | Copy pass |

---

## Developer Experience

| ID | Description | Priority | Owner | Blocking? | Planned milestone |
|----|-------------|----------|-------|-----------|-------------------|
| TD-DX-1 | **Full-package ESLint noise** — OWNER-001 used scoped lint + typecheck/build | Medium | Web | No | Lint debt burn-down |
| TD-DX-2 | **Governance doc overlap** — Multiple SoT docs (roadmap, master plan, freeze, closeout) require careful “which is live?” reading | Medium | Architect | No | Index discipline (see health recommendations) |
| TD-DX-3 | **Phase completion docs with stale “pending later phase” notes** — Historical phase docs still say “Phases 2–8 pending” etc. | Low | Docs | No | Optional archive banners (recommendation only) |

---

## Future Features

| ID | Description | Priority | Owner | Blocking? | Planned milestone |
|----|-------------|----------|-------|-----------|-------------------|
| TD-FUT-1 | **Report allow-list evolution** — Heuristic owner-safe types until product visibility enum / metadata | Medium | Product + Architect | No | Reporting product pass |
| TD-FUT-2 | **UI-001** — Future Release after commercial launch blockers | Medium | Product | No | Post-GA |
| TD-FUT-3 | **Instant payouts (D12)** | Low | Product + Finance | No | Post–FIN-003 v1 |
| TD-FUT-4 | **International / multi-currency (D6)** | Low | Product + Finance | No | Post–FIN-003 v1 |
| TD-FUT-5 | **1099 automation (D7)** — Exportable totals only in v1 | Low | Finance | No | Tax package |
| TD-FUT-6 | **API improvements / analytics / i18n** | Low | Product | No | Post-GA backlog |
| TD-FUT-7 | **ADMIN-002 Master Admin Role Switcher** — Draft; Implement locked | Low | Architect | No | When Product prioritizes |
| TD-FUT-8 | **BILL-001 Phases B–E** | Medium | Product + Architect | No | Separate phase authorize |
| TD-FUT-9 | **Owner maintenance approvals / investment analytics / AI forecasting** | Low | Product | No | Future Owner Ops / Release |

---

## Summary counts

| Priority | Count (approx.) |
|----------|-----------------|
| High | 5 (TD-ARCH-1, TD-SEC-1, TD-SEC-2, TD-SEC-4, TD-PERF-3) |
| Medium | 12 |
| Low | 12+ |

| Blocking commercial GA? | Items |
|-------------------------|-------|
| Yes | TD-SEC-4 (via FIN-003 E), TD-PERF-3 (EP-019 / Blocker 6); plus PUSH-001 / launch cert (tracked as blockers, not classic “debt”) |
| No | All OWNER-001 MVP debt listed above for FIN-003 Phase A start |

---

## Related

- [Release Readiness Snapshot](./release-readiness-snapshot.md)
- [Commercial Launch Master Plan](./commercial-launch-master-plan.md) §8 Future Initiatives
- [OWNER-001 Commercial Readiness](../104-owner-001-commercial-owner-portal/29-commercial-readiness-review.md) § Remaining technical debt
- [OWNER-001 Certification](../104-owner-001-commercial-owner-portal/28-owner-001-certification.md) § Known limitations
