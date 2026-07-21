# 07 — Bottleneck Register

**Package:** EP-019  
**Status:** Hypotheses only until measured  

Impact scale: **P0** partner-blocking · **P1** common-path lag · **P2** polish · **P3** stretch

| ID | Area | Hypothesis | Impact (est.) | Evidence status | Owner after Approve |
| --- | --- | --- | --- | --- | --- |
| B1 | Bundle / hydration | Sparse dynamic import; heavy shared client graph | P0–P1 | Unverified (H1) | — |
| B2 | React shell | Broad client contexts / shell rerenders | P0–P1 | Unverified (H2) | — |
| B3 | Dashboard data | Widget fan-out / duplicate fetches | P1 | Unverified (H7) | — |
| B4 | Navigation UX | Full-route loading flashes | P1 | Unverified (H5) | — |
| B5 | CI budgets | Perf tests too loose | P2 (process) | Confirmed in code (H3) | — |
| B6 | PWA | Cache-first static + dual SW | P1–P2 | Partial code review (H4) | — |
| B7 | Images | Possible unoptimized / CLS risk | P1–P2 | Unverified (H8) | — |
| B8 | Database | Unknown N+1 / indexes on hot lists | P0–P1 | Not measured | — |

_Update Impact and Evidence after baseline runs; resort by measured user-time saved._
