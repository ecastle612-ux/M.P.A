# 26 — Phase B Verification

**Package:** FIN-003  
**Phase:** B — Owner onboarding polish  
**Date:** 2026-07-23  
**Kickoff:** `BEGIN FIN-003 PHASE B IMPLEMENTATION`  
**Plan:** [24](./24-phase-b-planning.md) · Auth: [25](./25-phase-b-authorization.md)

---

## Scope attestation

| Included | Done |
|----------|------|
| Onboarding UX / remediation flow | ☑ |
| Verification state sync improvements | ☑ |
| Capability refinement (PM least privilege) | ☑ |
| Owner Portal onboarding improvements | ☑ |
| PM owner Connect roster (read-only) | ☑ |
| Optional onboarding nudges | ☑ |
| Onboarding audit enhancements | ☑ |

| Excluded | Confirmed |
|----------|-----------|
| Money movement / transfers | ☑ |
| Allocation / reserves / schedules | ☑ |
| Phases C–E | ☑ Locked |

---

## Task evidence

| Task | Evidence |
|------|----------|
| B1 Return/remediation UX | `ConnectOnboardingCard` next-step panel + auto-refresh on return; Financials/`settings/payouts` refresh |
| B2 Status sync | `remediationGuidance` + `lastSyncedAt` on status view; refresh still via provider |
| B3 Capability refinement | Migration removes PM `payout:onboard`; PM uses `payout:manage` |
| B4 Owner Portal polish | Financials card copy; dashboard attention when remediation required |
| B5 PM visibility | `listOwnerConnectStatusesForOrg` + `OwnerConnectRoster` on `/settings/payouts` |
| B6 Nudges | `sendOwnerOnboardingNudge` + `/api/payouts/org/nudge-onboarding` via Notification Service |
| B7 Docs | This file + [27](./27-phase-b-completion.md) |

---

## Quality gates

| Gate | Result | Notes |
|------|--------|-------|
| Unit tests | ✅ PASS | 14 tests (Connect + remediation guidance) |
| Typecheck | ✅ PASS | `apps/web` tsc |
| ESLint | ✅ PASS | Scoped Phase B paths |
| Production build | ✅ PASS | `next build` |
| Security review | ✅ Documented | [27](./27-phase-b-completion.md) — roster status-only; nudge day-idempotent |

---

## Grant matrix (Phase B)

| Role | Capability | Use |
|------|------------|-----|
| `property_owner` | `payout:onboard` | Self Connect onboarding |
| `property_manager` | `payout:manage` | Org settlement + owner roster + nudge |
| (removed) | PM `payout:onboard` | Removed — least privilege |
