# PX-007.06 — Initial Gap Analysis (Draft)

**Status:** Draft — pre-walkthrough desk assessment  
**Date:** 2026-07-16  
**Method:** Codebase + PRR review + public competitor feature research  
**Next step:** Validate via [05-audit-protocol.md](./05-audit-protocol.md) live walkthrough

---

## Executive summary

| Question | Initial answer |
|----------|----------------|
| Is M.P.A. commercially competitive with AppFolio/Buildium/DoorLoop/Yardi **today**? | **No** — missing table-stakes integrations (online payments, e-sign, screening, syndication, native mobile, full accounting). |
| Is M.P.A. competitive on **workflow UX and PM-first design**? | **Emerging yes** — PX-006 + CA-005/006/010 create genuine differentiation vs. legacy admin UIs. |
| Is M.P.A. ready for **design-partner beta**? | **Likely yes, with constraints** — small portfolios, manual payment recording, no resident production comms at scale. |
| Should we redesign working PX-006 UI? | **No** — unless audit finds measurable defects. |

---

## Where M.P.A. leads or differentiates

| Area | Evidence | CA anchor |
|------|----------|-----------|
| Workflow continuity | Setup wizard, success panels, guided chains, context rails | CA-005 |
| Human onboarding | Educational empty states, progressive disclosure | CA-010 |
| Operations-first dashboard | Tasks, activity, portfolio health (not vanity charts) | CA-006 |
| AI embedded in ops (foundation) | AI Operations module, human-gated recommendations | CA-001, CA-008 |
| Architecture discipline | RLS, org isolation, server/client boundaries | Platform trust |
| Unified OS (foundation) | Property→unit→tenant→lease→maint→financial graph | CA-002 |

These are **strategic bets**, not beta blockers for the right cohort.

---

## Parity gaps vs. category leaders (beta-relevant)

| Capability | M.P.A. today | AppFolio | Buildium | DoorLoop | Beta impact |
|------------|--------------|----------|----------|----------|-------------|
| Online rent collection (ACH/card) | Placeholder / manual record | ✓ | ✓ | ✓ | **High** — blocks “full PM” beta |
| E-sign leases | Placeholder | ✓ | ✓ (+fee) | ✓ | **High** |
| Tenant screening | Not present | ✓ | Add-on | ✓ | Medium |
| Listing syndication | Not present | ✓ | ✓ | ✓ | Medium |
| Native mobile apps | PWA/shell | Excellent | Good | Good | Medium |
| Full GL / QuickBooks | Foundation only | Good | Excellent | Good (sync) | High for accounting-first buyers |
| Owner portal (production) | Foundation / partial | ✓ | ✓ | ✓ | Medium |
| Resident portal (production) | Foundation | ✓ | ✓ | ✓ | **High** for MHF-001 |
| Push/SMS delivery | Foundation | ✓ | ✓ | ✓ | **High** for comms beta |
| Automation engine | Events foundation; limited rules | Extensive | Moderate | Growing | Low for design partner |
| AI autonomous execution | Human-gated only (correct) | Realm-X agents | Limited | Limited | Differentiation, not gap |

**Route parity gaps to PRR/phases** — not PX-007 UI tweaks.

---

## Draft scorecard (M.P.A. self-score)

*Validate in live audit. Scale 1–5 per [02-competitive-comparison-framework.md](./02-competitive-comparison-framework.md).*

| Module | M.P.A. | Notes |
|--------|--------|-------|
| PM web — core CRUD | **4** | Strong foundation Phases 4–7 |
| Workflow / onboarding | **5** | PX-006 differentiated |
| Maintenance | **3** | Usable; vendor assign works; no field mobile polish |
| Financials | **3** | Manual ledger ops; no online collection |
| Communications | **3** | Manager-side strong; delivery rails incomplete |
| AI Operations | **3** | Foundation; not autonomous (by design) |
| Tenant portal | **2** | Foundation; not production-ready |
| Owner portal | **2** | Deferred / partial |
| Online payments | **1** | Placeholder |
| Mobile | **2** | Responsive web; not native |

---

## Enterprise SaaS craft (post-PX-006)

| Dimension | Initial score | Notes |
|-----------|---------------|-------|
| Visual consistency | **4** | Canopy + PX-003/006 alignment |
| Workflow craft | **5** | Core PX-006 investment |
| Information hierarchy | **4** | Context rails + list workspaces |
| Responsive behavior | **3** | Needs audit at 390/768 — not assumed |
| Accessibility | **3** | Not formally audited yet |
| Performance | **3** | Phase 12 budget pending |

**vs. Linear/Stripe bar:** M.P.A. is closer on **workflow calm and guidance** than on **speed/keyboard density** — acceptable for PM domain; do not chase Linear chrome.

---

## Problems PX-007 should **not** solve with UI

| Temptation | Why reject |
|------------|------------|
| “Make financials look like Stripe” | Missing payment rails — cosmetic dashboard won't help |
| “Add fake AI insights” | Violates human-gated AI; use real data or onboarding copy (PX-006 done) |
| “Redesign sidebar because DoorLoop looks different” | No measurable problem; PX-006 baseline |
| “Hide missing features” | Beta requires honest limitation doc |

---

## Recommended beta positioning (initial)

**Target:** 1–3 design-partner PMs, residential, ≤ 50 units, tolerant of manual payments.

**Promise:** Best-in-class **workflow OS** for daily operations — property through maintenance — with transparent roadmap for payments, resident comms, and integrations.

**Not for:** Managers replacing AppFolio on day one; HOA-heavy; owner-self-service requirements.

---

## Advantages to emphasize in competitive narrative

1. **No dead ends** — every action suggests what's next (rare in legacy PMS admin UIs)
2. **Setup to operations in one session** — wizard + health widget
3. **Context everywhere** — detail rails reduce tab-hunting
4. **AI as copilot, not autopilot** — trust model for PM profession
5. **Modern stack** — faster iteration than 15-year-old codebases (long-term CA)

---

## Open questions for live audit

1. Does responsive context rail collapse cleanly at 768px?
2. Command palette / notification center — operational or still shell stubs?
3. Resident QR enrollment — demo-ready end-to-end?
4. Any PX-006 regressions under real data volume (100+ units)?
5. Click count: property → first rent charge recorded (target: ≤ N — measure in audit)

---

## Related

- [PX-006 audit Stage D](../38-px-006-workflow-experience-enterprise-ux/audit-results-stage-d.md)
- [Competitive Advantages](../31-product-requirements/competitive-advantages.md)
- [Must-Have Features](../31-product-requirements/must-have-features.md)
