# Production Polish Backlog — BUG-008

**Captured:** 2026-08-08 · www · ADR-019 audit  
**Update:** 2026-08-09 — Sprint 1 Public Experience ([docs/51-phase-3-production-polish](../51-phase-3-production-polish/index.md)) closed carry-in items below.

| ID | Sev | Area | Finding | Evidence | Sprint 1 |
|----|-----|------|---------|----------|----------|
| PP-001 | **P0** | Demo | All product demos render blank after Enter demo. Redirect loop between `/demo/{product}/{surface}` and `/api/demo/start`. | `a559e.webp`, `320f9.webp`, `83bdc.webp` | Verified fixed (BUG-009) |
| PP-002 | **P0** | Demo | No loading or error UI when demo fails — customer sees empty white page. | Same | Verified fixed (BUG-009) |
| PP-003 | **P1** | Trust | Live Demo is marketed on landing/nav but cannot be experienced — damages first-time evaluation. | `32b99.webp` → blank surfaces | Verified fixed (BUG-009) |
| PP-004 | **P2** | Pricing UX | Feature lists inside pricing cards use nested scroll (`max-h` + overflow) — easy to miss modules. | `0d298.webp` | **Fixed** |
| PP-005 | **P2** | Copy | Pricing states “Amount confirmed in Stripe Checkout when self-service is supported” on FO/Complete cards while FO/Complete self-serve checkout is not yet available — honest but may confuse; clarify CTA outcomes. | `0d298.webp` | **Fixed** |
| PP-006 | **P2** | Confirm Plan | FO/Complete Confirm Plan falls back to “choose Property Manager / Enterprise Solutions” rather than Stripe — constitution-legal, but path should be clearer before Confirm. | Live `/checkout?intent=mpa_facility_operations` | **Fixed** |
| PP-007 | **P3** | URL | Confirm Plan / nav links expose internal `plan=professional` query param (not shown as UI tier). | Confirm Plan URLs | **Fixed** |
| PP-008 | **P3** | A11y | Dense public nav (8+ items) wraps tightly on mid widths; mobile brief check OK but tab order / overflow worth review. | `42279.webp` | **Fixed** |
| PP-009 | **P3** | Visual | Hero abstract building SVG is atmospheric only — acceptable; no product photography. | `7a8a6.webp` | Accepted |
| PP-010 | **P3** | Flow | Full Stripe → Create Account → Guided Setup → Mission Control not exercised in public audit (requires live payment). | N/A | Out of sprint |

## Priority legend

- **P0** Broken  
- **P1** Hurts customer trust  
- **P2** UX polish  
- **P3** Nice to have
