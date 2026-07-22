# ADMIN-002 — Master Admin Role Switcher

**Status:** Design ✔ · Document ✔ · **Draft — Awaiting Approval** · Implement **locked**  
**Depends on:** [ADMIN-001](../71-admin-001-master-admin-impersonation/README.md) **PASS** (Portal Test Mode + Impersonation Center + audit)  
**Initiative ID:** ADMIN-002

---

## Objective

Give Master Admins a **header Role Switcher** available from any authenticated screen so they can change effective portal/role experience in one or two taps — without opening Impersonation Center first.

## Why

ADMIN-001 unlocks every portal and impersonation. During QA, demos, and support, navigating to `/master-admin/impersonation` for every switch is too slow. A persistent chrome control makes the single-account test loop effortless.

## Target UI (Master Admin only)

Header badge / control (example structure):

```
Current Role
🛡 Master Admin ▼   (or current effective role label when impersonating / in Test Mode)

──────────────
Switch To
• Property Manager
• Resident
• Vendor
• Owner

Search User...
Emergency Launch...
Impersonation Center...
Return to My Session   (only when effective session active)
```

Visual: Canopy tokens; no emoji required if brand prefers iconography — shield/badge pattern OK. Must not collide with floating AI or mobile drawer.

## Behavior

| Action | Result |
| --- | --- |
| Switch To → role | Start Portal Test Mode for that role (reuse ADMIN-001 APIs) and navigate to the matching portal/home |
| Search User… | Inline search or jump to Impersonation Center filtered people list |
| Emergency Launch… | Same as ADMIN-001 Emergency Support (four portals) |
| Impersonation Center… | Navigate to `/master-admin/impersonation` |
| Return to My Session | Call existing end-session API; restore Master Admin chrome |

Authentication remains Master Admin. Effective subject + audit rules unchanged from ADMIN-001.

## Non-goals

- New capability keys or email allowlists  
- Redesigning permission evaluation  
- Showing the switcher to non–`master_admin` users  
- Replacing Impersonation Center (it remains the full directory)

## Documents

| Doc | Purpose |
| --- | --- |
| [01-placement-and-ia.md](./01-placement-and-ia.md) | Header placement · mobile · coexistence with AI / drawer |
| [02-approval.md](./02-approval.md) | Sign-off (empty until Approve) |

## Gate

```
Design → Document → Approve → Implement
```

Do **not** implement until ADMIN-001 is **PASS** and this package is **Approved**.
