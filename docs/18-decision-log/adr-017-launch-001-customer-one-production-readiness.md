# ADR-017: LAUNCH-001 — Customer #1 Production Readiness Governing Program

## Status

Proposed

## Date

2026-08-06

## Context

M.P.A. has reached a maturity milestone: Identity, Master Admin, UX/STD/NAV/ARCH certifications, Property Lifecycle, Maintenance, Leasing, Resident Operations, and SignWell (adapter) exist on the product candidate line (`release/rc1`), with RC1 certification **READY FOR LIMITED BETA**. Commercial Launch remains unauthorized.

Continuing CORE-004 (or other module expansion) without a commercial launch program increases risk: more surface area, more “where do I go?”, and delayed proof of onboarding/billing/retention for Customer #1.

Package **25** / ADR-016 already sequenced Financial-before-Facility. Stakeholders now require a **named governing program** — LAUNCH-001 — that temporarily outranks CORE-004 without replacing the long-term roadmap.

See: [26 LAUNCH-001](../26-launch-001/index.md)

## Decision

1. **Authorize LAUNCH-001** as the highest-priority program until the first paying customer is onboarded and retained with confidence.
2. **CORE-004 is not replaced.** It remains the long-term platform roadmap. New CORE-004 capability work (including Phase 6) is **frozen** until LAUNCH-001 Customer #1 GO, except work that removes a documented Launch Board 🔴 item.
3. **Implementation rule:** Until LAUNCH-001 complete, no new platform capabilities unless they remove a documented Launch Blocker on the [Launch Readiness Board](../26-launch-001/launch-readiness-board.md).
4. **Priority stack:** Launch Blockers → Customer #1 Success → Commercial Readiness → Production Readiness → Post-Launch Expansion.
5. **Facility Operations** remains first-class architecturally (ADR-015) and **post-launch for expansion** (ADR-016 / Launch Board 🔵).
6. **Official artifacts** in package 26 are the living SoT for board, checklist, audits, and GO/NO-GO during the program.
7. **Desk GO/NO-GO at authorization:** GO to run LAUNCH-001; **NO-GO** for unsupervised Customer #1 until 🔴 clear.

## Consequences

### Easier

- Single governing question for prioritization
- Clear freeze on feature sprawl
- Aligns engineering with commercial outcomes
- Preserves CORE-004 and Facility architecture decisions

### More difficult

- Feature teams must justify work via Launch Board IDs
- Temptation to “just finish Facility/CORE” must be refused
- Ops/cert work (Stripe, SignWell, legal, monitoring) gets scarce attention by design

### Forbidden while LAUNCH-001 is active (pre-GO)

- CORE-004 Phase 6+ new capabilities without 🔴 mapping
- Facility expansion (Inventory/PM/CapEx/Safety programs) as net-new scope
- Resuming abandoned tracks (e.g. PUSH-001 device cert) without new Approve
- Implementing visual redesigns or Help Center CMS unless promoted from blockers/journey FAIL

## Alternatives Considered

### A. Continue CORE-004 Phase 6 now

Rejected. Increases module risk before commercial proof.

### B. Replace CORE-004 permanently with launch program

Rejected. Launch is a phase; CORE remains long-term platform roadmap.

### C. Declare Customer #1 GO based on Limited Beta cert alone

Rejected. RC1 explicitly: commercial launch not authorized; SignWell/SaaS operator/legal/observability gaps remain.

## Relationship to other ADRs

| ADR | Role |
|-----|------|
| ADR-012 | Gate still binds all implementation |
| ADR-015 | Facility ownership (what) |
| ADR-016 | Launch sequencing (Financial before Facility) |
| ADR-017 | Governing program + freeze rule (this ADR) |

## Approval

| Role | Decision | Date |
|------|----------|------|
| Product | _pending_ | |
| Lead Architect | _pending_ | |
| Ops / Commercial | _pending_ | |

On acceptance: package **26** status → Authorized; update Implementation Gate current gates; refuse non-blocker feature PRs.
