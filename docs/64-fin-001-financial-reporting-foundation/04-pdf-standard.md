# 04 — PDF Standard

**Package:** FIN-001  
**Status:** Design ✔ · Document ✔ · Approve Pending · Implement Blocked

---

## Intent

Every FIN-001 PDF must look like a **professional property management packet**, not a raw HTML dump or spreadsheet printout. Preview UI and PDF share the same typographic hierarchy and section structure (preview may adapt for dark/light chrome).

---

## Brand & identity block (required)

| Element | Placement | Notes |
| --- | --- | --- |
| Company / organization logo | Header left or top brand band | From org branding / media; fallback wordmark |
| Organization legal/display name | Adjacent to logo | Required |
| Report title | Header / title band | e.g. “Owner Statement” |
| Property name | Meta block | Required |
| Property address | Meta block | Street, city, region, postal |
| Manager name | Meta block | Primary property manager or org contact; graceful “—” if missing |
| Reporting period | Meta block | Human-readable (“July 2026” or date range) |
| Generated timestamp | Meta block + footer | ISO/local org timezone labeled |
| Confidentiality line | Footer | Optional short notice |

---

## Page chrome

| Element | Requirement |
| --- | --- |
| Header | Logo + org + report title (may shrink after page 1) |
| Footer | Page `n of m`, generated timestamp, organization short name |
| Margins | Print-friendly (≥ 0.5" recommended); avoid edge-clipped totals |
| Page size | US Letter default; A4 later if locale requires |

---

## Typography & layout

| Rule | Guidance |
| --- | --- |
| Hierarchy | Title → section → table header → body → totals |
| Fonts | Align with Canopy / brand PDF stack chosen at Implement; avoid generic “AI purple” themes in UI preview |
| Tables | Clear column alignment; numeric right-align; currency formatting consistent |
| Totals | Visually distinct (weight / rule line); never ambiguous which column totals |
| Subtotals | Section end; labeled |
| Spacing | Generous print spacing; avoid dense “wall of numbers” |
| Color | Grayscale-safe for print; accent sparingly for section rules |
| Dark/light preview | Preview chrome follows app theme; PDF itself remains print-neutral (light page) |

---

## Content structure (all reports)

1. **Cover / header identity block**  
2. **Period & scope summary** (property, period, basis label)  
3. **Body sections** (per catalog)  
4. **Totals block**  
5. **Notes / basis disclaimer** (e.g. cash vs accrual)  
6. **Future signature block placeholder** (see below)

---

## Totals & integrity

- Every money column that claims a total must reconcile to visible line items (within rounding policy).  
- Rounding: standard half-up to currency minor units; show currency code or symbol consistently.  
- Multi-page tables: repeat column headers; carry “continued” label when needed.  
- Grand total appears on final page (and summary may appear on page 1 for Owner Statement / P&L).

---

## Future digital signature location

Reserve a labeled region at end of packet:

```
______________________________     ______________
Authorized signature                 Date

Name / Title
```

Phase 1: **visual placeholder only** — no e-sign integration (API-004 remains separate). Do not imply the PDF is legally executed.

---

## Accessibility & quality bar

| Check | Bar |
| --- | --- |
| Selectable text | Prefer text PDFs over scanned images |
| Contrast | Body text meets readable print contrast |
| Filename | `{reportType}_{propertySlug}_{period}_v{version}.pdf` |
| Language | English Phase 1; i18n later |

---

## Preview parity

Interactive preview must show:

- Same sections and totals as PDF  
- Clear “Preview” labeling so users know it is not yet/already vaulted  
- Actions: Download PDF · Save to Vault status · (future) Send to Owner · (future) AI Summary  

Preview is **not** required to be pixel-identical to PDF, but numbers and grouping must match.
