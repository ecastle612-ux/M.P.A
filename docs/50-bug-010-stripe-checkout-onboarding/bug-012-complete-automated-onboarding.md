# BUG-012 — Complete Automated Customer Onboarding

| Field | Value |
|-------|--------|
| Branch | `cursor/bug-012-complete-automated-onboarding-cf8a` |
| Status | Implementation ready — Production certification blocked until deploy |
| Constraint | No ADR-019 / pricing / Slice F / schema / Checkout redesign |

## Root causes addressed

1. **Serverless memory loss** — `provisioning_jobs` written to Postgres but status/claim only read process memory → `not_found` after cold start.  
2. **Fire-and-forget persistence** — `void persistJobRow` raced; DB could stall at `entitled` while memory reached `owner_pending`.  
3. **Claim signup conflict** — Slice D creates auth user before password; customer `signUp` fails as already registered.  
4. **Missing `saas_lifecycle_events`** — table existed; onboarding milestones were never written.

## Fixes (workflow only)

| Change | Purpose |
|--------|---------|
| `loadProvisioningJobFromDb` / status hydrate | Resume jobs across instances |
| `ensurePurchaseFromStripeSession` | Rebuild purchase from paid Checkout |
| `await persistJobRow` | Durable checkpoint writes |
| `POST /api/commerce/provision/claim-password` | Set password + confirm email for provisioned owner |
| Login commerce sign-up path | Uses claim-password then sign-in |
| Continue page auto-claim | Authenticated owner → claim → `/setup` |
| `recordOnboardingLifecycleEvent` | purchase_completed / provisioned / owner_pending / owner_claimed / activated |
| Admin consoles | Read jobs + lifecycle events from DB |

## Certification gate

Requires this branch deployed to Production (`www.my-property-assistant.com`), then full walkthrough as a new customer.
