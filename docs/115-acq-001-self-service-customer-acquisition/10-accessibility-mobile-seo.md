# 10 — Accessibility, Mobile & SEO

**Package:** ACQ-001  
**Status:** ✅ Approved / Certified (Slice C)

---

## Accessibility

| Requirement | Detail |
|-------------|--------|
| WCAG target | AA for public marketing + acquire pages |
| Keyboard | Full tour stepper, pricing toggles, CTAs |
| Focus | Visible focus; no focus traps in tour |
| Contrast | Canopy tokens |
| Motion | Respect `prefers-reduced-motion`; tour still completable |
| Forms | Labels, errors tied to fields, Enterprise contact form |

---

## Mobile experience

| Requirement | Detail |
|-------------|--------|
| Responsive | Landing / tour / pricing usable on phone |
| Checkout | Stripe Checkout mobile-ready (hosted) |
| CTAs | Thumb-reachable; no hover-only actions |
| Tour | Swipe or Next; avoid tiny hit targets |

Authenticated PWA concerns remain PMX-004 — ACQ public site is mobile web first.

---

## SEO considerations

| Item | Guidance |
|------|----------|
| Indexing | Landing, Tour, Pricing, Contact Sales indexable |
| Noindex | `/acquire/success|canceled|error` (session-specific) |
| Titles / H1 | Unique per page; brand + intent |
| Meta description | Honest value prop; no keyword stuffing |
| Structured data | Optional Organization / SoftwareApplication later |
| Performance | LCP-conscious hero; no blocking third parties beyond analytics consent |
| Canonical | Prefer apex or www consistently (ops DNS SoT) |

---

## Privacy / cookies

Analytics and marketing cookies follow existing privacy posture; Checkout itself is Stripe-hosted. Document consent banner needs in open questions if not already global.
