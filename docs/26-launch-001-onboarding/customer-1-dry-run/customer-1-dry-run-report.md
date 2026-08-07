# Customer #1 Dry Run Report

**Authorization:** `AUTHORIZE CUSTOMER #1 DRY RUN`  
**Date:** 2026-08-07  
**Product:** Property Manager  
**Method:** Zero-knowledge operational simulation against shipped product surface (live staging unavailable in agent VM — no Supabase/app secrets)

---

## Verdict for a paying customer

Staff Property Manager journeys (property → team invite send → resident → lease → FO → MCC → docs/comms) are largely launch-shaped.

**A multi-role Customer #1 dry run would lose confidence today** because return logins for invited/portal roles do not land in the correct workspace, and several journey CTAs / identity labels mislead.

Everything not listed below is treated as **launch-ready** for this report.

---

## Critical bugs

Issues that break the advertised multi-role lifecycle or misidentify the user.

### DR-C1 — Post-login home ignores role (SKU-only redirect)

| Field | Detail |
|-------|--------|
| Symptom | After login, `/dashboard` redirects with `defaultHomeForSku` → always `/pm/mission-control` for Property Manager orgs. |
| Who breaks | Resident, Vendor, Owner, Leasing Agent, Maintenance Technician on every **return** login (first invite-accept may briefly use correct `homeHref`). |
| Evidence | `apps/web/src/app/(app)/dashboard/page.tsx`; `defaultHomeForSku` in `lib/commercial/server.ts`; login → `/dashboard` in `login-form.tsx` / middleware. |
| Customer impact | Tenant/vendor/owner open staff Mission Control (SKU entitlement allows `/pm/*`). Paying resident cannot “just open the app and pay rent.” |
| Confidence | **Lost** |

### DR-C2 — Membership roles stripped for launch staff roles

| Field | Detail |
|-------|--------|
| Symptom | `getOrganizationsForUser` keeps only `property_manager` \| `property_owner` \| `tenant` \| `vendor`. Drops `organization_admin`, `leasing_agent`, `maintenance_technician`. |
| Cascade | Empty role set → shell fallback `USER_ROLES[0]` = `organization_admin` — leasing agent / tech can appear as Organization Admin. |
| Evidence | `apps/web/src/lib/organization/server.ts` (role filter); `get-shell-context.ts` fallback. |
| Customer impact | Invited staff cannot be trusted to see the correct workspace identity or nav. |
| Confidence | **Lost** |

### DR-C3 — Mission Control “Submit your first maintenance request” is a dead end for staff

| Field | Detail |
|-------|--------|
| Symptom | Next-action CTA title/copy says **Submit** request; `href` is `/pm/maintenance`. Staff MCC has **no** create form — empty state waits for resident portal submit. |
| Evidence | `packages/shared/src/property/journey.ts` (`href: "/pm/maintenance"`); MCC empty copy; resident submit at `/portal/tenant/maintenance`. |
| Customer impact | Org Admin/PM following the assistant cannot complete the step without a resident already in portal — and portal return login is broken (DR-C1). |
| Confidence | **Lost** |

### DR-C4 — Resident portal provisioning hard-fails without service role

| Field | Detail |
|-------|--------|
| Symptom | Lease activation calls `provisionResidentPortalAccess`, which requires `SUPABASE_SERVICE_ROLE_KEY`. Missing key → activation throws. |
| Evidence | `apps/web/src/lib/portal/portal-access-service.ts` (`adminClient`). |
| Customer impact | “Record signed offline / activate” can fail entirely in misconfigured staging/prod. |
| Confidence | **Lost** if env incomplete; config gate, not optional honesty |

### DR-C5 — Provisioned residents/vendors may have no usable login handoff

| Field | Detail |
|-------|--------|
| Symptom | Auth user may be created via invite email or `createUser` with confirmed email and **no password**. Staff UI never shows reset/magic link after activation/assign. |
| Customer impact | Even with membership fixed, Customer #1’s resident/vendor may not know how to sign in. |
| Confidence | **Lost** without an operator runbook |

---

## Workflow friction

Would slow or confuse Customer #1; may not hard-crash, but feels wrong.

### DR-F1 — “Purchase” is imaginary for self-serve

| Field | Detail |
|-------|--------|
| Symptom | No customer purchase/checkout. Signup → org create auto-assigns Property Manager. Guided Setup says “You purchased Property Manager.” |
| Impact | Enterprise buyer asks “where did I pay?” White-glove is acceptable only if sales says so. |
| Roles | Buyer / Org creator |

### DR-F2 — Org creator is `property_manager`, never `organization_admin`

| Field | Detail |
|-------|--------|
| Symptom | `POST /api/organizations` inserts membership `roles: ["property_manager"]` while invite UI offers Organization Admin. |
| Impact | Identity mismatch; creator must invite themselves as admin to match mental model. |
| Roles | Org Admin (expected) vs actual PM |

### DR-F3 — Maintenance next-action wording vs reality

| Field | Detail |
|-------|--------|
| Symptom | CTA says “Submit” but staff can only triage; resident must submit. |
| Related | DR-C3 |
| Roles | PM, Resident |

### DR-F4 — Vendor surface feels unfinished

| Field | Detail |
|-------|--------|
| Symptom | Nav item **Vendors** → honesty page pointing at Maintenance + FO. Functional but low-trust. |
| Impact | Customer expects a directory, finds a redirect note. |
| Roles | PM |

