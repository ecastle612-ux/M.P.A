# 06 — Acceptance Criteria

**Package:** UX-013  
**Status:** Draft — Ready for Approval

---

## Acquisition

| ID | Criterion |
|----|-----------|
| ACQ-J1 | Happy path includes module selection before plan comparison |
| ACQ-J2 | Public surfaces do not present a standalone Free Trial plan card or “Start free trial” primary CTA |
| ACQ-J3 | Self-serve Checkout accepts only `professional` and `business` plan codes from public entry |
| ACQ-J4 | Checkout metadata includes `module_selection` |
| ACQ-J5 | Enterprise path remains Contact Sales / Schedule Demo only |
| ACQ-J6 | No public account registration without successful paid Checkout provision |
| ACQ-J7 | Post-payment Guided Setup uses existing SetupGate — no trial-specific setup tree |

## Subscription / entitlements

| ID | Criterion |
|----|-----------|
| SUB-1 | Module choice maps to BILL/AUTH without a second money rail |
| SUB-2 | Property-only vs Facility-only vs Both entitlement behavior matches Approved answer to OQ-01/OQ-04 |
| SUB-3 | Founder remains non-public |

## Navigation

| ID | Criterion |
|----|-----------|
| NAV-1 | Matrices A–G approved as SoT for primary nav contents |
| NAV-2 | Visibility uses role ∧ capability ∧ module filters |
| NAV-3 | Property-only orgs do not show Facility primary rail; Facility-only do not show Property primary rail |
| NAV-4 | Tenant and Owner portals remain portal-scoped |
| NAV-5 | Unentitled items are hidden, not shown as unauthorized teasers in primary nav |

## Gate

| ID | Criterion |
|----|-----------|
| GATE-1 | No application/UI code for UX-013 before [08 Approval record](./08-approval-record.md) |
| GATE-2 | PRs after Approve cite approval phrase and slice authorize phrase |
