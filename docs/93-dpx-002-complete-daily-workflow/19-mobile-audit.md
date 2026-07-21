# 19 — Mobile Audit (Phase 5)

**Package:** DPX-002  
**Viewport:** 390×844 (live baseline)  
**Device class:** Phone simulation

---

## Observations

| Area | Finding | Interruption? |
| --- | --- | --- |
| Thumb reach | Toolbelt sticky `bottom-16` (above mobile chrome) — good when page loads | No |
| Scroll | Dashboard **1.5** screenfuls — acceptable but crowded | Mild |
| Keyboard | Not heavily used on S1–S2; Search uses keyboard | — |
| Drawer | Menu required if not using dashboard links / Search | Yes if overused |
| Search | Command Center available on lists; strong for find-resident (&lt;5s budget) | Prefer over Menu |
| AI | Fab present; wrong/generic labels on some lists; useless when detail crashes | Yes when context wrong |
| Hard stops | Property / WO / Resident detail failures | **Critical** |
| Hydration | Sidebar hydration error overlay in dev | Yes (noise) |
| Filters | Maintenance default empty vs dashboard counts | Yes |

## Mobile path rule (for implementation)

1. Prefer dashboard Resolve → entity, or Search M.P.A.  
2. Prefer toolbelt over Menu  
3. Never require desktop-only patterns  
4. Fix crashes before polish spacing

## Metrics to re-measure after P0–P1

| Metric | Baseline | After |
| --- | --- | --- |
| Full path completion on phone | **Impossible** | TBD |
| Drawer opens per path | 0–2 (S1–S2) | TBD |
| Search uses | 0–1 | TBD |
| AI uses that saved a nav | 0 (blocked) | TBD |
| Scroll screenfuls S1→S10 | Partial ~3 | TBD |
