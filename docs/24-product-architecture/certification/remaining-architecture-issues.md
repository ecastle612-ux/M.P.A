# Remaining Architecture Issues

**Parent:** [Commercial Experience Certification](./index.md)

Focus: issues that harm Customer #1 / operator experience **now**.  
Ignore future Facility/Financial feature depth except where Planned labeling confuses purchase clarity.

---

## P0 — Launch blockers (must fix before any new business capability)

| ID | Issue | Impact |
|----|-------|--------|
| P0-1 | **No route-level entitlement gating** on `/pm/*`, `/facility/*` | Customers can open non-purchased product pages via URL |
| P0-2 | **Self-serve SKU assignment** in Guided Setup/Settings | “What you purchased” becomes a editable dropdown — destroys commercial trust |
| P0-3 | **Header Search is a dead control** | Fails basic product polish; customers think search is broken |
| P0-4 | **Guided Setup checklist auto-completes** without Billing/home visits | Customers can skip understanding inclusions/upgrades |
| P0-5 | **Master Admin shown to all users** in profile menu | False door; support confusion |

---

## P1 — Cohesion / OS feeling

| ID | Issue | Impact |
|----|-------|--------|
| P1-1 | Dual homes: `/portal/*` and commercial `/launcher`/`/pm` | Feels like two apps |
| P1-2 | Module pages are blueprint/alignment docs | Not a work OS; undermines “what I can do” |
| P1-3 | Duplicate org creation (Setup + Settings foundation) | Unnecessary clicks / drift |
| P1-4 | No-SKU Launcher nav inconsistency | Land on Launcher but sidebar may omit it |
| P1-5 | Complete Platform: two unlabeled “Mission Control” strings in ⌘K | Wrong product home risk |
| P1-6 | Billing shows full catalog names to single-product orgs | Can look like missing features rather than other SKU |

---

## P1 — Master Admin operational gaps

| ID | Issue | Impact |
|----|-------|--------|
| P1-7 | Subscriptions page cannot assign/inspect org SKUs | Operators guess / use DB |
| P1-8 | No org 360 / organizations directory UI | Cannot support Customer #1 from Admin |
| P1-9 | No subscription/role test harness (only static matrix) | Cannot certify SKUs in-product |
| P1-10 | Launch Readiness page does not execute checks | Theater, not certification tooling |
| P1-11 | Impersonation Planned with no interim “view as SKU” | Cannot safely preview customer chrome |

---

## P2 — Acceptable for alignment phase (track, don’t block FO forever)

| ID | Issue | Notes |
|----|-------|-------|
| P2-1 | Most modules Planned / non-functional | Expected until feature phases; must stay labeled |
| P2-2 | Quick Actions limited to navigation | OK until workflows exist |
| P2-3 | Capital Projects visible without entitlement | OK if copy says Future; tighten wording |
| P2-4 | No real empty-state “create first record” | Block only when that module’s feature work starts |

---

## Recommended hardening sequence (docs-approved work only when authorized)

1. Route + API entitlement guards (fail closed)  
2. Lock SKU changes to Master Admin (customer sees read-only plan)  
3. Remove/hide dead Search or wire entitlement search  
4. Guided Setup: forced Billing review + CTA to correct Mission Control  
5. Hide Master Admin entry unless operator  
6. Collapse portal vs commercial entry for managers  
7. Master Admin: org list + subscription assign + launch-readiness checklist runner  

**Do not** start Financial Operations until P0 items are certified Pass.
