# 03 — Screen Specifications

**Package:** OWNER-001  
**Status:** Approved · Phase 1 ✅ COMPLETE  
**Section:** §6 Screen Specifications

For every screen: Purpose · Displayed Information · Primary Actions · Empty State · Loading State · Error State · Permissions · Responsive Behavior.

Empty-state rule (UX principles): answer **“What creates the first record?”** — for owners, that is usually PM/system activity, not owner create.

---

## S1 — Owner Dashboard (Home)

### Purpose
Immediate portfolio orientation: performance, recent activity, attention, income/expense signals.

### Displayed Information
- Portfolio Summary (properties count, units if available, occupancy %)
- Properties Owned (list or chips linking to Property View)
- Occupancy (portfolio)
- Current Rent Collected (period-scoped; source = existing financial read models)
- Outstanding Balance
- Recent Vendor Expenses (auto from existing vendor payment / expense records)
- Pending Owner Payout (**placeholder** until FIN-003)
- Latest Statement (title, period, link)
- Recent Messages (preview)
- Announcements (preview)
- Documents (recent / shortcuts)

### Primary Actions
- Open Property View
- Open latest Statement
- Open Messages / reply
- Open Documents
- Open Financials
- Dismiss / open notification from shell

### Empty State
- No properties: “Your property manager has not linked properties to your owner access yet. Contact your property manager.”
- No statements / messages / expenses: calm empty modules with explanation that PM workflows create the first items; no fake demo data for real owners.

### Loading State
Skeleton for summary metrics + module placeholders; no layout jump.

### Error State
Module-level error with retry; remaining modules continue. Global auth/org errors → existing unauthorized / error patterns.

### Permissions
Requires authenticated `property_owner` (or Master Admin owner Test Mode). Data filtered to owner-visible properties/org. `financial:read`, `property:read`, `document:read`, `message:read`, `notification:read` (and reply capability per Approve — see Permissions / Open Questions).

### Responsive Behavior
- **Desktop:** One composition; summary metrics + modules; avoid PM-style dense widget grid.
- **Tablet:** Two-column → single column as width shrinks.
- **Phone:** Prioritize Financial strip + attention + Messages / Statements / Documents shortcuts; secondary modules below fold.

---

## S2 — Properties List

### Purpose
Enumerate properties the owner can access.

### Displayed Information
- Property name, address (if available)
- Occupancy
- Outstanding balance (property-scoped if available)
- Status signals (e.g. vacant units count)

### Primary Actions
- Open Property View
- Filter / search within owned set (reuse shell patterns if present)

### Empty State
“No properties are available for your account. Ask your property manager to grant property access.”

### Loading State
List skeleton rows.

### Error State
Full-list error + retry; preserve nav.

### Permissions
`property:read` within owner scope.

### Responsive Behavior
Desktop table or dense list; mobile stacked cards/rows with occupancy + balance as secondary lines.

---

## S3 — Property View

### Purpose
Single-asset performance and operational visibility (read-mostly).

### Displayed Information
- Occupancy
- Residents (read-only list)
- Monthly Income
- Vendor Expenses
- Open Maintenance (read-only)
- Recent Activity
- Documents (property-linked)

### Primary Actions
- Open resident detail (read-only, if existing shared view allows)
- Open maintenance item (read-only)
- Open document
- Jump to property Financials / Statements filter
- **No** approve/reject maintenance in MVP

### Empty State
Per-section empties: “No open maintenance,” “No vendor expenses this period,” “No documents shared for this property yet.”

### Loading State
Header + section skeletons.

### Error State
Section-level failure preferred; property-not-found → not-found / unauthorized.

### Permissions
`property:read`, `unit:read`, `tenant:read`, `lease:read`, `maintenance:read`, `vendor:read`, `financial:read`, `document:read` within property scope.

### Responsive Behavior
Desktop: header summary + sections. Mobile: summary first; Residents / Maintenance / Documents as secondary sections; minimize horizontal tables.

---

## S4 — Financial Summary

### Purpose
Readable income/expense picture for the owner’s portfolio (default Financials landing).

