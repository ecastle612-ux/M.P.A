# Property Manager Production Certification

**Authorization:** `AUTHORIZE PROPERTY MANAGER PRODUCTION CERTIFICATION`  
**Date:** 2026-08-06  
**Scope:** Advertised Property Manager subscription only  
**Method:** Code-path + evidence-surface audit against Customer #1 onboarding tomorrow  
**Parent:** [LAUNCH-001](../index.md) · [Customer Promise Certification](../property-manager-customer-promise-certification.md)

---

## Verdict

### **NO-GO** for onboarding Customer #1 tomorrow

Feature development for the advertised Property Manager subscription is **feature complete**.  
Production certification finds **one P0 launch blocker** that prevents unaided end-to-end proof of resident-facing scenarios:

> Lease “portal activation” sets `portal_status=active` but does **not** provision a `tenant` organization membership or reliably link an auth user — so `/portal/tenant` redirects to `/unauthorized`.

Until that defect is fixed (or an authorized white-glove resident access runbook is proven), Scenarios **5–7** cannot be certified as production-ready without workarounds.

**Staff-side** Property Manager operations (Mission Control → property → team → resident record → lease → FO collections → maintenance desk → owner portfolio → Documents → Communications) are substantially ready.

---

## Success criteria (required for GO)

| Criterion | Result |
|-----------|--------|
| Every advertised capability works | **Not met** — resident portal login path broken |
| Every customer journey completes | **Not met** — S5–S7 resident-facing steps fail unaided |
| Every integration succeeds | **Conditional** — Stripe/SignWell/Resend optional with honesty paths |
| Every role reaches correct workspace | **Not met** — `tenant` (and often `vendor`) cannot reach portal unaided |
| Workflows understandable without docs | **Mostly met** on staff surfaces |

---

## Scenario scoreboard

| # | Scenario | Status | Score | Notes |
|---|----------|--------|------:|-------|
| 1 | Purchase → org → login → Setup → Mission Control | **Conditional** | 85 | White-glove / Admin SKU assign OK for Customer #1; no SaaS checkout |
| 2 | First property → PCC → Mission Control | **Pass** | 95 | J1 evidence API |
| 3 | Invite team → accept → workspace | **Conditional** | 80 | Accept path solid; Resend required for email delivery |
| 4 | Create resident → property → unit | **Pass** | 95 | J3 evidence API |
| 5 | Lease → SignWell → activation → portal | **Fail** | 45 | Lease/SignWell/offline Pass; **portal login Fail** |
| 6 | Collect rent → payment → receipt → ledger → property | **Conditional** | 70 | Staff/manual + Stripe paths Pass; **resident Pay Now needs portal** |
| 7 | Maintenance request → assign → complete → confirm | **Conditional** | 65 | Staff MCC Pass; **resident submit/confirm needs portal user** |
| 8 | Owner login → portfolio → drill-down | **Pass** | 90 | J8 evidence API |
| 9 | Documents upload/retrieve/SignWell/search/permissions | **Conditional** | 80 | Operational library Pass; org-wide ACL coarse |
| 10 | Communications send/notify/history | **Conditional** | 80 | Operational Pass; email optional |

**Production readiness score: 78 / 100**  
**Launch decision: NO-GO** (P0 resident portal access)

---

## Scenario findings

### Scenario 1 — Purchase → Mission Control — Conditional (85)

| Step | Result |
|------|--------|
| Purchase Property Manager | Conditional — self-serve org assigns `mpa_property_manager` or Admin assign; no customer Stripe SKU checkout |
| Organization created | Pass |
| Login | Pass — Supabase Auth |
| Guided Setup | Pass — `/setup` |
| Mission Control | Pass — `/pm/mission-control` |

**MA:** J0 script + subscription console (no `/api/admin/launch/j0` panel).  
**Friction:** Marketing must not imply paid self-serve checkout unless white-glove is stated.

### Scenario 2 — First property — Pass (95)

| Step | Result |
|------|--------|
| Create first property | Pass — `/pm/properties` |
| Property Command Center | Pass — `/pm/properties/[id]` |
| Mission Control updates | Pass — next → Invite your team |

**MA:** `GET /api/admin/launch/j1`

### Scenario 3 — Invite team — Conditional (80)

| Step | Result |
|------|--------|
| Invite team | Pass — `/settings/team` |
| Accept invitation | Pass — `/accept-invitation/[token]` |
| Correct workspace | Pass — `defaultHomeForRole` |

