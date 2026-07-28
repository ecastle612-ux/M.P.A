# 01 — User Stories

**Package:** OWNER-001  
**Status:** Approved · Phase 1 ✅ COMPLETE  
**Section:** §4 User Stories

---

## Actors

| Actor | Description |
|-------|-------------|
| **Commercial Property Owner** | Authenticated user with `property_owner` role for one or more organizations; primary consumer of this portal |
| **Property Manager (supporting)** | Produces statements, documents, messages, and financial activity that owners consume (not a portal user story actor for MVP screens) |
| **Master Admin (Test Mode)** | May preview Owner Portal with demo fixtures; must never expose demo data to real owners |

---

## Epic A — Orientation & Portfolio Clarity

### US-A01 — First-login understanding
**As a** commercial property owner  
**I want** to see portfolio performance, recent activity, and attention items on Home  
**So that** I immediately know how my investments are doing without calling my PM.

**Acceptance notes:** Home answers the four Purpose questions in one composition.

### US-A02 — Properties owned list
**As an** owner  
**I want** a clear list of properties I can access  
**So that** I know what is in my portfolio.

### US-A03 — Portfolio occupancy
**As an** owner  
**I want** portfolio-level and property-level occupancy  
**So that** I can judge vacancy risk at a glance.

### US-A04 — Attention items
**As an** owner  
**I want** outstanding balances, unread messages, and pending-payout placeholders surfaced  
**So that** I know what needs my attention.

---

## Epic B — Property Detail

### US-B01 — Open a property
**As an** owner  
**I want** to open a property view from Home or Properties  
**So that** I can inspect that asset’s performance and activity.

### US-B02 — Residents (read)
**As an** owner  
**I want** to see current residents (read-only) for a property  
**So that** I understand who occupies my units without managing tenancy.

### US-B03 — Property income & expenses
**As an** owner  
**I want** monthly income and vendor expenses for a property  
**So that** I can see cash movement on that asset.

### US-B04 — Open maintenance (read)
**As an** owner  
**I want** to see open maintenance items  
**So that** I understand operational issues (without approving work in MVP).

### US-B05 — Property documents & activity
**As an** owner  
**I want** recent activity and property-linked documents  
**So that** I can review history and files in one place.

---

## Epic C — Financial Transparency

### US-C01 — Financial summary
**As an** owner  
**I want** Income, Expenses, Net Income, Vendor Payments, and Maintenance Costs  
**So that** financial performance is easy to read.

### US-C02 — Monthly statements
**As an** owner  
**I want** to list and open monthly owner statements  
**So that** I can review the same professional statements PMs generate today.

### US-C03 — Receipts & payment history
**As an** owner  
**I want** receipts and payment history relevant to my portfolio  
**So that** I can reconcile income events.

### US-C04 — Vendor expenses appear automatically
**As an** owner  
**I want** vendor payments already recorded in the financial/ops stack to appear in Financials and Home  
**So that** I do not rely on emailed spreadsheets.

### US-C05 — Pending payout (placeholder)
**As an** owner  
**I want** to see a Pending Owner Payout area  
**So that** I understand where live payouts will appear after FIN-003 — even if MVP shows “coming soon” / zero / unavailable state.

### US-C06 — Completed payouts (placeholder)
**As an** owner  
**I want** a Completed Payouts section marked as unavailable until FIN-003  
**So that** the portal feels complete and ready for Blocker 4.

### US-C07 — Reports
**As an** owner  
**I want** to access owner-appropriate reports produced by the existing ReportingService  
**So that** I am not blocked waiting for a new report engine.

---

## Epic D — Documents

### US-D01 — Document library
**As an** owner  
**I want** a Documents area listing Owner Statements, Leases, Inspection Reports, Invoices, Maintenance Photos, and Shared Documents  
**So that** important files are self-serve.

### US-D02 — Secure open/download
**As an** owner  
**I want** to open or download documents I am permitted to see  
**So that** access is convenient but still org-isolated and audited.

### US-D03 — Latest statement shortcut
**As an** owner  
**I want** Home to surface the latest statement with a path to full detail  
**So that** the most common document is one tap away.

---

## Epic E — Communication

### US-E01 — Read messages
**As an** owner  
**I want** to read message threads involving me / my ownership context  
**So that** I stay informed.

### US-E02 — Reply to messages
**As an** owner  
**I want** to reply to messages  
**So that** communication is two-way (capability grant may be required — see Open Questions).

### US-E03 — Announcements
**As an** owner  
**I want** to receive and read organization/property announcements intended for owners  
**So that** I see PM broadcasts without email-only delivery.

### US-E04 — Notifications
**As an** owner  
**I want** to receive in-app notifications (and push when enrolled) for relevant events  
**So that** I am alerted to statements, messages, and attention items.

---

## Epic F — Mobile

### US-F01 — Mobile financial first
**As an** owner on a phone  
**I want** Financial Summary, Messages, Statements, and Documents prioritized  
**So that** the mobile portal matches how I actually check in.

### US-F02 — Secondary surfaces
**As an** owner on a phone  
**I want** Properties, full Reports, and Settings reachable but secondary  
**So that** the first viewport is not a dense dashboard of everything.

---

## Epic G — Trust & Access

### US-G01 — Org isolation
**As an** owner in Org A  
**I want** never to see Org B data  
**So that** multi-tenant isolation holds.

### US-G02 — Read-only financials
**As an** owner  
**I want** financial data to be read-only in the portal  
**So that** I cannot mutate ledgers, charges, or payouts.

### US-G03 — Settings / profile
**As an** owner  
**I want** access to profile and notification preferences appropriate to my role  
**So that** I can manage identity without PM admin tools.
