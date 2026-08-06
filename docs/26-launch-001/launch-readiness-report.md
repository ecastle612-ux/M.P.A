# LAUNCH-001 — Official Launch Readiness Report

**Status:** Draft  
**Date:** 2026-08-06  
**Program:** [LAUNCH-001](./index.md)  
**Lens:** What prevents onboarding and retaining Customer #1?

---

## 1. Executive summary

M.P.A. has crossed a maturity threshold: continuing to build modules without a commercial launch program increases risk more than it increases value.

| Finding | Detail |
|---------|--------|
| Product candidate | `release/rc1` — broad operational surface; RC1 **READY FOR LIMITED BETA** |
| Commercial launch | **Not authorized** |
| Dominant remaining risk | Production cutover, provider live certs, legal/support surfaces, ship-tree coherence, claim control — **not** missing Property/Maintenance/Leasing greenfield |
| CORE-004 | Long-term roadmap retained; **new capability work frozen** under LAUNCH-001 |
| Facility | First-class architecture (ADR-015); **expansion post-launch** (ADR-016 / this program) |

**Recommendation:** Authorize LAUNCH-001. Do not begin CORE-004 Phase 6. Clear 🔴 blockers only until Customer #1 GO.

---

## 2. Customer #1 success loop

Customer #1 must complete:

| Step | Required outcome |
|------|------------------|
| Create organization | Org + admin credentials live |
| Configure company | Settings, billing active, recovery contacts |
| Add properties / units | Portfolio operable |
| Invite staff | Roles join and work |
| Lease units | Lease + SignWell (or documented workaround) |
| Collect rent | Live Stripe path → ledger → resident/PM UI |
| Process maintenance | WO lifecycle usable daily |
| Manage vendors | Assign + complete + pay/invoice baseline |
| Communicate with residents | Threads / announcements / email |
| Sign documents | Production e-sign provider |
| Operate every day | Command Center + Ops Inbox coherent; support channel exists |

---

## 3. Classification of remaining work

### A — LAUNCH BLOCKER (required before Customer #1)

| ID | Item | Why blocker | Notes |
|----|------|-------------|-------|
| LB-01 | **Ship-tree / release baseline coherence** | Customer must run one known production tree | Unify `main` ↔ `release/rc1`; stop docs/code drift |
| LB-02 | **Stripe SaaS production operator cert** | Cannot bill Customer #1 | Checkout create PASS on rc1; **card runbook / activation ledger incomplete** |
| LB-03 | **Platform Billing live** | SaaS subscription must activate org entitlements | BILL-001 rails exist; live buyer path unproven |
| LB-04 | **Stripe Rent production cert** | Cannot sell rent collection truthfully | Code/adapters on rc1; live/supervised cert + webhooks |
| LB-05 | **SignWell production enable** | Lease signing marketed; prod still `noop` on rc1 cert | Set `SIGNATURE_PROVIDER=signwell` + keys + webhook cert |
| LB-06 | **Communications transactional email** | Invites, rent, WO status need mail | Resend present; template coverage + prod send proof |
| LB-07 | **Notification Center (in-app) production path** | Daily ops attention | Shell + inbox exist; verify non-placeholder for launch cohort |
| LB-08 | **Document Operations minimum** | One home for lease/WO docs + SignWell | Consolidate; no second e-sign |
| LB-09 | **Customer Onboarding / Guided Setup** | First hour must work | `/setup` + SetupGate on rc1 — certify end-to-end for paid buyer |
| LB-10 | **Role invitations production path** | Staff cannot operate solo | Invite lifecycle exists — certify resend/revoke/accept on prod |
| LB-11 | **Privacy Policy** | Legal requirement | **Missing dedicated pages** on audited trees |
| LB-12 | **Terms of Service** | Legal requirement | **Missing dedicated pages** |
| LB-13 | **Production Monitoring** | Blind prod unacceptable | Uptime alerts |
| LB-14 | **Logging** | Support + incidents | Structured logs beyond console placeholder |
| LB-15 | **Error Reporting** | Sentry (or equiv.) not wired | Launch Blocker |
| LB-16 | **Backups** | Paying customer data durability | Supabase backup policy verified + restore drill |
| LB-17 | **Support Channel** | Human reachability | Alias + escalation runbook |
| LB-18 | **Security launch bar** | RLS/auth/secrets/webhooks | Prod checklist + no DEV bootstrap password |
| LB-19 | **Performance launch bar** | Critical PM paths | Meet **15** budgets on Command Center, WO, rent |
| LB-20 | **Accessibility launch bar** | Critical paths | WCAG bar on auth, setup, pay, WO |
| LB-21 | **Known Limitations + claim control** | Overclaim = refund/churn risk | Signed sales/support script |
| LB-22 | **Customer #1 dry-run certification** | Proof of loop | Execute [checklist](./customer-one-checklist.md) on production |