**MA:** `GET /api/admin/launch/j2`  
**Friction:** Without `RESEND_API_KEY`, email `skipped`; accept link still available in-app.

### Scenario 4 — First resident — Pass (95)

| Step | Result |
|------|--------|
| Create resident | Pass |
| Assign property | Pass (wizard) |
| Assign unit | Pass (wizard) |

**MA:** `GET /api/admin/launch/j3`

### Scenario 5 — First lease / portal — Fail (45)

| Step | Result |
|------|--------|
| Create lease | Pass |
| SignWell | Conditional — env required; offline honesty Pass |
| Resident activation | Pass — `status=active` |
| Portal activation | **Fail for login** — `portal_status=active` only; no `tenant` membership / auth link |

**MA:** `GET /api/admin/launch/j4` validates status flags, **not** live portal login.  
**Evidence:** `activateSignedLease` updates `pm_residents.portal_status`; `portal/tenant/layout.tsx` requires role `tenant`.

### Scenario 6 — Collect rent — Conditional (70)

| Step | Result |
|------|--------|
| Collect rent (staff) | Pass — FO desk / manual payment |
| Resident payment | Conditional — Stripe checkout + portal billing require tenant access |
| Receipt | Pass — `financial_receipts` |
| Ledger | Pass — operational `financial_ledger_entries` |
| Property update | Pass — snapshots / events |

**MA:** `GET /api/admin/launch/j5`

### Scenario 7 — Maintenance lifecycle — Conditional (65)

| Step | Result |
|------|--------|
| Resident request | Conditional — `/portal/tenant/maintenance` needs linked user + tenant role |
| Manager triage/assign | Pass — `/pm/maintenance` |
| Technician/Vendor | Conditional — tech via MCC; vendor portal needs `vendor` role + `user_id` |
| Completion | Pass |
| Resident confirmation | Conditional — needs resident user link |

**MA:** `GET /api/admin/launch/j6`

### Scenario 8 — Owner portfolio — Pass (90)

| Step | Result |
|------|--------|
| Owner login | Pass — `/portal/owner` |
| Portfolio review | Pass |
| Property drill-down | Pass |

**MA:** `GET /api/admin/launch/j8`  
**Friction:** Stale “Document Vault” honesty copy on drill-down.

### Scenario 9 — Documents — Conditional (80)

| Step | Result |
|------|--------|
| Upload | Pass |
| Retrieve | Pass |
| SignWell | Conditional — sync when configured |
| Search | Pass — library filter |
| Permissions | Conditional — capability-gated APIs; RLS org-member-wide read |

**MA:** `GET /api/admin/launch/documents` (structural checks soft).

### Scenario 10 — Communications — Conditional (80)

| Step | Result |
|------|--------|
| Resident / Vendor / Owner send | Pass (staff compose) |
| Notifications | Pass — unified inbox + shell center |
| History | Pass |

**MA:** `GET /api/admin/launch/communications`  
**Friction:** Email depends on Resend; history is staff-sent notices, not full two-way threads.

---

## Master Admin evidence coverage

| Surface | Present |
|---------|---------|
| `/admin/launch-readiness` | J1–J8 + Documents + Communications |
| Journey APIs | `/api/admin/launch/j1` … `j8` |
| Remediation APIs | `/api/admin/launch/documents`, `/communications` |
| J0 panel API | **Missing** — script + subscription console only |
| Live portal-login proof | **Not in evidence** for tenant/vendor |

Mission Control can drive Scenarios 1–8 next actions. Documents/Communications are Quick Actions after remediation.

---

## Integration matrix

| Integration | Required for live path | Honesty / fallback | Customer #1 |
|-------------|------------------------|--------------------|-------------|
| Supabase | All | None | **Required** |
| Resend | Invite email | In-app accept link | Required if email invites claimed |
| SignWell | E-sign | Record signed offline | Required if e-sign claimed |
| Stripe | Resident Pay Now | Manual FO payment | Required if online pay claimed |

---

## Related deliverables

1. [Remaining production defects](./remaining-production-defects.md)  
2. [Launch blocker list](./launch-blockers.md)  
3. [Production readiness score](./production-readiness-score.md)  
4. This document — **GO / NO-GO**

---

## STOP

No new Property Manager feature work is authorized.  
No Facility Operations. No CORE-004. No FIN-OPS expansion.

**Next authorized work (only):** production deployment preparation **after** P0 blockers are cleared under a separate explicit authorization (surgical portal-access bugfix), then Customer #1 onboarding.
