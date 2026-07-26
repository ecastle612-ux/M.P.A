# V1.0 Slice A — Owner Portal Ship Integrity

**Status:** 🟢 **IN PROGRESS** — authorized 2026-07-25  
**Phrase:** `BEGIN V1.0 SLICE A — OWNER PORTAL SHIP INTEGRITY`  
**Mission:** [V1.0 Implementation Mission](./v1-0-implementation-mission.md)  
**Gap audit:** [V1.0 Gap Audit](./v1-0-gap-audit.md)  
**Package:** [OWNER-001](../104-owner-001-commercial-owner-portal/README.md) (already CERTIFIED PASS — this slice lands it on the shippable baseline)

---

## Goal

Remove the Production/HEAD integrity failure where Owner Portal home served `FutureReleaseNotice` while governance claimed OWNER-001 CERTIFIED PASS.

**Exit criteria:**

1. Shippable git SHA serves Owner Portal MVP (dashboard, properties, financials, documents, messages, reports, settings, more).  
2. No Future Release notice on advertised owner MVP home.  
3. Desktop nav + mobile bottom nav per OWNER-001.  
4. Production deploy of that SHA.  
5. Owner role path smoke (login → `/portal/owner` → one secondary section).

---

## Out of scope

- PUSH-001 real-device certification (abandoned — see [PUSH-001 abandon note](./push-001-real-device-cert-abandoned.md))  
- AUTH-001 / COM-001 / OPS-001 WIP  
- ShellProviders / `@mpa/ui/shell` split  
- Facility inventory / PM / calendar  

---

## Architecture SoT for this slice

Root `AppProviders` + `@mpa/ui` (Production). Do not land parallel provider stacks.
