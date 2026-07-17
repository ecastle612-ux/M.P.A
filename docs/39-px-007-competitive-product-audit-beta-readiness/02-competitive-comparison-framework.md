# PX-007.02 — Competitive Comparison Framework

**Status:** Draft

---

## Competitors

| Product | Typical buyer | Strength profile |
|---------|---------------|------------------|
| **AppFolio** | 50–500+ unit professional managers | AI leasing, mobile-first ops, bundled screening, owner reporting depth |
| **Buildium** | 1–500 unit residential / HOA | Accounting depth, QuickBooks, owner portal, established reporting |
| **DoorLoop** | 20–150 unit growing portfolios | Fast onboarding, clean UI, all-in-one at accessible price |
| **Yardi Breeze** | Mixed small/mid commercial + res | Yardi ecosystem entry, accounting, commercial support |

M.P.A. does **not** need to match every enterprise feature on day one. PX-007 identifies **where parity matters for beta** vs. **where differentiation (CA-*) is the bet**.

---

## Comparison dimensions

Score each **1–5** per module:

| Score | Meaning |
|-------|---------|
| 1 | Not present / placeholder |
| 2 | Foundation only; not usable for real PM work |
| 3 | Usable for early adopters with manual workarounds |
| 4 | Competitive for target segment; minor gaps |
| 5 | Matches or exceeds category leader for segment |

### A. Core operations (table stakes)

| Dimension | What “good” looks like |
|-----------|------------------------|
| Property / unit / tenant CRUD | Full lifecycle, search, filters, bulk ops |
| Lease management | Draft → sign → activate → renew → terminate |
| Maintenance | Tenant submit → assign → vendor → complete → notify |
| Vendor management | Directory, assignment, performance visibility |
| Financial ops | Rent charges, payments, expenses, owner statements |
| Communications | Targeted announcements, scheduling, readership |
| Dashboard | Action-first; live occupancy; tasks; activity |

### B. Resident / owner experience

| Dimension | What “good” looks like |
|-----------|------------------------|
| Tenant portal | Rent, maintenance, messages, documents |
| Owner portal | Statements, distributions, property performance |
| Online rent collection | ACH/card, autopay, late fees |
| E-sign leases | In-product or integrated |
| QR / mobile enrollment | Physical → digital onboarding |

### C. Automation & intelligence

| Dimension | What “good” looks like |
|-----------|------------------------|
| Rent reminders | Automated nudges |
| Maintenance routing | Rules + vendor dispatch |
| AI assistance | Embedded, human-gated, workflow-native |
| Listing syndication | Zillow, Apartments.com, etc. |
| Screening | Credit/background integrated |

### D. Reporting & accounting

| Dimension | What “good” looks like |
|-----------|------------------------|
| GL / full accounting | Or credible QuickBooks bridge |
| Owner reporting | Professional PDFs, period close |
| Portfolio analytics | Occupancy, NOI, delinquency trends |
| Export / API | Data portability |

### E. Platform & trust

| Dimension | What “good” looks like |
|-----------|------------------------|
| Mobile experience | Native or excellent PWA |
| Performance | Sub-second perceived navigation |
| Security & roles | SSO, audit trail, RLS (M.P.A. strength) |
| Onboarding time | Portfolio live in < 1 hour |
| Support & docs | Help center, in-app guidance |

---

## M.P.A. differentiation lens

When scoring, note whether gap is:

- **Parity gap** — table stakes; beta blocker if missing for target cohort
- **Differentiation** — M.P.A. CA advantage (workflow-first, AI ops center, QR comms)
- **Deferred by design** — documented in PRR/roadmap (Phase 12+, integrations)

Reference: [Competitive Advantages (CA-001–011)](../31-product-requirements/competitive-advantages.md)

---

## Scorecard template

Use in [06-initial-gap-analysis.md](./06-initial-gap-analysis.md) and finalize after live walkthrough.

| Module | M.P.A. | AppFolio | Buildium | DoorLoop | Yardi | Gap type | Beta impact |
|--------|--------|----------|----------|----------|-------|----------|-------------|
| PM web app — core CRUD | | | | | | | |
| Workflow / onboarding | | | | | | | |
| Maintenance | | | | | | | |
| Financials | | | | | | | |
| Communications | | | | | | | |
| AI Operations | | | | | | | |
| Tenant portal | | | | | | | |
| Owner portal | | | | | | | |
| Online payments | | | | | | | |
| Mobile | | | | | | | |

---

## Audit method

1. Run identical PM tasks on M.P.A. and competitor marketing demos / trial UIs where available.
2. Record: steps, clicks, confusion points, missing data.
3. Do **not** count marketing features M.P.A. has deliberately deferred.
4. Separate **UX craft** (enterprise SaaS bar) from **feature parity** (this document).
