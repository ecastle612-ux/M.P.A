# 00 — Purpose & Scope

**Package:** OWNER-001  
**Status:** ✅ **COMPLETE** · ✅ **CERTIFIED PASS** · Blocker 3 ✅ **CLOSED**  
**Sections:** §2 Purpose · §3 Scope

---

## 2. Purpose

### Business goals

Commercial property owners are primary stakeholders in every PM sale. Before OWNER-001, `/portal/owner` was a future-release notice: statements and reports existed for managers, but owners could not self-serve (CORE-001 P0-04 / CORE-002 Blocker 3). That blocker is now **CLOSED**.

OWNER-001 makes the Owner Portal the **primary destination** for property owners so that after login they can answer four questions without calling the PM:

| Question | Portal answer |
|----------|---------------|
| How are my investments performing? | Portfolio summary, occupancy, rent collected, net income |
| What happened recently? | Recent activity, vendor expenses, messages, announcements |
| What requires attention? | Outstanding balances, open maintenance (read), pending payout placeholder, unread messages |
| What income and expenses occurred? | Financial summary, statements, receipts, payment history, vendor payments |

### Product goals

1. **Immediate clarity** — Owner Home communicates performance and attention items in the first viewport.  
2. **Financial readability** — Income, expenses, net, statements, and receipts are easy to scan on desktop and mobile.  
3. **Automatic vendor expense visibility** — Vendor payments already recorded in the financial/ops stack appear in owner views without a parallel expense system.  
4. **Document access** — Statements, leases, inspections, invoices, maintenance photos, and shared docs are reachable via Document Vault.  
5. **Working communication** — Owners can read and reply to messages, receive announcements and notifications.  
6. **FIN-003 readiness** — Surfaces for pending/completed payouts exist as **placeholders** so Blocker 4 can plug in without redesigning the portal.

### Non-goals (this package)

- Redesigning owner data architecture, RBAC model, or portal shell foundation.  
- Building Stripe Connect, ACH payouts, or `OwnerPayoutService` (FIN-003 / Blocker 4).  
- Turning the portal into a full owner CRM, investment analytics suite, or tax product.  
- Replacing PM operational workflows.

---

## 3. Scope

### In scope (MVP)

| Area | Description |
|------|-------------|
| **Owner Dashboard (Home)** | Portfolio summary; properties owned; occupancy; current rent collected; outstanding balance; recent vendor expenses; pending owner payout (placeholder); latest statement; recent messages; announcements; documents |
| **Property View** | Per-property occupancy, residents (read), monthly income, vendor expenses, open maintenance (read), recent activity, documents |
| **Financial Summary** | Income, expenses, net income, vendor payments, maintenance costs, statements, receipts, payment history, pending payout (placeholder), completed payouts (placeholder until FIN-003) |
| **Monthly Statements** | List + detail of owner statements from existing financial/reporting outputs |
| **Documents** | Owner statements, leases, inspection reports, invoices, maintenance photos, shared documents via Document Vault |
| **Messages** | Read threads; reply; deep-link from Home |
| **Notifications** | Receive and manage in-app notifications (and push when enrolled via existing notification foundation) |
| **Reports** | Consume existing ReportingService / report catalog outputs appropriate for owners (read); no new report engine |
| **Mobile Experience** | Prioritize Financial Summary, Messages, Statements, Documents; everything else secondary |

### Explicitly out of scope — Future Release

| Excluded item | Classification | Notes |
|---------------|----------------|-------|
| Stripe Connect | **Future Release** | ADR-023 Accepted; Blocker 4 |
| ACH payouts | **Future Release** | Part of FIN-003 |
| FIN-003 Owner Payouts (live execution) | **Future Release** | Portal shows placeholders only |
| Owner maintenance approvals | **Future Release** | Owners may **view** open maintenance; approve/reject is not MVP |
| Investment analytics | **Future Release** | No IRR/cap-rate/forecast dashboards |
| AI forecasting | **Future Release** | Existing AI services may assist navigation/search; no owner financial forecasting product |
| Tax automation | **Future Release** | No 1099 / tax export product in MVP |

### Scope lock rules

1. If a proposed screen or capability is not listed under **In scope**, it is out of scope unless Approve amends this document.  
2. Placeholders for pending/completed payouts are **in scope** as non-executing UI/copy; they must not call Stripe or invent payout ledgers.  
3. Any schema change beyond what Approve explicitly unlocks restarts Design → Document → Approve.

### Implementation phase boundaries (binding)

| Phase | Name | Status | What belongs here |
|------:|------|--------|-------------------|
| 1 | Foundation | ✅ **COMPLETE** | Shell, nav, RBAC, widget chassis, existing service reads |
| 2 | Dashboard Data | ✅ **COMPLETE** | Live owner-scoped Home modules (collections, expenses, statements, attention, payout placeholder) |
| 3 | Property Experience | ✅ **COMPLETE** | Property detail view |
| 4 | Financial Experience | ✅ **COMPLETE** | Full financials / statements / receipts / history |
| 5 | Documents | ✅ **COMPLETE** | Categories, scoping, vault UX |
| 6 | Messaging | ✅ **COMPLETE** | Reply grants, announcements, inbox polish |
| 7 | Reports | ✅ **COMPLETE** | Consume/download ReportingService artifacts |
| 8 | Settings | ✅ **COMPLETE** | Preferences / profile depth |

Unfinished MVP items above Phase 1 are **Deferred to Phase 2+**. Items in **Explicitly out of scope** remain **Future Release** (not Phase 2+).
