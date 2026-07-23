# 13 — Native UX Acceptance Matrix

**Package:** PMX-004  
**Amendment:** 01  
**Status:** Binding for COMPLETE · Verification **PENDING** (fill after Phases 3–5 + 10/11)  
**Rule:** Every major screen must receive an overall **PASS** before PMX-004 can be marked COMPLETE. Any **FAIL** blocks closeout until remediated or Product accepts a documented waiver (waivers are exceptional and listed in Phase 11 closeout).

---

## 1. Purpose

Provide a screen-by-screen PASS/FAIL checklist so native-feel work is not claimed from shell polish alone. Auditors exercise each route in **installed standalone** mode on mobile (Android Chrome and/or iPhone Safari A2HS) unless the screen is desktop-primary (still smoke on mobile viewport).

---

## 2. Checklist categories (apply to every screen)

Mark each category **PASS**, **FAIL**, or **N/A**.  
**Overall** = PASS only if every non-N/A category is PASS.

### Navigation

| ID | Criterion |
| --- | --- |
| N1 | No browser flash / white flash on enter |
| N2 | No full document reload for in-app navigation (soft nav) |
| N3 | Native-feeling transition (subtle; honors `prefers-reduced-motion`) |
| N4 | Correct back navigation (browser/PWA back + in-app back affordance where present) |
| N5 | Standalone compliant (no unexpected exit to browser chrome) |

### Touch experience

| ID | Criterion |
| --- | --- |
| T1 | Primary interactive controls ≥ 44×44 CSS px |
| T2 | Comfortable spacing (no cramped hit areas) |
| T3 | No accidental taps on adjacent controls |
| T4 | Swipe gestures only where appropriate and never the sole path to an action |

### Loading experience

| ID | Criterion |
| --- | --- |
| L1 | Skeleton / structured loading — not blank white |
| L2 | No full-shell spinner replacing chrome unnecessarily |
| L3 | Optimistic updates where appropriate (or clear pending state) |
| L4 | Smooth state transitions (success/error without jarring jumps) |

### Forms (N/A if screen has no form)

| ID | Criterion |
| --- | --- |
| F1 | Keyboard never permanently hides focused inputs / primary actions |
| F2 | Correct `inputmode` / keyboard type |
| F3 | Sensible autofocus (not hostile on every visit) |
| F4 | Focused field scrolls into view |
| F5 | Validation without destructive layout shift |

### Performance

| ID | Criterion |
| --- | --- |
| P1 | Animations target 60 FPS feel (no visible jank on mid-tier device) |
| P2 | No unnecessary heavy re-renders on typing / scroll |
| P3 | Scroll remains usable under load |

### Accessibility

| ID | Criterion |
| --- | --- |
| A1 | Adequate contrast for text / icons |
| A2 | Screen reader labels for primary controls |
| A3 | Visible focus indicators |
| A4 | Large tap targets (aligns with T1) |

### Standalone experience

| ID | Criterion |
| --- | --- |
| S1 | Never exits installed app unexpectedly |
| S2 | No browser UI chrome inside the experience |
| S3 | Deep links into this screen work when applicable |
| S4 | Documents / external actions follow Phase 4 dispositions |

---

## 3. How to score a screen

1. Open installed PWA (standalone).  
2. Navigate to the route.  
3. Exercise primary happy path (view + edit/create if the screen supports it).  
4. Mark each category.  
5. Set **Overall** = PASS | FAIL.  
6. Record device + date in Evidence column (path under `artifacts/ux-matrix/`).

**List / New / Detail / Edit** patterns for the same entity are **separate rows** (each is a major screen).

---

## 4. Screen matrix

**Legend:** Overall status starts as `PENDING`. Update to `PASS` / `FAIL` during Phase 5 audit and re-verify in Phase 11.

