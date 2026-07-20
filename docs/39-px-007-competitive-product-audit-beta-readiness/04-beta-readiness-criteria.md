# PX-007.04 — Beta Readiness Criteria

**Status:** Draft

---

## Beta definition

**Beta** = limited cohort of real property managers running **real portfolios** with known limitations, not a public launch.

Beta is **not**:
- Feature-complete parity with AppFolio
- Paid marketing launch
- Owner/resident-facing production at scale without comms/payment integrations

---

## Go / no-go gates

### P0 — Must pass for any beta

| # | Criterion | Verification |
|---|-----------|--------------|
| B1 | Core chain works E2E: org → property → unit → tenant → lease | Manual walkthrough |
| B2 | Maintenance request → assign vendor → track status | Manual walkthrough |
| B3 | Rent charge → record payment → visible balance | Manual walkthrough |
| B4 | No P0 workflow dead ends (PX-006 success panels) | Regression check |
| B5 | No client/server boundary violations | `pnpm build` clean |
| B6 | Auth + org isolation verified | Security smoke |
| B7 | Honest limitation doc for beta users | Published in beta pack |
| B8 | Data export path defined (even if manual) | Documented |

### P1 — Required for “open beta” (wider cohort)

| # | Criterion | Notes |
|---|-----------|-------|
| B9 | Resident portal usable for announcements | MHF-001 partial OK |
| B10 | Online rent collection OR explicit manual-only beta scope | ACH placeholder ≠ production |
| B11 | Mobile-usable PWA for field PM tasks | MOB roadmap |
| B12 | Error monitoring (Sentry) | Phase 12 |
| B13 | Performance budget met on dashboard + lists | Phase 12 |

### P2 — Commercial launch (post-beta)

Full MHF satisfaction, integrations (INT-*), automation (AUT-*), production hardening — **Phase 12**, not PX-007.

---

## Beta cohort recommendation (initial)

| Cohort | Fit today | Why |
|--------|-----------|-----|
| **Design partner PMs** (1–3 orgs, < 50 units) | **Likely yes** | Core ops + workflow UX strength; tolerate manual payments |
| **Growing managers expecting DoorLoop parity** | **Not yet** | Online payments, screening, syndication gaps |
| **Enterprise AppFolio refugees** | **No** | AI depth, mobile, accounting integrations insufficient |
| **HOA-heavy (Buildium-style)** | **No** | HOA not in scope |

---

## Beta readiness verdict options

| Verdict | Meaning |
|---------|---------|
| **Ready — design partner beta** | P0 pass; limited cohort with signed limitations |
| **Ready with constraints** | P0 pass; specific modules excluded from beta scope |
| **Not ready** | P0 fail or critical trust gap |

**Initial assessment (updated RC-001 2026-07-17):** **GO — Design Partner beta (constrained).**  
See [RC-001](../52-rc-001-beta-readiness/README.md). Owner/Vendor portals, offline sync, and open beta remain NO-GO.

---

## Beta limitation doc (required content)

Beta users must receive explicit list of:

- Manual payment recording only (if applicable)
- No e-sign / screening / syndication
- AI Operations: human review required; not autonomous
- Resident push/SMS: foundation vs. production delivery
- Supported browsers and viewports
