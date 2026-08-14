# 56 — Phase 4 Document Intelligence Center

**Status:** Sprint 6 **implemented** — awaiting Owner acceptance → merge → Production → LIVE  
**Authority:** Owner Phase 4 Sprint 6 authorization  
**Rule:** Do **not** begin Sprint 7 until Sprint 6 is LIVE and Owner-accepted.

## Documents

| Doc | Purpose |
| --- | --- |
| [Authorization](./sprint-6-authorization.md) | Scope |
| [Issue Register](./sprint-6-issue-register.md) | DIC-001–010 |
| [Center Report](./sprint-6-document-intelligence-center-report.md) | Delivery |
| [Architecture](./sprint-6-architecture-report.md) | Additive model |
| [Relationship Model](./sprint-6-relationship-model-report.md) | Links |
| [Permission Report](./sprint-6-permission-report.md) | Authz |
| [PDF Generation](./sprint-6-pdf-generation-report.md) | Export |
| [Accessibility](./sprint-6-accessibility-report.md) | A11y |
| [Performance](./sprint-6-performance-report.md) | Perf |
| [Regression](./sprint-6-regression-report.md) | Non-DIC |
| [Quality Score](./sprint-6-quality-score.md) | Scorecard |
| [Screenshots](./screenshots-sprint-6/) | Fixtures |

## Summary

Document Intelligence Center on the Shared Documents spine: search/filters, preview, relationships, versions, activity, professional PDF export, additive migration. Nav href unchanged. No Stripe/auth redesign.

Authored documents, templates, rich-text editing, and operational tables are **not** Sprint 6. They are designed as **OPS-001** ([docs/112](../112-ops-001-operational-workspace-documents-tables/index.md), [ADR-030](../18-decision-log/adr-030-operational-workspace-documents-tables.md) Proposed). Evolve this library — do not invent a second vault. **Do not implement OPS-001 until ADR-030 is Accepted.**