| # | Route | Screen | Nav | Touch | Load | Forms | Perf | A11y | Standalone | Overall | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `/login` | Login | | | | | | | | PENDING | |
| 2 | `/forgot-password` | Forgot password | | | | | | | | PENDING | |
| 3 | `/reset-password` | Reset password | | | | | | | | PENDING | |
| 4 | `/accept-invitation/[token]` | Accept invitation | | | | | | | | PENDING | |
| 5 | `/dashboard` | Operations Center | | | | | | | | PENDING | |
| 6 | `/setup` | Organization setup | | | | | | | | PENDING | |
| 7 | `/profile` | Profile | | | | | | | | PENDING | |
| 8 | `/ai-operations` | AI Operations | | | | | | | | PENDING | |
| 9 | `/properties` | Properties list | | | | N/A | | | | PENDING | |
| 10 | `/properties/new` | New property | | | | | | | | PENDING | |
| 11 | `/properties/[propertyId]` | Property detail | | | | N/A | | | | PENDING | |
| 12 | `/properties/[propertyId]/edit` | Edit property | | | | | | | | PENDING | |
| 13 | `/units` | Units list | | | | N/A | | | | PENDING | |
| 14 | `/units/new` | New unit | | | | | | | | PENDING | |
| 15 | `/units/[unitId]` | Unit detail | | | | N/A | | | | PENDING | |
| 16 | `/units/[unitId]/edit` | Edit unit | | | | | | | | PENDING | |
| 17 | `/applicants` | Applicants list | | | | N/A | | | | PENDING | |
| 18 | `/applicants/new` | New applicant | | | | | | | | PENDING | |
| 19 | `/applicants/[applicantId]` | Applicant detail | | | | N/A | | | | PENDING | |
| 20 | `/applicants/[applicantId]/edit` | Edit applicant | | | | | | | | PENDING | |
| 21 | `/tenants` | Tenants list | | | | N/A | | | | PENDING | |
| 22 | `/tenants/new` | New tenant | | | | | | | | PENDING | |
| 23 | `/tenants/[tenantId]` | Tenant detail | | | | N/A | | | | PENDING | |
| 24 | `/tenants/[tenantId]/edit` | Edit tenant | | | | | | | | PENDING | |
| 25 | `/leases` | Leases list | | | | N/A | | | | PENDING | |
| 26 | `/leases/new` | New lease | | | | | | | | PENDING | |
| 27 | `/leases/[leaseId]` | Lease detail | | | | N/A | | | | PENDING | |
| 28 | `/leases/[leaseId]/edit` | Edit lease | | | | | | | | PENDING | |
| 29 | `/residents/move-in` | Move in | | | | | | | | PENDING | |
| 30 | `/residents/move-out` | Move out | | | | | | | | PENDING | |
| 31 | `/residents/transfer` | Transfer unit | | | | | | | | PENDING | |
| 32 | `/residents/bulk` | Bulk residents | | | | | | | | PENDING | |
| 33 | `/maintenance` | Maintenance list | | | | N/A | | | | PENDING | |
| 34 | `/maintenance/new` | New work order | | | | | | | | PENDING | |
| 35 | `/maintenance/[workOrderId]` | Work order detail | | | | | | | | PENDING | |
| 36 | `/maintenance/[workOrderId]/edit` | Edit work order | | | | | | | | PENDING | |
| 37 | `/vendors` | Vendors list | | | | N/A | | | | PENDING | |
| 38 | `/vendors/new` | New vendor | | | | | | | | PENDING | |
| 39 | `/vendors/[vendorId]` | Vendor detail | | | | N/A | | | | PENDING | |
| 40 | `/vendors/[vendorId]/edit` | Edit vendor | | | | | | | | PENDING | |
| 41 | `/communications` | Announcements list | | | | N/A | | | | PENDING | |
| 42 | `/communications/new` | New announcement | | | | | | | | PENDING | |
| 43 | `/communications/[announcementId]` | Announcement detail | | | | N/A | | | | PENDING | |
| 44 | `/communications/[announcementId]/edit` | Edit announcement | | | | | | | | PENDING | |
| 45 | `/communications/inbox` | Messaging inbox | | | | N/A | | | | PENDING | |
| 46 | `/communications/threads/[threadId]` | Message thread | | | | | | | | PENDING | |
| 47 | `/communications/resident/[tenantId]` | Resident messaging | | | | | | | | PENDING | |
| 48 | `/financials` | Accounting dashboard | | | | N/A | | | | PENDING | |
| 49 | `/financials/transactions` | Transactions | | | | N/A | | | | PENDING | |
| 50 | `/financials/expenses` | Expenses list | | | | N/A | | | | PENDING | |
| 51 | `/financials/expenses/new` | Record expense | | | | | | | | PENDING | |
| 52 | `/financials/charges` | Rent charges list | | | | N/A | | | | PENDING | |
| 53 | `/financials/charges/new` | New charge | | | | | | | | PENDING | |
| 54 | `/financials/charges/[chargeId]` | Charge detail | | | | N/A | | | | PENDING | |
| 55 | `/financials/payments/new` | Record payment | | | | | | | | PENDING | |
| 56 | `/financials/owner-statements` | Owner statements | | | | N/A | | | | PENDING | |
| 57 | `/financials/owner-statements/generate` | Generate statement | | | | | | | | PENDING | |
| 58 | `/financials/owner-statements/[statementId]` | Statement detail | | | | N/A | | | | PENDING | |
| 59 | `/financials/reports` | Reports | | | | N/A | | | | PENDING | |
| 60 | `/migration` | Migration Center | | | | N/A | | | | PENDING | |
| 61 | `/migration/new` | New migration | | | | | | | | PENDING | |
| 62 | `/migration/[jobId]` | Migration job detail | | | | N/A | | | | PENDING | |
| 63 | `/settings` | Settings hub | | | | N/A | | | | PENDING | |
| 64 | `/settings/organization` | Organization settings | | | | | | | | PENDING | |
| 65 | `/settings/team` | Team settings | | | | | | | | PENDING | |
| 66 | `/settings/billing` | Billing settings | | | | | | | | PENDING | |
| 67 | `/settings/appearance` | Appearance settings | | | | | | | | PENDING | |
| 68 | `/settings/integrations` | Integrations settings | | | | | | | | PENDING | |
| 69 | `/settings/documents` | Documents / vault | | | | N/A | | | | PENDING | |
| 70 | `/settings/notifications` | Notification settings | | | | | | | | PENDING | |
| 71 | `/facility/assets/[assetId]` | Facility asset detail | | | | N/A | | | | PENDING | |
| 72 | `/facility/records/[recordId]` | Facility record detail | | | | N/A | | | | PENDING | |
| 73 | `/master-admin` | MA Mission Control | | | | N/A | | | | PENDING | |
| 74 | `/master-admin/impersonation` | Impersonation Center | | | | | | | | PENDING | |
| 75 | `/master-admin/providers` | Providers | | | | N/A | | | | PENDING | |
| 76 | `/master-admin/testing` | Demo & Testing | | | | N/A | | | | PENDING | |
| 77 | `/master-admin/health` | Platform Health | | | | N/A | | | | PENDING | |
| 78 | `/master-admin/flags` | Feature Flags | | | | | | | | PENDING | |
| 79 | `/master-admin/dashboards` | Surface Switcher | | | | N/A | | | | PENDING | |
| 80 | `/master-admin/notifications` | MA Push diagnostics | | | | | | | | PENDING | |
| 81 | `/portal` | Portal hub | | | | N/A | | | | PENDING | |
| 82 | `/portal/certification` | Certification portfolio | | | | N/A | | | | PENDING | |
| 83 | `/portal/manager` | Manager portal bridge | | | | N/A | | | | PENDING | |
| 84 | `/portal/owner` | Owner home | | | | N/A | | | | PENDING | |
| 85 | `/portal/owner/properties` | Owner properties | | | | N/A | | | | PENDING | |
| 86 | `/portal/owner/properties/[propertyId]` | Owner property detail | | | | N/A | | | | PENDING | |
| 87 | `/portal/owner/financials` | Owner financials | | | | N/A | | | | PENDING | |
| 88 | `/portal/owner/documents` | Owner documents | | | | N/A | | | | PENDING | |
| 89 | `/portal/owner/messages` | Owner messages | | | | | | | | PENDING | |
| 90 | `/portal/owner/reports` | Owner reports | | | | N/A | | | | PENDING | |
| 91 | `/portal/owner/settings` | Owner settings | | | | | | | | PENDING | |
| 92 | `/portal/owner/more` | Owner more | | | | N/A | | | | PENDING | |
| 93 | `/portal/tenant` | Tenant home | | | | N/A | | | | PENDING | |
| 94 | `/portal/tenant/messages` | Tenant messages | | | | | | | | PENDING | |
| 95 | `/portal/tenant/payments` | Tenant payments | | | | | | | | PENDING | |
| 96 | `/portal/tenant/maintenance` | Tenant maintenance | | | | N/A | | | | PENDING | |
| 97 | `/portal/tenant/maintenance/new` | Tenant new request | | | | | | | | PENDING | |
| 98 | `/portal/tenant/maintenance/[workOrderId]` | Tenant WO detail | | | | | | | | PENDING | |
| 99 | `/portal/tenant/documents` | Tenant documents | | | | N/A | | | | PENDING | |
| 100 | `/portal/tenant/more` | Tenant more | | | | N/A | | | | PENDING | |
| 101 | `/portal/tenant/announcements` | Tenant announcements | | | | N/A | | | | PENDING | |
| 102 | `/portal/tenant/announcements/[announcementId]` | Tenant announcement detail | | | | N/A | | | | PENDING | |
| 103 | `/portal/tenant/notifications` | Tenant notifications | | | | N/A | | | | PENDING | |
| 104 | `/portal/tenant/preferences` | Tenant preferences | | | | | | | | PENDING | |
| 105 | `/portal/tenant/community` | Tenant community | | | | N/A | | | | PENDING | |
| 106 | `/portal/vendor` | Vendor work queue | | | | N/A | | | | PENDING | |
| 107 | `/v/[token]` | Vendor job (token) | | | | | | | | PENDING | |
| 108 | `/join/[token]` | Join / enroll | | | | | | | | PENDING | |
| 109 | `/signing/progress/[token]` | Signing progress | | | | N/A | | | | PENDING | |
| 110 | `/screening/consent/[token]` | Screening consent | | | | | | | | PENDING | |
| 111 | `/unauthorized` | Unauthorized | | | | N/A | | | | PENDING | |