### Displayed Information
- Income
- Expenses
- Net Income
- Vendor Payments
- Maintenance Costs
- Pending Payout (**placeholder**)
- Completed Payouts (**placeholder until FIN-003**)
- Period selector (reuse existing financial period patterns where available)

### Primary Actions
- Change period
- Navigate to Statements / Receipts / Payment History
- Open related report if linked

### Empty State
“No financial activity for this period. Activity appears when rent, expenses, or statements are recorded by your property manager.”

### Loading State
Metric skeletons + chart/list placeholders (if charts used; charts optional).

### Error State
Banner + retry; do not show partial totals that could mislead without labeling.

### Permissions
`financial:read` only — **no** financial write/mutate.

### Responsive Behavior
Phone: stacked metrics (Income → Expenses → Net) then Vendor Payments / Maintenance; payouts placeholders compact. Desktop: clearer metric row + detail panels.

---

## S5 — Monthly Statements (List)

### Purpose
Access owner statements generated by existing financial / reporting flows.

### Displayed Information
- Statement period
- Property / portfolio scope label
- Status (if available)
- Generated date
- Link to PDF / vault version when present

### Primary Actions
- Open statement detail
- Download / view PDF via Document Vault / ReportingService artifact

### Empty State
“No statements yet. Your property manager publishes statements from Accounting / Reports.”

### Loading State
Table/list skeleton.

### Error State
List error + retry.

### Permissions
`financial:read` + `document:read` for vaulted PDFs.

### Responsive Behavior
Mobile: statement rows with period as primary; download as explicit action. Desktop: table.

---

## S6 — Statement Detail

### Purpose
Review a single statement’s content and artifact.

### Displayed Information
- Period, scope, totals (income/expense/net as provided by existing statement model)
- Line items / sections as already defined by Phase 10 / FIN-001 presentation
- Link to vault PDF version when available

### Primary Actions
- View / download PDF
- Back to list
- Related documents

### Empty State
N/A for missing id → not-found. Empty-section PDF behavior follows FIN-001 (empty sections allowed).

### Loading State
Detail skeleton + PDF frame placeholder.

### Error State
Cannot load statement / cannot download — clear message + retry; no silent zeroing.

### Permissions
`financial:read`, `document:read`; must enforce org + owner scope.

### Responsive Behavior
Mobile: summary first, then sections; PDF open in viewer / system handler.

---

## S7 — Receipts & Payment History

### Purpose
Show income-side receipts and payment history relevant to the owner portfolio.

### Displayed Information
- Payment date, amount, property/unit context, method/status as available from existing ledger/read models
- Receipt links when present

### Primary Actions
- Open receipt
- Filter by property / period

### Empty State
“No payments recorded for this period.”

### Loading / Error
Standard list skeleton / retry.

### Permissions
`financial:read`, `document:read` for receipt files.

### Responsive Behavior
Mobile-first list; desktop table optional.

---

## S8 — Payouts (Placeholder)

### Purpose
Reserve UX for FIN-003 without implementing Connect.

### Displayed Information
- Pending Owner Payout: placeholder value or “Payouts coming soon”
- Completed Payouts: empty placeholder list with Future Release explanation
- Explicit copy that live payouts are not available in this release

### Primary Actions
- None that move money
- Optional link to help / contact PM

### Empty State
Default state **is** the empty/placeholder state until FIN-003.

### Loading / Error
Static placeholder preferred; if API stub exists later, standard loading/error — **not in this Draft’s implementable surface until Approve + FIN-003**.

### Permissions
View-only; no payout mutate capabilities.

### Responsive Behavior
Compact module on Home + section under Financials; mobile-friendly.

---

## S9 — Documents Library

### Purpose
Self-serve access to owner-relevant vault documents.

### Displayed Information (categories)
- Owner Statements
- Leases
- Inspection Reports
- Invoices
- Maintenance Photos
- Shared Documents

### Primary Actions
- Filter by category / property
- Open / download via secure vault URL
- Search within permitted set (if vault search exists; else filter)

### Empty State
Per-category: “No {category} shared yet. Your property manager adds these to the Document Vault.”

### Loading / Error
Grid/list skeleton; per-item download errors do not fail the whole library.

### Permissions
`document:read`, `media:read` as applicable; no `document:create` required for MVP browse.

