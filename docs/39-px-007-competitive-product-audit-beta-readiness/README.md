# PX-007 — Competitive Product Audit & Beta Readiness

**Status:** Draft — Design & Document  
**Gate:** Approve before any remediation implementation  
**Predecessor:** [PX-006 Product Experience & Workflow](../38-px-006-workflow-experience-enterprise-ux/README.md) — **Complete (baseline locked)**

---

## Purpose

PX-007 determines whether M.P.A. is **commercially competitive** with established property management platforms (AppFolio, Buildium, DoorLoop, Yardi) while meeting the **design quality bar** of modern enterprise SaaS (Linear, Stripe, Notion, Ramp, Vercel).

This is **not a feature sprint**. It is an audit, gap analysis, and beta-readiness assessment.

---

## What PX-006 established (do not revisit)

The following are **baseline** unless a defect is discovered during PX-007 testing:

| Capability | Source |
|------------|--------|
| Setup Wizard | PX-006 Stage A |
| Workflow Success Panels & chains | PX-006 Stage B |
| Portfolio Setup Health | PX-006 Stage A/D |
| Enterprise workspace layouts (2fr/1fr, context rails) | PX-006 Stage C |
| Server/Client architecture (`lib/workflow/server`, `shared`, `client`) | PX-006 Stage C |
| Human language audit | PX-006 Stage D |
| Educational empty states | PX-006 Stage D |
| Progressive disclosure | PX-006 Stage D |
| UX consistency improvements | PX-006 Stages C–D |

**Rule:** Do not rewrite PX-006 work to “look different.” Changes require a documented, measurable problem.

---

## Critical change rule

> **Do not redesign working interfaces simply to make them different.**

Every proposed UI change must solve a **measurable** problem:

- Reducing clicks
- Improving discoverability
- Improving readability
- Improving responsiveness
- Improving workflow continuity
- Improving accessibility
- Improving visual hierarchy

**Cosmetic changes without a clear user benefit are not acceptable.**

Each remediation item in the audit must cite: **problem → evidence → proposed fix → success metric**.

---

## Documents

| # | Document | Purpose |
|---|----------|---------|
| 01 | [Baseline & Constraints](./01-baseline-and-constraints.md) | Locked PX-006 surface + change rules |
| 02 | [Competitive Comparison Framework](./02-competitive-comparison-framework.md) | AppFolio, Buildium, DoorLoop, Yardi dimensions |
| 03 | [Enterprise SaaS Quality Bar](./03-enterprise-saas-quality-bar.md) | Linear, Stripe, Notion, Ramp, Vercel benchmarks |
| 04 | [Beta Readiness Criteria](./04-beta-readiness-criteria.md) | Go / no-go for limited beta |
| 05 | [Audit Protocol](./05-audit-protocol.md) | How to run the competitive walkthrough |
| 06 | [Initial Gap Analysis](./06-initial-gap-analysis.md) | Draft competitive assessment (2026-07-16) |
| 07 | [Remediation Backlog Template](./07-remediation-backlog-template.md) | Problem-driven fix queue (post-approval only) |

---

## Outcomes

| Deliverable | Description |
|-------------|-------------|
| Competitive scorecard | Module-by-module vs. four competitors |
| Enterprise quality scorecard | UX craft vs. reference SaaS products |
| Beta readiness verdict | Ready / Ready with constraints / Not ready |
| Prioritized remediation backlog | Only items with measurable user benefit |
| Beta cohort recommendation | Who can use M.P.A. today vs. who must wait |

---

## Sequencing

```
PX-007 Design & Document (this pack)
        ↓
Stakeholder review & Approve
        ↓
Execute audit protocol (manual + screenshots)
        ↓
Finalize gap analysis + beta verdict
        ↓
Approve remediation items (each cites measurable problem)
        ↓
Implement remediations (PX-007B or phased tickets)
        ↓
Phase 12 Production Hardening (unchanged roadmap)
```

---

## Related governance

- [Implementation Gate](../00-governance/implementation-gate.md)
- [Product Requirements Registry](../31-product-requirements/index.md)
- [Competitive Advantages (CA-001–011)](../31-product-requirements/competitive-advantages.md)
- [Development Roadmap](../17-development-roadmap/index.md)
