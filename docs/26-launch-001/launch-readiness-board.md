# LAUNCH-001 — Official Launch Readiness Board

**Status:** Living board  
**Updated:** 2026-08-06  
**Rule:** Every future task under LAUNCH-001 must appear here.  
**Columns:** 🔴 Launch Blockers · 🟡 In Progress · 🟢 Complete · 🔵 Post Launch

---

## How to use

1. New work → classify A/B/C in the [Report](./launch-readiness-report.md) → place on this board.  
2. Start work → move 🔴 → 🟡 with owner + evidence link.  
3. Done → 🟡 → 🟢 with cert/date.  
4. Anything not required for Customer #1 → 🔵 (do not steal capacity from 🔴).  
5. **No new platform capability** unless it clears a 🔴 item.

---

## 🔴 Launch Blockers

| ID | Item | Owner | Evidence needed | Depends |
|----|------|-------|-----------------|---------|
| LB-01 | Ship-tree / production baseline coherence (`main` ↔ `release/rc1`) | Eng Lead | Single deploy SHA + migration attestation | — |
| LB-02 | Stripe SaaS operator runbook complete (card → webhook → org active) | Ops + Eng | Signed runbook steps | LB-01 |
| LB-03 | Platform Billing live activation proof | Ops + Eng | Paid/trial org entitlements on prod | LB-02 |
| LB-04 | Stripe Rent production certification | Ops + Eng | Charge → ledger → UI | LB-01 |
| LB-05 | SignWell production enable + cert | Ops + Eng | `SIGNATURE_PROVIDER=signwell`; signed lease on prod | LB-01 |
| LB-06 | Transactional email templates (invite, rent, WO, billing) | Eng | Resend prod sends logged | LB-01 |
| LB-07 | Notification Center / Ops Inbox non-placeholder path | Eng | Real attention items for PM day | LB-01 |
| LB-08 | Document Operations minimum (SignWell + vault home) | Eng | One doc home; no second e-sign | LB-05 |
| LB-09 | Guided Setup / onboarding for paid buyer | Eng | `/setup` → Active → Dashboard | LB-03 |
| LB-10 | Role invitations prod path | Eng | Invite → accept → permissions | LB-09 |
| LB-11 | Privacy Policy page live | Product/Legal | Public URL | — |
| LB-12 | Terms of Service page live | Product/Legal | Public URL | — |
| LB-13 | Production monitoring / uptime alerts | Ops | Alert fires on synthetic check | LB-01 |
| LB-14 | Structured logging (non-placeholder transport) | Eng | Queryable logs in prod | LB-01 |
| LB-15 | Error reporting (Sentry or equiv.) | Eng | Error captured end-to-end | LB-01 |
| LB-16 | Backups + restore drill | Ops | Restore proof | LB-01 |
| LB-17 | Support channel + escalation runbook | Support | Alias + SLA note | — |
| LB-18 | Security launch bar (secrets, RLS smoke, no dev bootstrap) | Sec/Eng | Checklist signed | LB-01 |
| LB-19 | Performance launch bar (critical paths) | Eng | Budgets met | LB-01 |
| LB-20 | Accessibility launch bar (auth/setup/pay/WO) | Eng | Critical-path pass | LB-01 |
| LB-21 | Known Limitations + sales claim control | Product | Signed script | — |
| LB-22 | Customer #1 dry-run certification | All | [Checklist](./customer-one-checklist.md) PASS | LB-02…21 |

---

## 🟡 In Progress

| ID | Item | Owner | Started | Notes |
|----|------|-------|---------|-------|
| — | _None recorded in this Draft board_ | | | Move items here when work starts |

---

## 🟢 Complete

> Pre-LAUNCH-001 completions on `release/rc1` (do not re-litigate; re-verify on unified prod baseline).

| ID | Item | Evidence (rc1 lineage) |
|----|------|------------------------|
| DONE-01 | Identity / org / invites foundation | Phase 3 + AUTH on rc1 |
| DONE-02 | Property / unit lifecycle | Property ops on rc1 |
| DONE-03 | Maintenance operations | Maintenance module on rc1 |
| DONE-04 | Leasing / resident lifecycle (app-level) | Leases/residents on rc1 |
| DONE-05 | SignWell adapter (sandbox/code) | API-004; **prod enable still 🔴 LB-05** |
| DONE-06 | Financial / rent code path | API-005; **live cert still 🔴 LB-04** |
| DONE-07 | SaaS billing code + Checkout create | BILL/ACQ; **operator card path still 🔴 LB-02** |
| DONE-08 | Vendor token workflows | VENDOR-001 |
| DONE-09 | Owner / Tenant portal surfaces | OWNER/tenant portals |
| DONE-10 | Master Admin shell | `/master-admin/*` |
| DONE-11 | STD-001 / NAV-001 / UX-016 / ARCH-001 (certified claims) | Prior cert packages on rc1 |
| DONE-12 | RC1 Limited Beta engineering cert | READY FOR LIMITED BETA |
| DONE-13 | Facility architecture decision (docs) | ADR-015 Proposed/package 24 — ownership only |

---

## 🔵 Post Launch

| ID | Item | Notes |
|----|------|-------|
| PL-01 | Facility Operations expansion | First-class home remains; no new depth until Customer #1 GO |
| PL-02 | Inventory / Assets / Parts programs | Facility-owned |
| PL-03 | Preventive Maintenance maturity | Facility → Maintenance WO handoff |
| PL-04 | Capital Projects | CORE-L9 / Facility |
| PL-05 | Deep Analytics / Executive Ops | |
| PL-06 | Advanced AI / predictive maintenance | Needs Facility data |
| PL-07 | Offline / advanced PWA | |
| PL-08 | Native mobile | docs/19 |
| PL-09 | Help Center CMS | Empty-state help OK in B |
| PL-10 | CORE-004 Phase 6+ capabilities | Frozen under LAUNCH-001 |
| PL-11 | PUSH-001 real-device cert resume | Abandoned — needs new Approve |
| PL-12 | SMS-first vendor journey | |
| PL-13 | Full trust accounting / GL | ADR-010 |

---

## B — Time-permitting (parked; not 🔴)

| ID | Item | Promote to 🔴 only if… |
|----|------|------------------------|
| ST-01 | Owner Portal polish | Customer #1 contract requires it |
| ST-02 | Vendor invoice UX polish | Vendor pay fails dry-run |
| ST-03 | Command Center / Ops Inbox density | PM cannot run a day (journey FAIL) |
| ST-04 | Empty/loading consistency | Trust FAIL on critical paths |
| ST-05 | Demo data pack | Sales blocked |
| ST-06 | In-product help snippets | Support overload |
| ST-07 | ACH depth cert | Customer #1 requires ACH day one |

---

## Board health

| Metric | Target |
|--------|--------|
| Open 🔴 count | Trend → 0 before GO |
| 🟡 age | No item > 1 review cycle without update |
| New 🔵 items during LAUNCH-001 | Allowed to park; not to schedule ahead of 🔴 |
| Unauthorized feature PRs | Reject — point to this board |
