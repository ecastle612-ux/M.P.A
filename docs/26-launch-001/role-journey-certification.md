# LAUNCH-001 — Customer Journey Certification (by Role)

**Status:** Draft — desk certification against `release/rc1` + Blueprint  
**Method:** Walk each role’s “entire day.” Mark stuck points. No code changes.  
**Legend:** ✅ Can complete · ⚠️ Friction / partial · ❌ Blocked for Customer #1

---

## 1. Master Admin

| Question | Finding |
|----------|---------|
| Full day of work? | ⚠️ Can operate health/flags/impersonation/commercial tools on rc1; support runbook (LB-17) incomplete |
| Stuck where? | Live Stripe/SignWell ops gaps; ship-tree drift vs docs |
| Nav confusing? | Ops Center density — acceptable for internal role |
| Duplicated workflows? | Multiple “dashboards” under master-admin — consolidate messaging, not rebuild |
| Feels unfinished? | Provider matrix still shows noop gaps in production cert |

**Launch action:** LB-17, LB-18, LB-02/05 ops visibility — not new Master Admin features.

---

## 2. Organization Admin

| Question | Finding |
|----------|---------|
| Full day of work? | ⚠️ Setup → Billing → Team works in code; **paid buyer path unproven** (LB-02/03/09) |
| Stuck where? | Checkout card completion / activation ledger; Privacy/Terms missing |
| Nav confusing? | Settings IA consolidated on rc1 — OK if SetupGate is clear |
| Duplicated workflows? | Org create via acquire vs dashboard — must be one canonical paid path |
| Feels unfinished? | Until live billing cert, feels like beta |

**Launch action:** LB-02, LB-03, LB-09, LB-11, LB-12.

---

## 3. Property Manager

| Question | Finding |
|----------|---------|
| Full day of work? | ⚠️ Property, maintenance, leasing, financials present — daily loop depends on Inbox/Command Center quality + live rent/sign |
| Stuck where? | “Where do I go?” across Properties / Units / Tenants / Residents / Leases; Facility vs Maintenance boundary |
| Nav confusing? | High nav count (portfolio + leasing + maintenance + accounting + facility + communications + intelligence) |
| Duplicated workflows? | Tenants vs Residents paths; Manager Portal vs Ops app; Inbox vs Notification Center vs Communications |
| Feels unfinished? | Facility breadth can overwhelm a first customer who only needs reactive maintenance |

**Launch action:** Journey dry-run (LB-22); IA consolidations in [Product Organization Audit](./product-organization-audit.md); **do not** expand Facility (🔵).

---

## 4. Leasing Agent

| Question | Finding |
|----------|---------|
| Full day of work? | ⚠️ Applicants → Leases → Move-in present; **e-sign prod ❌** until LB-05 |
| Stuck where? | SignWell noop in production cert; screening may be sandbox |
| Nav confusing? | Applicants / Leases / Residents / Move-in scattered |
| Duplicated workflows? | Move-in under Residents vs lease detail actions |
| Feels unfinished? | Without live SignWell, leasing cannot be sold as complete |

**Launch action:** LB-05, LB-08; optional ST leasing nav clarity (B).

---

## 5. Maintenance Technician

| Question | Finding |
|----------|---------|
| Full day of work? | ⚠️ If org user: Maintenance WO path. Field tech often = **vendor token**, not staff role |
| Stuck where? | Staff “technician” persona under-documented vs vendor token journey |
| Nav confusing? | Facility calendar/PM screens distract from today’s jobs |
| Duplicated workflows? | Facility inspections vs Maintenance WOs |
| Feels unfinished? | OK for launch if vendor token path certified |

**Launch action:** Certify vendor token day (F-steps in checklist); keep Facility expansion frozen; clarify persona in Known Limitations.

---

## 6. Resident

| Question | Finding |
|----------|---------|
| Full day of work? | ⚠️ Pay rent / request maintenance / messages / documents on tenant portal — depends on LB-04/06 |
| Stuck where? | Live payment provider; email delivery; first-login clarity |
| Nav confusing? | Generally clearer (consumer chrome) — Good |
| Duplicated workflows? | Documents vs messages attachments — minor |
| Feels unfinished? | Community / extras can wait (🔵) |

**Launch action:** LB-04, LB-06; keep portal scope tight for #1.

---

## 7. Vendor

| Question | Finding |
|----------|---------|
| Full day of work? | ⚠️ Token link job flow (not full portal) — intentional |
| Stuck where? | Invoice/pay depth; SMS-first journey post-launch |
| Nav confusing? | Minimal by design — Good |
| Duplicated workflows? | Avoid building parallel vendor portal during LAUNCH-001 |
| Feels unfinished? | Acceptable if Known Limitations state token model |

**Launch action:** Certify token complete+invoice baseline; PL-12 SMS later.

---

## 8. Owner

| Question | Finding |
|----------|---------|
| Full day of work? | ⚠️ Portal MVP on rc1 (properties/financials/docs/messages/reports) |
| Stuck where? | Payout ops gates; statement freshness; ACL interim notes |
| Nav confusing? | Relatively clear desktop/mobile nav |
| Duplicated workflows? | Owner financials vs PM owner-statements — ensure one owner-facing truth |
| Feels unfinished? | Fine for #1 if PM-mediated gaps are disclosed |

**Launch action:** ST-01 only if dry-run fails; else Known Limitations.

---

## Cross-role stuck map (highest severity)

| Severity | Stuck point | Board |
|----------|-------------|-------|
| ❌ | Live SaaS billing activation unproven | LB-02/03 |
| ❌ | SignWell production noop | LB-05 |
| ❌ | Privacy/Terms missing | LB-11/12 |
| ❌ | Error reporting / monitoring gaps | LB-13–15 |
| ⚠️ | PM nav overload / Tenants vs Residents | Product Org audit |
| ⚠️ | Facility breadth vs Maintenance job | Freeze Facility expansion |
| ⚠️ | Manager Portal vs Ops Command Center | Prefer Ops; document |

---

## Certification outcome (desk)

| Role | Day complete? | Launch readiness |
|------|---------------|------------------|
| Master Admin | ⚠️ | Support path incomplete |
| Org Admin | ⚠️ | Billing/setup live gap |
| Property Manager | ⚠️ | Usable if blockers clear; IA friction |
| Leasing Agent | ❌ until SignWell | LB-05 |
| Maintenance Technician | ⚠️ via vendor token | Certify token |
| Resident | ⚠️ until live rent/email | LB-04/06 |
| Vendor | ⚠️ | Token + Known Limitations |
| Owner | ⚠️ | MVP + disclosure |

**Not ready to claim “every role can complete an entire day” on production until LB-22 PASS.**
