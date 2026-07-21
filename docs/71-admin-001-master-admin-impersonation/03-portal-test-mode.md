# 03 — Portal Test Mode

**Package:** ADMIN-001  
**Status:** Draft

## Portals page (`/portal`) — Master Admin only

When authenticated subject has `master_admin`, replace dead-end **Return to Operations Center** CTAs with:

| CTA | Target |
| --- | --- |
| Open Resident Portal | Resident portal in Test Mode |
| Open Vendor Portal | Vendor portal in Test Mode |
| Open Owner Portal | Owner portal in Test Mode (even if unfinished for production) |
| Open Manager Portal | Manager / Operations experience labeled as Manager Portal Test Mode (or dedicated shell when it exists; until then Operations Center under Test Mode banner is acceptable if documented in implementation notes) |

Non–Master Admin users: **unchanged** current hub behavior.

## Banner (required on every Test Mode page)

```
MASTER ADMIN TEST MODE
Viewing {Portal name} Portal
Actions are simulated unless explicitly committed.
[Exit Test Mode]
```

Visual rules (Canopy):

- Persistent top-of-viewport chrome; not dismissible except via Exit  
- Distinct from Impersonation banner copy (see [04](./04-impersonation-center.md))  
- Must remain visible on mobile (sticky / safe-area aware)

## Behavior

- Entering a portal CTA sets Portal Test Mode for that portal role without logout.
- Exit Test Mode → Operations Center (`/dashboard`); clear test context; restore previous non-test chrome.
- Switching portal role from Portals or Emergency Support updates the banner label without new login.
- Prefer demo seed ([06](./06-demo-data-seeding.md)) when the Master Admin has no real linked records for that portal.

## Emergency Support Mode

From Impersonation Center (or Master Admin Testing):

- Launch directly into Resident / Vendor / Owner / Manager Test Mode without searching for a user.
- Same banner and exit semantics.
