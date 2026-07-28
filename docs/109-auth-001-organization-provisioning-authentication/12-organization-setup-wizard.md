# 12 — Organization Setup Wizard

**Package:** AUTH-001  
**Status:** Draft — Awaiting Approval

---

## Purpose

Immediately after Org Admin first-login hardening, launch a **mandatory Organization Setup Wizard** that takes the workspace from `pending_activation` / `setup_in_progress` to `active`.

---

## Entry conditions

| Condition | Required |
|-----------|----------|
| Authenticated Org Admin | ✔ |
| First-login gate complete | ✔ |
| Organization not yet `active` | ✔ |

Subaccounts invited during setup may log in, but cannot dismiss the Org Admin wizard requirement.

---

## Branch choice (mandatory)

After welcome, Org Admin chooses **exactly one** primary path:

| Option | Doc |
|--------|-----|
| **A — Professional Implementation** | [14](./14-professional-implementation-workflow.md) |
| **B — AI Guided Setup** | [13](./13-ai-guided-onboarding.md) |

They may later request assistance switch (AI → Professional) via support; state remains `setup_in_progress` until completion criteria met.

---

## Wizard steps (canonical checklist)

Order may adapt by org type / AI path, but completion requires these concerns addressed or explicitly deferred with reason:

| # | Step | Outcome |
|---|------|---------|
| 1 | Company information | Legal name, DBA, address, timezone, locale |
| 2 | Company branding | Logo / colors within Canopy rules |
| 3 | Secondary recovery contact | Required ([17](./17-emergency-recovery.md)) |
| 4 | Property import | Properties created or “none yet” |
| 5 | Unit import | Units mapped |
| 6 | Tenant import | Tenants staged/confirmed |
| 7 | Lease import | Leases staged/confirmed |
| 8 | Payments connection | Stripe / billing ops connection as applicable |
| 9 | Notification preferences | Channels + defaults |
| 10 | Invite team members | Optional but prompted |
| 11 | Finish setup | Confirm → `organization.state = active` |

Direct-owner orgs may skip PM-only steps (e.g., leasing staff) with typed defaults.

---

## Progress model

| Field | Meaning |
|-------|---------|
| `wizard_path` | `professional` / `ai_guided` |
| `steps[]` | status: `pending` / `in_progress` / `complete` / `deferred` |
| `completion_percent` | Derived |
| `activated_at` | Set once |

User can resume across sessions. Blocking product use outside setup-scoped routes until `active` (Approve may allow limited preview mode).

---

## Finish criteria

Organization becomes `active` when:

1. Required steps complete or explicitly deferred with acknowledgment  
2. Secondary recovery contact verified  
3. Org Admin confirms Finish  
4. Audit event `organization.activated` emitted  

---

## Relationship to MIG-001

Property/unit/tenant/lease import UX should reuse Migration Center patterns ([MIG-001](../74-mig-001-design-partner-migration/README.md)) inside the wizard rather than inventing a parallel importer.
