# LAUNCH-001 — Customer #1 Checklist

**Status:** Draft  
**Use:** Execute on **production** (or production-identical) before GO.  
**Pass rule:** Every row ✅ with evidence link/date. Any ❌ = NO-GO.

---

## Preflight

| # | Check | ✅/❌ | Evidence |
|---|-------|:-----:|----------|
| P1 | Deploy SHA = Launch Board baseline (LB-01) | | |
| P2 | Privacy Policy URL live (LB-11) | | |
| P3 | Terms of Service URL live (LB-12) | | |
| P4 | Monitoring alerting (LB-13) | | |
| P5 | Error reporting receiving events (LB-15) | | |
| P6 | Backup/restore drill recorded (LB-16) | | |
| P7 | Support alias + on-call note (LB-17) | | |
| P8 | Known Limitations signed (LB-21) | | |
| P9 | Stripe SaaS + Rent providers **not** noop in prod | | |
| P10 | SignWell provider **not** noop in prod | | |

---

## A. Create & configure organization

| # | Step | Actor | ✅/❌ | Evidence |
|---|------|-------|:-----:|----------|
| A1 | Start acquisition / Checkout (or assisted provision) | Prospect | | |
| A2 | Complete trial/paid Checkout | Prospect | | |
| A3 | Receive admin credentials / first-login | Org Admin | | |
| A4 | Accept Terms/Privacy | Org Admin | | |
| A5 | Complete Guided Setup → organization Active | Org Admin | | |
| A6 | Configure company profile (name, timezone, branding if any) | Org Admin | | |
| A7 | Confirm SaaS subscription visible in Settings → Billing | Org Admin | | |

---

## B. Team

| # | Step | Actor | ✅/❌ | Evidence |
|---|------|-------|:-----:|----------|
| B1 | Invite Property Manager | Org Admin | | |
| B2 | Invite Leasing Agent | Org Admin | | |
| B3 | Invite Maintenance-scoped user | Org Admin | | |
| B4 | Invitee accepts; lands in correct shell | Staff | | |
| B5 | Wrong-role access blocked | Staff | | |

---

## C. Portfolio

| # | Step | Actor | ✅/❌ | Evidence |
|---|------|-------|:-----:|----------|
| C1 | Add property | PM | | |
| C2 | Add units | PM | | |
| C3 | Upload/key property document | PM | | |
| C4 | Property appears in Command Center / portfolio nav | PM | | |

---

## D. Lease & documents

| # | Step | Actor | ✅/❌ | Evidence |
|---|------|-------|:-----:|----------|
| D1 | Create applicant / lease | Leasing | | |
| D2 | Send for signature via SignWell | Leasing | | |
| D3 | Sign as resident (or test recipient) | Resident | | |
| D4 | Completed PDF stored / visible | PM | | |
| D5 | Move-in / activate resident | PM / Leasing | | |

---

## E. Rent collection

| # | Step | Actor | ✅/❌ | Evidence |
|---|------|-------|:-----:|----------|
| E1 | Rent charge exists for lease period | System/PM | | |
| E2 | Resident pays via portal | Resident | | |
| E3 | Webhook settles; ledger updated | System | | |
| E4 | PM sees payment in Financials | PM | | |
| E5 | Failure/retry path understood (Known Limitations if partial) | PM | | |

---

## F. Maintenance & vendors

| # | Step | Actor | ✅/❌ | Evidence |
|---|------|-------|:-----:|----------|
| F1 | Resident submits maintenance request | Resident | | |
| F2 | PM triages in Maintenance / Ops Inbox | PM | | |
| F3 | Assign vendor (token or profile) | PM | | |
| F4 | Vendor completes job via access link | Vendor | | |
| F5 | PM verifies / closes WO | PM | | |
| F6 | Invoice/pay baseline per Known Limitations | PM | | |

---

## G. Communications

| # | Step | Actor | ✅/❌ | Evidence |
|---|------|-------|:-----:|----------|
| G1 | PM sends announcement or thread to resident | PM | | |
| G2 | Resident receives in-app and/or email | Resident | | |
| G3 | Notification Center / Inbox shows actionable item | PM | | |
| G4 | Invite / rent / WO emails delivered (LB-06) | System | | |

---

## H. Daily operations (PM)

| # | Step | Actor | ✅/❌ | Evidence |
|---|------|-------|:-----:|----------|
| H1 | Start day at Command Center — knows what needs attention | PM | | |
| H2 | Complete ≥3 real tasks without “where do I go?” dead-ends | PM | | |
| H3 | No duplicate workflow required for same job | PM | | |
| H4 | Empty states explain next action | PM | | |

---

## I. Owner & Master Admin

| # | Step | Actor | ✅/❌ | Evidence |
|---|------|-------|:-----:|----------|
| I1 | Owner views property/financial summary (per Known Limitations) | Owner | | |
| I2 | Master Admin can support org (impersonation/health as certified) | Master Admin | | |
| I3 | Billing/support issue has escalation path | Support | | |

---

## Sign-off

| Role | Name | Date | Result |
|------|------|------|--------|
| Product | | | PASS / FAIL |
| Engineering | | | PASS / FAIL |
| Ops | | | PASS / FAIL |
| Support | | | PASS / FAIL |

**Overall checklist:** ☐ PASS · ☐ FAIL  

On PASS → update [GO / NO-GO](./go-no-go.md) and clear LB-22 on the [Board](./launch-readiness-board.md).
