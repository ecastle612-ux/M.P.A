# IA-001 — Intelligent Property Operations Platform

**Status:** Approved — Execution Phase 1  
**Initiative ID:** IA-001  
**Gate:** Design ✔ · Document ✔ · **Approved** · **Implement in progress**  
**Policy:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)

---

## Objective

Design M.P.A.’s AI layer as an **active operations manager**: continuously monitor the portfolio, surface risks, recommend actions, and automate only routine, low-risk decisions — never high-risk money, legal, or lease decisions without explicit human approval.

**No application code in this package.**

Builds on [Phase 11 AI Operations Foundation](../31-phase-11-ai-operations-foundation/README.md) (shell already shipped) and [13 AI Strategy](../13-ai-strategy/index.md). IA-001 is the product design that turns the foundation into a proactive OS for property operations.

---

## Cross-links

| Package / surface | Relationship |
| --- | --- |
| [DX-003 Zero Friction Daily Operations](../60-dx-003-zero-friction-daily-operations/README.md) | Removes dual paths so AI recommendations resolve cleanly |
| [DX-004 Five-Minute Rule (OS UX)](../61-dx-004-five-minute-rule/README.md) | Today’s Work, Palette, Inspector host Next Best Action |
| [MOAT-001 Competitive Advantage Blueprint](../63-moat-001-competitive-advantage-blueprint/README.md) | AI + OS as durable moats, not chatbot theater |
| [WF-003 Resident Lifecycle](../55-wf-003-resident-lifecycle/00-executive-summary.md) | Guided move-in/out remain human jobs; AI assists |
| [Operations Center](../30-product-experience/04-dashboard-experience.md) | Morning briefing + risk alerts surface here |
| [Command Center / ⌘K](../60-dx-003-zero-friction-daily-operations/01-workflow-audit.md) | Ask AI + actionable recommendations |
| [API-003 Background Screening](../48-api-003-background-screening/README.md) | Explain screening; never auto-approve/reject |
| [API-004 Electronic Signatures](../50-api-004-electronic-signatures/README.md) | Draft/remind; never sign |
| [API-005 Resident Payments & Billing](../51-api-005-resident-payments-billing/README.md) | Predict/flag/draft; never move money |
| [AI Strategy](../13-ai-strategy/index.md) · [AI Roadmap](../31-product-requirements/ai-roadmap.md) | Binding philosophy this package extends |

---

## Package contents

| Doc | Deliverables |
| --- | --- |
| [00 — Executive Summary](./00-executive-summary.md) | 1, 16–18 |
| [01 — Vision, Risk & Boundaries](./01-vision-risk-and-boundaries.md) | 2, 5–8 |
| [02 — Module Opportunities & Catalog](./02-module-opportunities-and-catalog.md) | 3–4 |
| [03 — Surfaces, Notifications & Learning](./03-surfaces-notifications-and-learning.md) | 9–13 |
| [04 — Competitive Analysis & Slices](./04-competitive-and-slices.md) | 14–15 |

---

## Binding rules (post-Approve)

1. AI may **recommend, summarize, draft, prioritize, categorize, predict** — never silently approve applicants, reject applicants, move money, sign documents, delete records, or change legal documents.
2. Prefer extending Phase 11 AI tables/APIs and DX-004 OS surfaces — **do not invent a parallel chatbot product**.
3. Every recommendation must be **explainable** (why + source entities) and **dismissible**.
4. Material scope changes restart Design → Document → Approve.

### Execution Phase 1 scope (EP-001)

Implement **L0 / L1 recommendations only** (inform, prioritize, draft into UI). No L2 auto-exec, L3 one-click commits beyond existing product confirms, or L4 actions.