### B — SHOULD SHIP IF TIME PERMITS

| ID | Item | Value | Constraint |
|----|------|-------|------------|
| ST-01 | Owner Portal polish | Retention | Do not expand scope into exec analytics |
| ST-02 | Vendor invoice UX polish | Field completion | Stay on token workflow; no new portal product |
| ST-03 | Ops Inbox / Command Center density | Daily ops | No new dashboards |
| ST-04 | Empty/loading state consistency | Trust | Extend existing empty-state system |
| ST-05 | Demo / seed data pack | Sales + onboarding | Isolated from prod tenant |
| ST-06 | Help snippets in empty states | Support deflection | Not full Help Center |
| ST-07 | ACH depth cert | Payments breadth | Card path is enough for #1 if documented |

### C — POST-LAUNCH (must not delay Customer #1)

| ID | Item |
|----|------|
| PL-01 | Facility Operations expansion (beyond certified FAC surface) |
| PL-02 | Inventory / Assets / Parts depth programs |
| PL-03 | Preventive Maintenance program maturity |
| PL-04 | Capital Projects |
| PL-05 | Deep Analytics / Executive Ops |
| PL-06 | Advanced / predictive AI · Assistant depth |
| PL-07 | Offline mode · advanced PWA |
| PL-08 | Native mobile |
| PL-09 | Full Help Center CMS |
| PL-10 | CORE-004 Phase 6+ new capabilities |
| PL-11 | Push real-device commercial cert (abandoned track — do not resume without new decision) |
| PL-12 | SMS-first vendor journey |
| PL-13 | Full trust accounting / GL |

---

## 4. Implemented module review (product candidate = rc1)

| Area | Status on rc1 | Launch class |
|------|---------------|--------------|
| Identity / Auth / Org | Strong | Certify on prod (LB-09/10) |
| Master Admin | Present | Support readiness (LB-17/18) |
| Property / Units | Present | Loop step — verify |
| Leasing / Applicants / Residents | Present | Needs SignWell live (LB-05) |
| Maintenance | Present | Daily ops — verify |
| Vendors (token) | Present | Baseline OK; polish = B |
| Financials / Rent | Present | Live cert (LB-04) |
| SaaS Billing | Present | Live cert (LB-02/03) |
| Communications | Present | Email/notif proof (LB-06/07) |
| Documents / SignWell | Adapter present | Prod enable (LB-05/08) |
| Facility | Large surface FAC-002 | **Do not expand** (PL-01…); freeze new Facility capability |
| Owner / Tenant portals | Present | Journey cert |
| Acquisition / Pricing | Present | Tied to LB-02/03 |
| Setup wizard | Present | LB-09 |
| Privacy / Terms pages | **Gap** | LB-11/12 |
| Sentry / APM | **Gap** | LB-15 |
| Observability logger | Placeholder transport | LB-14 |

---

## 5. Features frozen until after launch

Until LAUNCH-001 GO:

- CORE-004 Phase 6 and any new CORE-004 capability slices  
- Facility expansion (Inventory/PM/CapEx/Safety programs beyond what’s already on ship tree)  
- Deep analytics, advanced AI, offline, native mobile, Help Center CMS  
- Resuming abandoned PUSH-001 real-device cert without a new Approve  
- Any “nice” module that does not clear a 🔴 board item  

**Allowed work:** blocker removal, production certs, legal pages, monitoring, runbooks, journey fixes that unblock the Customer #1 loop, critical bugfixes.

---

## 6. Recommended implementation order (blockers only)

1. **LB-01** Ship-tree coherence (one production baseline)  
2. **LB-11 / LB-12** Privacy + Terms  
3. **LB-13 / LB-14 / LB-15 / LB-16** Monitoring · Logging · Error reporting · Backups  
4. **LB-02 / LB-03** Stripe SaaS operator cert + billing activation proof  
5. **LB-04** Stripe Rent live/supervised cert  
6. **LB-05 / LB-08** SignWell prod + document home  
7. **LB-06 / LB-07** Email templates + Notification Center non-placeholder path  
8. **LB-09 / LB-10** Guided setup + invites prod dry-run  
9. **LB-17 / LB-18 / LB-19 / LB-20** Support · Security · Perf · A11y bars  
10. **LB-21** Known Limitations signed  
11. **LB-22** Full Customer #1 checklist on production  
12. Time-permitting **B** items only after 🔴 trend is green  

---

## 7. Deliverable cross-links

- Board: [launch-readiness-board.md](./launch-readiness-board.md)  
- Checklist: [customer-one-checklist.md](./customer-one-checklist.md)  
- GO/NO-GO: [go-no-go.md](./go-no-go.md)  
- Journeys: [role-journey-certification.md](./role-journey-certification.md)  
- UX: [visual-experience-audit.md](./visual-experience-audit.md)  
- IA: [product-organization-audit.md](./product-organization-audit.md)
