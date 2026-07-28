# 08 — Acceptance Criteria

**Package:** OWNER-001  
**Status:** ✅ Criteria met · OWNER-001 ✅ **CERTIFIED PASS** · Blocker 3 ✅ **CLOSED**  
**Section:** §11 Acceptance Criteria  
**Alignment:** CORE-002 Blocker 3 — Owner Portal ([Closeout](../103-core-002-commercial-launch-blocker-execution/Blocker-3-Closeout.md))

---

## Commercial PASS definition

OWNER-001 (after Approve + Implement) is **PASS** only when all criteria below are **PASS**. Any **FAIL** blocks CORE-002 Blocker 3 closure.

This document defines certification criteria. **Certification evidence:** [28 — OWNER-001 Certification](./28-owner-001-certification.md). Package implement is complete; Blocker 3 is **CLOSED**.

---

## A. Experience — immediate understanding

| ID | Criterion | PASS | FAIL |
|----|-----------|------|------|
| A1 | On owner login, Owner Portal is the primary destination (not FutureReleaseNotice) | Owner lands on Dashboard/Home with real portfolio framing | FutureReleaseNotice or dead-end |
| A2 | Home answers performance / recent / attention / income-expense questions | Reviewer can answer all four without PM help | Missing major modules or misleading empties |
| A3 | Portal feels complete for commercial MVP | Navigation covers Dashboard, Properties, Financials, Documents, Messages, Reports, Settings | Obvious stub pages or “coming soon” for in-scope areas (payout placeholders excepted) |

---

## B. Financial readability

| ID | Criterion | PASS | FAIL |
|----|-----------|------|------|
| B1 | Financial Summary shows Income, Expenses, Net Income | All three present and period-aware | Missing net or unreadable layout |
| B2 | Vendor Payments and Maintenance Costs visible | Shown from existing data | Hidden or requires PM export |
| B3 | Statements list + detail usable | Open + view/download path works | Statements only on PM workspace |
| B4 | Receipts / Payment History accessible | Owner can review history | Absent or PM-only |
| B5 | Totals honest under error | Errors labeled; no false $0 success | Silent wrong zeros |

---

## C. Vendor expenses automatic

| ID | Criterion | PASS | FAIL |
|----|-----------|------|------|
| C1 | Vendor expenses appear on Home and/or Financials and Property View when upstream records exist | Seeded/real vendor payment appears without owner data entry | Manual CSV/email-only path |
| C2 | No parallel expense system introduced | Uses existing financial/vendor payment records | New owner-only expense DB |

---

## D. Documents

| ID | Criterion | PASS | FAIL |
|----|-----------|------|------|
| D1 | Documents library covers required categories | Statements, Leases, Inspections, Invoices, Maintenance Photos, Shared Docs (empty OK if none exist) | Categories missing or vault bypass |
| D2 | Secure open/download | Authorized owner can open; unauthorized cannot | IDOR or public URLs |
| D3 | Latest statement shortcut on Home | Present when a statement exists | No path from Home |

---

## E. Communication

| ID | Criterion | PASS | FAIL |
|----|-----------|------|------|
| E1 | Read messages | Owner can open inbox/thread | Messages absent |
| E2 | Reply messages | Owner can reply successfully (if Approve adopts P-MSG-1) | Read-only only when Approve required reply |
| E3 | Announcements receivable | Owner can see owner-intended announcements | No owner-safe path |
| E4 | Notifications | In-app notifications work with deep-links | Center broken for owners |

---

## F. Property View

| ID | Criterion | PASS | FAIL |
|----|-----------|------|------|
| F1 | Property View shows occupancy, residents, monthly income, vendor expenses, open maintenance, recent activity, documents | All sections present (empty states OK) | Major sections missing |
| F2 | No maintenance approval controls | View-only | Approve/reject shipped in MVP |

---

## G. Payout readiness (Blocker 4 prep)

| ID | Criterion | PASS | FAIL |
|----|-----------|------|------|
| G1 | Pending Owner Payout placeholder visible | Clear non-operational state | Hidden entirely or fake “Paid” |
| G2 | Completed Payouts placeholder until FIN-003 | Explicit Future Release / unavailable | Live Stripe Connect shipped in OWNER-001 |
| G3 | No Stripe Connect / ACH execution in this sprint | Confirmed absent | Connect onboarding or transfers present |

---

## H. Security & permissions

| ID | Criterion | PASS | FAIL |
|----|-----------|------|------|
| H1 | Multi-tenant isolation | Cross-org access attempts denied | Any cross-org leak |
| H2 | Financial read-only | Owner cannot mutate ledger/payouts | Write paths exposed |
| H3 | Document access authorized | Vault checks enforced | Unauthorized download |
| H4 | Audit on sensitive downloads | Evidence of audit trail | No audit |

---

## I. Mobile / responsive

| ID | Criterion | PASS | FAIL |
|----|-----------|------|------|
| I1 | Phone prioritizes Financial Summary, Messages, Statements, Documents | Verified on phone viewport | Desktop-only usable |
| I2 | Tablet usable | No broken layout | Overlap / unreachable CTAs |
| I3 | Desktop nav complete | Seven primary areas available | Missing primary nav |

---

## J. Quality gates (post-Approve implement)

| ID | Criterion | PASS | FAIL |
|----|-----------|------|------|
| J1 | `pnpm typecheck` | Exit 0 | Failures |
| J2 | `pnpm --filter @mpa/web build` | Exit 0 | Failures |
| J3 | No architecture redesign | Review confirms reuse map | New parallel systems |

---

## K. CORE-002 Blocker 3 closure

| ID | Criterion | PASS | FAIL |
|----|-----------|------|------|
| K1 | Commercial certification evidence recorded under CORE-002 / this package | Linked cert note exists | “Done” claimed without evidence |
| K2 | Known Limitations updated if any deferred Approve items remain | Written limitations | Silent gaps |
| K3 | Ready for FIN-003 without portal redesign | Payout placeholders accepted as integration points | Portal must be rebuilt for payouts |

---

## Certification protocol (after Implement)

1. Use a real `property_owner` account (or impersonation with audit) — not only Master Admin demo.  
2. Walk Desktop → Tablet → Phone.  
3. Verify seeded statements, vendor expenses, documents, and a message thread.  
4. Attempt negative tests: other-org document id, financial mutate, payout execute.  
5. Record evidence (screenshots + short cert note) and mark Blocker 3 PASS only if A–K pass.
