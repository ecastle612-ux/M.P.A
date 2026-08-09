# 51 — Phase 3 Production Polish

**Status:** Sprint 3 Mission Control polish **ready for Owner acceptance**  
**Gate:** Bug-fix / polish / commercial UX only — no ADR-019, Checkout architecture, FO_READY, or workflow changes  
**Authorization:** Phase 3 · Sprints 1 → 1.1 → 2 · Option B · **Sprint 3 Mission Control**

## Sequence

```
Design → Document → Approve → Implement
```

Sprint 3: await Owner acceptance → merge → Production deploy → LIVE verify → Owner LIVE acceptance.  
**Do not begin Sprint 4** until all six deployment steps complete.

## Sprint 3 — Mission Control Experience

| Surface | Route |
|---------|-------|
| Property Manager MC | `/pm/mission-control` |
| Facility Operations MC | `/facility/mission-control` |
| Complete Launcher | `/launcher` |
| Demo MC (PM / FO / Complete) | `/demo/...` |

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
| [Commercial Pricing Transparency Report](./commercial-pricing-transparency-report.md) | Option B — display all three; FO_READY gate |
| [Pricing Transparency Regression](./commercial-pricing-transparency-regression.md) | Option B regression |
| [Option B Production Verification](./option-b-production-verification.md) | LIVE deploy verify (when present on main) |
| [Sprint 3 Authorization](./sprint-3-authorization.md) | Mission Control polish scope |
| [Sprint 3 Issue Register](./sprint-3-issue-register.md) | MC-001–MC-018 |
| [Mission Control Polish Report](./sprint-3-mission-control-polish-report.md) | Sprint 3 delivery |
| [Dashboard UX Report](./sprint-3-dashboard-ux-report.md) | Five-second test |
| [Sprint 3 Regression Report](./sprint-3-regression-report.md) | Verification |
| [Sprint 3 Accessibility Report](./sprint-3-accessibility-report.md) | A11y notes |
| [Sprint 3 Performance Report](./sprint-3-performance-report.md) | Loading / render |
| [Dashboard Quality Score](./sprint-3-dashboard-quality-score.md) | Scored dimensions |
| [Commercial Catalog Completion](./commercial-catalog-completion.md) | Official FO/Complete Stripe Products + Prices; Vercel env unblock |
| [Catalog Completion Regression](./commercial-catalog-completion-regression.md) | Partial LIVE checks + blocker |
| [Stripe IDs (JSON)](./commercial-catalog-stripe-ids.json) | Product/Price IDs for env mapping |

## Constraints (binding)

1. Do not redesign workflows.
2. Do not modify ADR-019 / Product Constitution.
3. Do not change products or invent prices.
4. Do not implement new features beyond authorized commercial UX.
5. Preserve FO_READY purchase gate.
6. Mission Control polish uses existing widgets/data only.
