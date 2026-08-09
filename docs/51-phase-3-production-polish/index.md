# 51 — Phase 3 Production Polish

**Status:** Sprint 2 complete — **STOP** awaiting Owner acceptance before Sprint 3  
**Gate:** Bug-fix / polish only — no workflow, pricing, product, or ADR-019 changes  
**Authorization:** Phase 3 Production Polish · Sprint 1 → 1.1 → 2 (Guided Setup)

## Sequence

```
Design → Document → Approve → Implement
```

Sprint 3 (Mission Control polish program) must not begin until Owner accepts Sprint 2.

## Sprint 2 — Guided Setup Experience

| Surface | Route |
|---------|-------|
| Checkout success | `/checkout/success` |
| Continue / claim | `/commerce/continue` |
| Claim password | `/login` (+ commerce query params) |
| Guided Setup | `/setup` |
| Mission Control first-run | `/pm/mission-control` |

## Documents

| Doc | Purpose |
|-----|---------|
| [Authorization](./sprint-1-authorization.md) | Sprint 1 scope |
| [Issue Register](./sprint-1-issue-register.md) | Sprint 1 findings |
| [Production Polish Report](./sprint-1-production-polish-report.md) | Sprint 1 fixes |
| [Regression Report](./sprint-1-regression-report.md) | Sprint 1 verification |
| [Sprint 1.1 Authorization](./sprint-1-1-authorization.md) | Commercial conversion polish |
| [Sprint 1.1 Issue Register](./sprint-1-1-issue-register.md) | Demo + pricing findings |
| [Sprint 1.1 Commercial Polish Report](./sprint-1-1-commercial-polish-report.md) | Combined delivery |
| [Demo Improvement Report](./sprint-1-1-demo-improvement-report.md) | Live Demo MC |
| [Pricing Transparency Report](./sprint-1-1-pricing-transparency-report.md) | Live Stripe amounts |
| [Sprint 1.1 Regression Report](./sprint-1-1-regression-report.md) | Verification |
| [Sprint 2 Authorization](./sprint-2-authorization.md) | Guided Setup polish scope |
| [Sprint 2 Issue Register](./sprint-2-issue-register.md) | GS-001–GS-020 |
| [Guided Setup Polish Report](./sprint-2-guided-setup-polish-report.md) | Sprint 2 delivery |
| [First Run Experience Report](./sprint-2-first-run-experience-report.md) | MC handoff |
| [Sprint 2 Regression Report](./sprint-2-regression-report.md) | Verification |
| [Sprint 2 Accessibility Report](./sprint-2-accessibility-report.md) | A11y notes |

## Constraints (binding)

1. Do not redesign workflows.
2. Do not modify ADR-019 / Product Constitution.
3. Do not change pricing or products.
4. Do not implement new features.
5. Fix only polish issues.
