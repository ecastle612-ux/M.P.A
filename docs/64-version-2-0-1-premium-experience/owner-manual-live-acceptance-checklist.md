# Version 2.0.1 — Owner Manual LIVE Acceptance Checklist

**Status:** Ready for Owner sign-in  
**Site:** https://www.my-property-assistant.com  
**Production SHA:** `f72ea4aac6db18164c0bc685506f397d3775c196`  
**Vercel:** `dpl_H1i7NSFgBXKsyyMos7YBsUnTURbg`  
**GitHub deploy:** `5825388803`

## Why this checklist exists

Agent validation is **PASS** for deploy / public / gates.  
Authenticated areas remain **BLOCKED** only because the agent has no Owner session.

**You** complete the rows below while signed in.  
Mark each section **PASS** or **FAIL**. Do not start v2.0.2 from this checklist.

---

## Hard rules while testing

- Do **not** treat intentional empty / roadmap states as failures.
- Resident: Packages Coming Soon was **removed** in v2.0.1 — home should **not** tease unfinished packages.
- FO: Planned modules were **removed from primary nav** — Mission Control only in the sidebar.
- View As lives at `/admin/support/view-as` (not `/admin/testing/impersonation`).
- Search in the customer app shell is a single **Search workspace… / ⌘K** control.
- Email: never show success when mail cannot be delivered; System Health should be honest.

---

## 1. Owner login

1. Open https://www.my-property-assistant.com/login  
2. Sign in with your Owner / platform operator account.  
3. Confirm you land in a workspace or Owner Ops (not stuck on login).

| Check | PASS / FAIL |
|-------|-------------|
| Sign-in succeeds | ☐ PASS ☐ FAIL |
| No unexpected error toast | ☐ PASS ☐ FAIL |

**Notes:** _________________________________

---

## 2. Owner dashboard / home

After login, open your default home (often `/dashboard` → product home, or `/launcher`).

| Check | PASS / FAIL |
|-------|-------------|
| Page loads | ☐ PASS ☐ FAIL |
| Navigation visible and clickable | ☐ PASS ☐ FAIL |
| Loading / skeleton clears (not stuck forever) | ☐ PASS ☐ FAIL |
| No broken cards / blank critical panels | ☐ PASS ☐ FAIL |
| No obvious runtime / console-blocking errors | ☐ PASS ☐ FAIL |
| Primary actions work | ☐ PASS ☐ FAIL |

**Section result:** ☐ PASS ☐ FAIL  
**Notes:** _________________________________

---

## 3. Admin / Master Command Center (Owner Ops)

Open: https://www.my-property-assistant.com/admin

| Check | PASS / FAIL |
|-------|-------------|
| Command Center loads | ☐ PASS ☐ FAIL |
| Owner Ops sidebar works (Command Center, Support, System Health, Orgs, Customers, View As, Commercial) | ☐ PASS ☐ FAIL |
| Platform health / customer search / live activity render | ☐ PASS ☐ FAIL |
| No unexpected redirect to login while still signed in | ☐ PASS ☐ FAIL |
| Operator actions reachable without DB access | ☐ PASS ☐ FAIL |

Also open View As: https://www.my-property-assistant.com/admin/support/view-as

| Check | PASS / FAIL |
|-------|-------------|
| View As console loads at `/admin/support/view-as` | ☐ PASS ☐ FAIL |
| Can start a read-only session (optional deep check) | ☐ PASS ☐ FAIL |
| Banner appears while View As is active (if started) | ☐ PASS ☐ FAIL |

**Section result:** ☐ PASS ☐ FAIL  
**Notes:** _________________________________

---

## 4. Property Manager experience

Prefer a PM org, or View As → Property Manager.

Suggested URLs:

- https://www.my-property-assistant.com/pm/mission-control  
- https://www.my-property-assistant.com/pm/properties  
- https://www.my-property-assistant.com/pm/leasing  
- https://www.my-property-assistant.com/pm/maintenance  

| Check | PASS / FAIL |
|-------|-------------|
| PM Mission Control loads | ☐ PASS ☐ FAIL |
| PM sidebar navigation works | ☐ PASS ☐ FAIL |
| Property / leasing / maintenance screens load | ☐ PASS ☐ FAIL |
| No unexpected login redirects while authenticated | ☐ PASS ☐ FAIL |
| Search workspace (⌘K) opens and navigates | ☐ PASS ☐ FAIL |

**Section result:** ☐ PASS ☐ FAIL  
**Notes:** _________________________________

---

## 5. Facility Operations (FO)

Prefer Complete Platform / FO org, or View As → Facility role.

Suggested URLs:

- https://www.my-property-assistant.com/facility/mission-control  

| Check | PASS / FAIL |
|-------|-------------|
| Facility Mission Control loads | ☐ PASS ☐ FAIL |
| Sidebar FO nav shows **Mission Control only** (no Planned Assets/Inventory/etc.) | ☐ PASS ☐ FAIL |
| Capability map does **not** link unfinished modules as live destinations | ☐ PASS ☐ FAIL |
| No unexpected login redirects | ☐ PASS ☐ FAIL |
| No broken FO chrome | ☐ PASS ☐ FAIL |

**Section result:** ☐ PASS ☐ FAIL  
**Notes:** _________________________________

