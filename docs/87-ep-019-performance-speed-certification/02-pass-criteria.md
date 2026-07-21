# 02 — Pass Criteria

**Package:** EP-019  
**Status:** Draft (Awaiting Approve)

---

## Design Partner Ready (hard gates)

All must PASS for overall **PASS**:

| Gate | Threshold | Notes |
| --- | --- | --- |
| LCP | &lt; 2.5 s | Mobile + desktop, key entry routes (login, dashboard) |
| INP | &lt; 200 ms | Primary interactive surfaces |
| CLS | &lt; 0.1 | No layout jump on shell / lists / detail |
| Navigation feel | No perceptible lag | Core route transitions (see route list) |
| UI stutter | None visible | Drawer, search, forms, WO, messages on mobile |
| Spinners | No unnecessary full-route spinners | Prefer skeletons / streamed content already painted |
| Mobile feel | “Native-like” | Real device observations, not lab-only |
| Regressions | None introduced | Vs baseline for optimized surfaces |

## Platform stretch (report, do not block Design Partner Ready alone)

From [15 Performance Standards](../15-performance-standards/index.md):

| Metric | Stretch |
| --- | --- |
| Desktop LCP | &lt; 2.0 s |
| TTFB | &lt; 600 ms |
| Initial JS (PM portal) | &lt; 200 KB gzipped |
| Per-route chunk | &lt; 100 KB gzipped |
| List view (100 items) server | &lt; 500 ms |
| Detail panel open | &lt; 300 ms |
| Command search | &lt; 500 ms end-to-end |

## Route navigation set

Every transition should feel instant (target: &lt; 300 ms to meaningful paint / interactive chrome; full data may stream after):

- Dashboard  
- Properties  
- Units  
- Residents  
- Applicants  
- Maintenance  
- Messages  
- Accounting  
- Reports  
- Settings  

## Real-user task budgets (perceived)

| Task | Budget (feel) |
| --- | --- |
| Login → authenticated shell | Instant chrome; data &lt; 2.5 s LCP |
| Open dashboard | Instant nav; widgets stream |
| Create property | Form interactive &lt; 1 s after route |
| Open resident | Detail chrome &lt; 300 ms; body streams |
| Create work order | Form interactive &lt; 1 s |
| Send message | Composer usable immediately; send ack &lt; 2 s |
| Generate report | Progress visible; no frozen UI (async OK per standards) |

## Scoring model (/10)

| Score | Meaning |
| --- | --- |
| 9–10 | Premium OS / native feel; stretch targets largely met |
| 7–8 | Design Partner Ready; hard gates PASS; stretch gaps documented |
| 5–6 | Usable but lag/spinners remain on common paths |
| ≤ 4 | Not partner-ready |

**Production performance score** = same scale judged on Production host only.  
**Design Partner readiness** = binary PASS/FAIL on hard gates.