### DR-F5 — Master Admin cannot browse Customer #1 without a UUID

| Field | Detail |
|-------|--------|
| Symptom | `/admin/platform/organizations` is a stub (“Customer organization directory for operators”) with no list. Launch Readiness requires pasting org id. |
| Impact | HQ cannot observe the new org naturally. |
| Roles | Master Admin |

### DR-F6 — FO badges expose internal launch labels

| Field | Detail |
|-------|--------|
| Symptom | Financial Operations shows badges “S3 Command Center live” / “LAUNCH-001 J5 collect”. |
| Impact | Feels like unfinished internal build to a paying customer. |
| Roles | PM |

### DR-F7 — Team list shows truncated user ids

| Field | Detail |
|-------|--------|
| Symptom | Active members rendered by truncated `user_id`, not name/email. |
| Impact | After invites, roster is hard to verify. |
| Roles | Org Admin / PM |

### DR-F8 — Documents & Communications off the Mission Control rail

| Field | Detail |
|-------|--------|
| Symptom | Required dry-run steps exist in Shared nav but are never the “Today’s mission” CTA. |
| Impact | Easy to miss in an unaided first week; not broken. |
| Roles | PM |

---

## Production polish (confidence)

| ID | Issue | Why it hurts confidence |
|----|-------|-------------------------|
| DR-P1 | Tenant home still says “Full work-order journeys continue in later launch steps.” | Sounds unfinished after maintenance shipped |
| DR-P2 | Property wizard title always “Add your first property” | Feels stuck in onboarding |
| DR-P3 | Launcher vs Mission Control dual homes | New users hesitate where “home” is |
| DR-P4 | Billing checklist can be checked without opening Billing | Setup feels performative |
| DR-P5 | Resend skipped → copy accept link | Acceptable if sold as white-glove; shaky if “email invites” promised |

---

## Step scorecard (Customer #1 sequence)

| Step | Next action obvious? | Premium feel? | Outcome |
|------|----------------------|---------------|---------|
| Purchase | No | No | Friction (DR-F1) — white-glove only |
| Organization | Partial | Good | Friction (DR-F2) |
| Setup | Yes | Good | Polish (DR-P3/P4) |
| Property | Yes | Strong | Launch-ready |
| Invite team | Partial | Good send; weak roster | **Critical** on invitee return (DR-C1/C2) |
| Resident | Yes | Strong | Launch-ready (staff) |
| Lease / SignWell / activate | Partial | Strong offline honesty | **Critical** if no service role / login handoff (DR-C4/C5) |
| Rent collection | Partial | Strong staff; FO badges hurt | Friction (DR-F6) |
| Maintenance | No (staff CTA) | Strong MCC otherwise | **Critical** (DR-C3 + portal login) |
| Vendor | Partial | Weak Vendors nav | Friction (DR-F4) + portal login critical |
| Owner review | Yes for PM preview | Strong portfolio | **Critical** owner return login (DR-C1) |
| Documents | Partial discoverability | Strong | Polish (DR-F8) |
| Communications | Partial discoverability | Strong | Polish (DR-F8) |
| Master Admin observe | No | HQ incomplete | Friction (DR-F5) |

---

## Role outcomes

| Role | Can do daily work unaided? | Blocker |
|------|----------------------------|---------|
| Organization Admin | Partial (creator is PM) | DR-F2 |
| Property Manager | Mostly yes on staff surfaces | DR-C3 maintenance CTA; FO badges |
| Leasing Agent | **No** reliable home/identity | DR-C1, DR-C2 |
| Maintenance Technician | **No** reliable home/identity | DR-C1, DR-C2 |
| Resident | **No** reliable return path / login handoff | DR-C1, DR-C4, DR-C5 |
| Vendor | **No** reliable return path / login handoff | DR-C1, DR-C4/C5 pattern |
| Owner | **No** reliable return path | DR-C1 |
| Master Admin | Partial — cert panels work with UUID | DR-F5 stub directory |

---

## What is launch-ready (not listed above)

- Guided Setup → Mission Control next-action model (for PM creator)  
- Property create → Property Command Center  
- Resident create → pending portal honesty  
- Lease draft → SignWell optional / offline signed path (when service role present)  
- FO collect / manual payment / receipts / ledger (staff)  
- Maintenance Command Center triage/assign/complete (once a request exists)  
- Owner portfolio UI quality (when reachable)  
- Documents library + Communications compose (when found in nav)  
- Launch Readiness evidence panels (J0–J8 + Docs/Comms) given an org id  

---

## Recommended fix order (for a future authorize — not executed here)

1. **DR-C2** — Stop stripping launch roles in `getOrganizationsForUser`.  
2. **DR-C1** — `/dashboard` (and login) must route by **primary membership role**, not SKU alone.  
3. **DR-C3** — Change maintenance CTA copy/href to resident portal or staff-capable path; do not say “Submit” for staff MCC.  
4. **DR-C4/C5** — Fail closed with operator-visible guidance; surface resident/vendor access link after provision.  
5. **DR-F5 / DR-F6 / DR-P1** — MA org directory stub, FO internal badges, tenant stale copy.

---

## STOP

Report complete.  
**No code changes** under this authorization.  
Await next authorization before remediation.
