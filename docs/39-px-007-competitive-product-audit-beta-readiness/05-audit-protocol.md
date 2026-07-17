# PX-007.05 — Audit Protocol

**Status:** Draft

---

## Prerequisites

- PX-006 baseline locked — do not refactor unless logging a defect
- Local dev server: `pnpm dev` in `apps/web`
- Authenticated test org with **empty** and **populated** portfolio variants
- Screenshot folder: `docs/39-px-007-competitive-product-audit-beta-readiness/screenshots/`

---

## Part 1 — M.P.A. walkthrough (primary)

Perform as first-time property manager. Record **clicks**, **hesitations**, and **screenshots**.

| # | Flow | Empty state | Populated | Breakpoints |
|---|------|-------------|-----------|-------------|
| 1 | Login / session | ✓ | ✓ | 390, 768, 1440 |
| 2 | Setup wizard | ✓ | skip path | 768, 1440 |
| 3 | Organization + invite | ✓ | ✓ | 1440 |
| 4 | Property create → success panel | ✓ | — | 1440, 1920 |
| 5 | Unit → tenant → lease chain | ✓ | ✓ | 1440 |
| 6 | Maintenance + vendor assign | ✓ | ✓ | 1440 |
| 7 | Financial charge + payment | ✓ | ✓ | 1440 |
| 8 | Communications publish | ✓ | ✓ | 1440 |
| 9 | AI Operations | ✓ | ✓ | 1440 |
| 10 | Operations Center | ✓ | ✓ | 390, 1440, 2560 |
| 11 | List pages (all modules) | ✓ | ✓ | 1440 |
| 12 | Detail pages + context rails | — | ✓ | 768, 1440 |

### Failure criteria (same as PX-006.11)

Fix only if measurable problem — log as defect, not preference.

---

## Part 2 — Competitive desk research

For each competitor, review **public** materials (marketing site, demo videos, G2/feature lists). Do not assume parity with enterprise tiers.

| Competitor | Focus questions |
|------------|-----------------|
| AppFolio | AI leasing, mobile ops, owner reporting, autonomous workflows |
| Buildium | Accounting, HOA, owner portal, QuickBooks |
| DoorLoop | Onboarding speed, UI simplicity, pricing accessibility |
| Yardi Breeze | Commercial + accounting entry |

Document in scorecard — not as implementation spec.

---

## Part 3 — Enterprise SaaS craft check

On M.P.A. only, rate [03-enterprise-saas-quality-bar.md](./03-enterprise-saas-quality-bar.md) checklist.

Compare **feel** to Linear/Stripe/Notion references — qualitative notes, not pixel copying.

---

## Part 4 — Beta verdict

Complete [04-beta-readiness-criteria.md](./04-beta-readiness-criteria.md) P0 checklist.

Produce:
- `audit-results.md` (final)
- `remediation-backlog.md` (from template 07)

---

## Deliverable: audit-results.md structure

```markdown
# PX-007 Audit Results
- Date / auditor
- Beta verdict
- P0 checklist results
- Competitive scorecard summary
- Enterprise craft score summary
- Top 10 gaps (parity)
- Top 5 M.P.A. advantages
- Remediation items (problem → metric → fix)
- Screenshots index
```

---

## Gate

PX-007 remediation implementation **cannot** start until:

1. `audit-results.md` complete
2. Stakeholder approves beta verdict
3. Each remediation item approved individually with measurable success criterion
