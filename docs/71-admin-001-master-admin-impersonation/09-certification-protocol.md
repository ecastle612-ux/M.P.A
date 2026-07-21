# 09 — Certification Protocol

**Package:** ADMIN-001  
**Status:** Draft  
**Do not run as PASS until status is Approved and implementation is complete.**

## Preflight

- Sign in as a user with `master_admin` (capability grant — not email hardcode).  
- Confirm a non–Master Admin still sees gated Portals (control).  

## Script A — Portal Test Mode

| Step | Action | Expect |
| --- | --- | --- |
| A1 | Open `/portal` as Master Admin | Open Resident / Vendor / Owner / Manager CTAs (not Return-only) |
| A2 | Open Resident Portal | Banner TEST MODE; non-empty primary content |
| A3 | Exit Test Mode | Operations Center; banner gone |
| A4–A6 | Repeat Vendor, Owner, Manager | Same |
| A7 | Mobile viewport | Banner + CTAs usable |

## Script B — Impersonation Center

| Step | Action | Expect |
| --- | --- | --- |
| B1 | Open Impersonation Center | Directories load |
| B2 | Impersonate Resident | Banner shows Logged in as + Authenticated as |
| B3 | Navigate menus | Match resident restrictions |
| B4 | Return to My Session | One click; Master Admin chrome restored |
| B5–B7 | Impersonate Vendor, Owner, Property Manager | Same return semantics |
| B8 | Audit | Session rows with start/end/duration/pages |

## Script C — Negative

| Step | Action | Expect |
| --- | --- | --- |
| C1 | User without `master_admin` hits Impersonation Center | Unauthorized |
| C2 | User without `master_admin` on Portals | Unchanged gated CTAs |

## Deploy gate (after Approve + implement)

- `pnpm typecheck`  
- `pnpm --filter @mpa/web build`  
- Lint changed files  
- Deploy Preview; verify desktop + mobile  
- **Do not mark PASS** until every portal is accessible from the Master Admin account and Scripts A–C pass  
