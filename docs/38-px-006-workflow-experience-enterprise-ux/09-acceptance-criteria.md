# PX-006.09 — Acceptance Criteria

**Status:** Approved

---

## Final acceptance test

A property manager starting with an empty account reaches a fully configured portfolio **without ever asking**:

- "Where do I go next?"
- "Why is this page empty?"
- "What does this mean?"
- "How do I continue?"

---

## Setup wizard (P0)

- [ ] Complete setup wizard flow from Welcome → Operations Center
- [ ] Step indicator visible throughout wizard
- [ ] Profile, org, property, unit, tenant, lease steps complete in order
- [ ] Invite team skippable; all other required steps enforced
- [ ] Incomplete setup resumes on return visit
- [ ] Greeting uses first name — never email

---

## Workflow dead ends (P0)

- [ ] Every successful create action offers: continue next step, view record, do another, return, or skip
- [ ] No success screen or toast leaves user wondering what to do
- [ ] Org, property, unit, tenant, lease, vendor, maintenance, financial creates covered

---

## Enterprise desktop density (P0)

- [ ] Major pages reviewed at 1280, 1440, 1600, 1920, ultrawide
- [ ] Layouts expand intelligently — no large empty areas beside narrow forms
- [ ] Create pages use 2fr/1fr layout on desktop

---

## Context everywhere (P0)

- [ ] Tenant detail surfaces: lease, unit, property, payments, maintenance, communications, timeline, next action
- [ ] Property, unit, lease, vendor detail pages have contextual rails
- [ ] Users rarely need to navigate away for basic context

---

## Progressive disclosure (P1)

- [ ] Advanced tools hidden until relevant (e.g., vendor analytics after first vendor)
- [ ] Interface grows with portfolio maturity

---

## Portfolio setup health (P1)

- [ ] Health indicator with percentage on dashboard
- [ ] Steps: Organization, Property, Units, Tenants, Vendors, Active Lease, Financials, Owner Statement
- [ ] Dismissible after completion

---

## Human language (P1)

- [ ] No "No data available" or technical messaging in user-facing copy
- [ ] Empty states use action-oriented, encouraging language

---

## Navigation (P1)

- [ ] Breadcrumbs on dashboard and all detail pages
- [ ] Consistent "Dashboard" root label

---

## UX audit (P1)

- [ ] Full walkthrough completed per [11-ux-audit-protocol.md](./11-ux-audit-protocol.md)
- [ ] audit-results.md documents issues and resolutions
- [ ] Mobile, tablet, desktop validated

---

## Regression guardrails

- [ ] Phases 1–11 unchanged
- [ ] `pnpm lint`, `typecheck`, `test`, `build` pass
- [ ] No database migrations or API contract changes
- [ ] Official SVG branding unchanged (PX-005)