---

## 6. Resident

Prefer resident user, or View As → Resident.

Open: https://www.my-property-assistant.com/portal/tenant

| Check | PASS / FAIL |
|-------|-------------|
| Resident home loads | ☐ PASS ☐ FAIL |
| Bottom nav works on mobile width | ☐ PASS ☐ FAIL |
| **No** Packages “Coming soon” card | ☐ PASS ☐ FAIL |
| Community is an honest empty state (not “Soon” theater) | ☐ PASS ☐ FAIL |
| Billing / Maintenance / Documents routes load | ☐ PASS ☐ FAIL |

Intentional empty = **PASS**. Broken placeholder / console error = **FAIL**.

**Section result:** ☐ PASS ☐ FAIL  
**Notes:** _________________________________

---

## 7. Technician

Prefer vendor/technician user, or View As → Technician / Vendor.

Open: https://www.my-property-assistant.com/portal/vendor

| Check | PASS / FAIL |
|-------|-------------|
| Assigned work home loads | ☐ PASS ☐ FAIL |
| Mobile bottom nav present (Work / Account) | ☐ PASS ☐ FAIL |
| Job cards / Start·Update·Complete chrome look usable | ☐ PASS ☐ FAIL |
| No unexpected redirects | ☐ PASS ☐ FAIL |
| No obvious runtime errors | ☐ PASS ☐ FAIL |

**Section result:** ☐ PASS ☐ FAIL  
**Notes:** _________________________________

---

## 8. Search

In an authenticated PM / Complete workspace:

1. Click **Search workspace…** (or press ⌘K / Ctrl+K).  
2. Type a property or resident fragment.  
3. Open a result.  
4. Clear query / nonsense query for empty state.

| Check | PASS / FAIL |
|-------|-------------|
| Search opens | ☐ PASS ☐ FAIL |
| Accepts input | ☐ PASS ☐ FAIL |
| Results appear when data exists | ☐ PASS ☐ FAIL |
| Result navigation works | ☐ PASS ☐ FAIL |
| Empty / no-result state is sane | ☐ PASS ☐ FAIL |
| Only one primary search entry (not dual competing search UIs) | ☐ PASS ☐ FAIL |

**Section result:** ☐ PASS ☐ FAIL  
**Notes:** _________________________________

---

## 9. Email health

Open: https://www.my-property-assistant.com/admin/system  
Also glance Command Center email card: https://www.my-property-assistant.com/admin

| Check | PASS / FAIL |
|-------|-------------|
| System Health loads | ☐ PASS ☐ FAIL |
| Email status is visible (ok **or** honest down/unavailable) | ☐ PASS ☐ FAIL |
| No misleading “email sent” success when provider is unavailable | ☐ PASS ☐ FAIL |
| If you regenerate a claim link with email down: notice is honest | ☐ PASS ☐ FAIL |

**Section result:** ☐ PASS ☐ FAIL  
**Notes:** _________________________________

---

## 10. Skeleton / loading states

Navigate between Admin ↔ PM ↔ FO ↔ Shared Documents / Reports.

| Check | PASS / FAIL |
|-------|-------------|
| Loading / skeleton appears on slower transitions when expected | ☐ PASS ☐ FAIL |
| Skeleton does not remain stuck | ☐ PASS ☐ FAIL |
| Final content replaces loading state | ☐ PASS ☐ FAIL |
| No layout collapse during load | ☐ PASS ☐ FAIL |

**Section result:** ☐ PASS ☐ FAIL  
**Notes:** _________________________________

---

## Bonus (v2.0.1-specific — recommended)

| Check | URL / action | PASS / FAIL |
|-------|----------------|-------------|
| Documents load | `/shared/documents` | ☐ PASS ☐ FAIL |
| Reporting loads | `/shared/reports` | ☐ PASS ☐ FAIL |
| Leasing loads; screening labeled manual (not “Integration Planned”) | `/pm/leasing` | ☐ PASS ☐ FAIL |
| Marketing still public | `/` `/pricing` | ☐ PASS ☐ FAIL |

---

## Final Owner verdict

| Section | Result |
|---------|--------|
| 1 Login | ☐ PASS ☐ FAIL |
| 2 Dashboard / home | ☐ PASS ☐ FAIL |
| 3 Admin / Command Center (+ View As) | ☐ PASS ☐ FAIL |
| 4 Property Manager | ☐ PASS ☐ FAIL |
| 5 Facility Operations | ☐ PASS ☐ FAIL |
| 6 Resident | ☐ PASS ☐ FAIL |
| 7 Technician | ☐ PASS ☐ FAIL |
| 8 Search | ☐ PASS ☐ FAIL |
| 9 Email health | ☐ PASS ☐ FAIL |
| 10 Skeletons | ☐ PASS ☐ FAIL |

**If every required section is PASS**, declare:

### `v2.0.1 OWNER LIVE ACCEPTANCE READY`

**If any section is FAIL**, stop and report:

- Section number  
- Exact URL  
- What you expected  
- What you saw  

Do **not** begin Version 2.0.2 until Owner acceptance is explicit.

---

## Agent stop line

Checklist prepared only. No code changes. No v2.0.2. No Stripe / pricing / RentRedi / Capital Projects work.
