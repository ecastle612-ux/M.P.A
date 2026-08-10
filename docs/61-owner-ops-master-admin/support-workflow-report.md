# Support Workflow Report

**Date:** 2026-08-10

## Primary workflow (customer calls)

1. Open `/admin` Command Center  
2. Search by email / org / property / user id  
3. Open **Organization profile** or **User profile**  
4. Inspect subscription, Guided Setup, provisioning checkpoint, invitations, Stripe links  
5. Take audited action if needed:
   - Resend invitation
   - Regenerate claim link
   - Retry failed provisioning
   - Start **View As** (read-only)
6. Exit View As via banner → return to Command Center  
7. Confirm resolution in Support timeline / support audit on org profile

## Audited actions

All write support actions insert into `platform_support_audit_events`:

| Action | API |
|---|---|
| `invitation.resend` | `POST /api/admin/support/resend-invitation` |
| `claim_link.regenerated` | `POST /api/admin/support/regenerate-claim-link` |
| `impersonation.started` / `impersonation.ended` | `POST /api/admin/impersonation` |
| Provisioning retry | Existing `POST /api/admin/commerce/provisioning/retry` |

## View As security

- Operator-only start
- Roles: Property Manager, Organization Owner, Facility Manager, Technician, Resident
- Default mode: **read_only**
- Persistent visible banner + Exit
- Middleware blocks customer `/api` mutations while read-only session cookie is set
- Session rows in `platform_impersonation_sessions`

## SignWell / notifications / documents

- Stripe customer/subscription: org profile + billing directory  
- Documents / SignWell status: org profile counts + Document Intelligence workspace  
- Notification / failure history: Support Center timeline (lifecycle, webhooks, Guided Setup incomplete)