**Screen count:** 111 major patterns. Dev-only `/dev/*` excluded. Root `/` redirect excluded.

---

## 5. Roll-up gates

| Gate | Requirement |
| --- | --- |
| Matrix complete | Every row Overall = PASS (or listed Accepted waiver) |
| PM critical path | Rows 5, 9–12, 33–36, 45–46, 59, 63, 69–70 must PASS with evidence on Android + iPhone |
| Portal critical path | Owner 84–91, Tenant 93–99, Vendor 106–107 must PASS on at least one mobile device each |
| Auth | Rows 1–4 PASS |
| Payments / sign | Rows 95, 66, 109 PASS under standalone rules (Accepted-with-return allowed only where Phase 4 disposition says so) |

---

## 6. Relationship to phases

| Phase | Matrix role |
| --- | --- |
| 3–5 | Primary remediation + first PASS pass |
| 4 | Standalone column driven by exit inventory |
| 8 | Perf column evidence |
| 10 | Regression re-spot-check of FAIL remediations |
| 11 | Full re-verification on real device matrix; final sign-off |

---

## 7. Closeout statement (fill at end)

| Field | Value |
| --- | --- |
| Date | |
| PASS count | / 111 |
| FAIL count | |
| Accepted waivers | |
| Native UX Matrix verdict | ☐ PASS · ☐ FAIL |
