# 22 — Slice A Authorization

**Package:** ACQ-001  
**Phrase:** `AUTHORIZE ACQ-001 SLICE A`  
**Status:** ✅ **AUTHORIZED** (2026-07-27)  
**Prerequisite:** [21 — Approval record](./21-approval-record.md) · OQ-01–OQ-12 resolved

---

## Scope (in)

| Item | Detail |
|------|--------|
| Public Landing Page | `/` for anonymous visitors |
| Product Overview | Landing sections + `/overview` |
| Interactive Product Tour | `/tour` |
| Public Pricing | `/pricing` |
| Plan Comparison | On `/pricing` |
| Contact Sales | `/contact-sales` |
| Navigation to Checkout | CTAs → `/acquire/start` (intent + fields; **no** Stripe session) |
| Marketing shell | Shared header/footer, SEO, a11y, responsive |

## Scope (out)

| Item | Belongs to |
|------|------------|
| Stripe Checkout Session create | Slice B |
| Payment success/cancel/error pages | Slice B/C |
| Organization provisioning | Existing AUTH/COM — wired in Slice B/C |
| Guided Setup / activation changes | Not ACQ A |
| COM opportunity persistence from Contact Sales | Slice B (form UX in A) |
| Funnel analytics pipeline | Slice D (optional light events in A OK) |

---

## Exit criteria

1. Anonymous visitor can complete Landing → Tour → Pricing → Contact Sales or Checkout intent page without login  
2. Enterprise CTAs never start self-serve Checkout  
3. Trial / Pro / Business CTAs navigate to `/acquire/start` with plan + interval  
4. Founder not listed  
5. Pages indexable (SEO metadata); mobile + keyboard usable  
6. Automated tests for public catalog / decisions  
7. Authenticated users hitting `/` still route to product home (middleware)

---

## Next phrase

```
AUTHORIZE ACQ-001 SLICE B
```
