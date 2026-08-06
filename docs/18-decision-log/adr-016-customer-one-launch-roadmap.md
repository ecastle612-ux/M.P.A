# ADR-016: Customer #1 Launch-Aligned CORE Roadmap

## Status

Proposed

## Date

2026-08-06

## Context

The platform has certified Identity, Master Admin, UX-016, STD-001, NAV-001, ARCH-001, Property Lifecycle, Maintenance Operations, Leasing Operations, Resident Operations, and SignWell Production.

A concurrent architecture review (ADR-015) correctly established that Facility Operations is a first-class operational workspace — not a Maintenance screen. That finding risked being misread as “Facility is the next build (CORE-004).”

The immediate business objective is **onboarding the first production customer**. Continuing CORE-004 Facility implementation before Financial Operations, Vendor minimum, Communications, Onboarding, Commercial Hardening, and thin Reporting would delay the Customer #1 success loop and recreate delivery pressure to nest Facility capabilities under Maintenance.

See: [25 Product Readiness & Roadmap Alignment](../25-launch-readiness-roadmap/index.md)

## Decision

1. **Stop additional CORE-004 Facility implementation phases** until the Customer #1 launch path (CORE-L1…L7) is complete, unless a signed Customer #1 contract requires a thin Facility Launch Slice.
2. **Next implementation phase after Resident Operations is CORE-L1 Financial Operations (Rent Collection)** — not Facility Operations.
3. **Facility Operations remains first-class architecturally** (ADR-015). Implementation defaults to **CORE-L8** (post-launch).
4. Adopt the launch-aligned CORE sequence in [Revised CORE Roadmap](../25-launch-readiness-roadmap/revised-core-roadmap.md):
   - L1 Financial → L2 Vendor min → L3 Communications → L4 Documents → L5 Onboarding → L6 Production Hardening → L7 Reporting thin → **Launch Gate** → L8 Facility Foundation → …
5. **Launch blockers** are those listed in [Launch Readiness Audit](../25-launch-readiness-roadmap/launch-readiness-audit.md). Full Facility, Inventory, PM programs, CapEx, deep Analytics, Help Center, Search depth, Mobile, Offline/PWA are post-launch by default.
6. Preserve platform principles: workflow-first; one capability, one home; Extend > Reuse > Consolidate > Create; STD-001 / MAC-002 / NAV-001 / ARCH-001; Universal Dashboard Framework as presentation shell; no isolated CRUD.

## Consequences

### Easier

- Clear “what ships before Customer #1”
- Facility architecture decision (ADR-015) protected from launch schedule distortion
- Rent/vendor/comms gaps closed in dependency order
- Production hardening pulled before launch (not buried as “Phase 10”)

### More difficult

- Facility advocates must wait for L8 unless contract exception
- Legacy **17** phase numbers need mental mapping to CORE-L* (documented in package 25)
- Thin reporting must resist expanding into analytics theater before launch

### Forbidden until launch gate (unless contract exception)

- Implementing Facility Foundation / Inventory / PM programs / CapEx as the next CORE-004 track
- Nesting those capabilities under Maintenance to “go faster”

## Alternatives Considered

### A. Facility Operations next (CORE-004b immediately)

Rejected for launch alignment. Correct architecture, wrong sequence for Customer #1. Delays rent collection and commercial hardening.

### B. Vendor marketplace depth before rent

Rejected. Maintenance is certified; rent is existential cash flow (04 P1). Vendor **minimum** (L2) still ships before launch; bid-marketplace maturity can wait.

### C. Production hardening last (legacy Phase 10)

Rejected. Monitoring, backups, legal, Stripe production, and billing are Customer #1 blockers — pull to CORE-L6 before launch gate.

## Relationship to ADR-015

| ADR | Answers |
|-----|---------|
| ADR-015 | *What is Facility?* First-class workspace; ownership boundaries |
| ADR-016 | *When do we build Facility relative to Customer #1?* After launch-critical CORE-L1…L7 |

Both can be Accepted. Neither authorizes Facility implementation before the launch path without explicit exception.

## Approval

| Role | Decision | Date |
|------|----------|------|
| Lead Architect | _pending_ | |
| Product | _pending_ | |

On acceptance: treat package **25** as the authoritative CORE sequencing guide for Customer #1; update **17** header to point here.