### Responsive Behavior
Phone: category chips + list; Desktop: sidebar categories + list. Prioritize Statements on mobile.

---

## S10 — Messages Inbox

### Purpose
Read owner-relevant threads.

### Displayed Information
- Thread list: subject/participants/preview/timestamp/unread
- Unread badges via existing notification/messaging counts when available

### Primary Actions
- Open thread
- Reply (see Permissions / Open Questions for `message:create`)

### Empty State
“No messages yet. When your property manager messages you, conversations appear here.”

### Loading / Error
Inbox skeleton; retry on failure.

### Permissions
`message:read` minimum; reply requires create/update grant if Approve adopts US-E02 as-is.

### Responsive Behavior
Mobile P0 surface; full-width thread list → thread view.

---

## S11 — Message Thread

### Purpose
Read and reply within a thread.

### Displayed Information
- Message history
- Timestamps, authors
- Attachments if messaging system already supports them

### Primary Actions
- Reply
- Back to inbox
- Open attachments via secure access

### Empty State
N/A (thread always has at least the opening message if listed).

### Loading / Error
Message list skeleton; send failure keeps draft text and shows error.

### Permissions
Read + reply capability as approved.

### Responsive Behavior
Mobile composer sticky/thumb-reachable; desktop split pane optional.

---

## S12 — Announcements

### Purpose
Receive PM/org announcements intended for owners.

### Displayed Information
- Title, date, body/preview, property scope if any

### Primary Actions
- Open announcement detail
- Mark read if notification model supports it

### Empty State
“No announcements. Organization updates from your property manager will show here.”

### Loading / Error
Standard.

### Permissions
Owner-readable announcement surface (may require capability alignment — Open Questions). Today PM `communication:*` is not granted to owners; design assumes an owner-safe read path without granting PM broadcast powers.

### Responsive Behavior
List on mobile; can be a Home module + dedicated list.

---

## S13 — Notifications

### Purpose
Alert owners to statements, messages, and attention items via existing notification service.

### Displayed Information
- Notification center items (existing shell)
- Preferences in Settings

### Primary Actions
- Open target deep-link (statement, message, property)
- Mark read / update (`notification:update` already granted to owners)

### Empty State
Existing notification empty pattern.

### Loading / Error
Existing shell patterns.

### Permissions
`notification:read`, `notification:update`.

### Responsive Behavior
Reuse shell notification center; mobile accessible from header/drawer.

---

## S14 — Reports

### Purpose
Consume owner-appropriate reports from existing ReportingService / catalog — not a new engine.

### Displayed Information
- Available report types suitable for owners (at minimum Owner Statement / related published reports)
- Versions / generated dates when vaulted

### Primary Actions
- Preview / download existing generated report versions
- **No** requirement that owners generate arbitrary PM report packs in MVP unless Approve says otherwise (default: consume published/owner-safe outputs)

### Empty State
“No reports available yet. Reports appear when generated and shared for your portfolio.”

### Loading / Error
Standard list + download errors.

### Permissions
`financial:read`, `document:read`; never bypass ReportingService for PDFs.

### Responsive Behavior
Secondary on mobile vs Statements; desktop list fine.

---

## S15 — Settings

### Purpose
Profile and notification preferences only.

### Displayed Information
- Profile fields (existing profile surface)
- Notification preferences (existing preference model)
- Org membership context (read)

### Primary Actions
- Update profile
- Update notification preferences
- Switch organization (existing)

### Empty State
N/A.

### Loading / Error
Existing profile patterns.

### Permissions
`profile:read` / `profile:update`, `organization:read` / `organization:switch`, notification prefs as available. **No** org admin, SaaS billing, Connect onboarding.

### Responsive Behavior
Simple stacked form on mobile.

---

## Cross-screen quality bars

| Bar | Requirement |
|-----|-------------|
| Canopy | Use approved design language; no parallel visual system |
| Cognitive load | One job per section; calm empties (DPX-003) |
| No demo leakage | Master Admin fixtures never shown to real owners |
| Payout honesty | Placeholders clearly non-operational until FIN-003 |
| Accessibility | Portal shell a11y baseline parity |
