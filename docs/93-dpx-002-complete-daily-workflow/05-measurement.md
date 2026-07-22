# 05 — Measurement

**Package:** DPX-002  
**Status:** After metrics captured 2026-07-21 (local certification re-run · viewport 390×844)

---

## Per-step delta

| Step | Before taps | After taps | Taps saved | Before scroll | After scroll | Scroll ↓ | Before time (s) | After time (s) | Time ↓ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S1 | 0–1 | 0–1 | 0 | 1.5 | ~1.0 glance + priorities (portfolio disclosed) | ↓ cognitive | 8–15 | 5–10 | ↓ |
| S2 | 1–3 | 1 | 1–2 | ~1.2 | ~1 | mild | 5–20 | 3–8 | ↓ |
| S3 | FAIL | 1 | — | — | ~1.5 | — | FAIL | 3–6 | path unblocked |
| S4 | FAIL | 1 | — | — | ~1 | — | FAIL | 2–4 | path unblocked |
| S5 | est. 1–2 | 1 | — | est. 1+ | ~1 | — | est. | 2–4 | chips keep path |
| S6 | est. 1–3 | 1 | — | est. 1–2 | ~1 | — | est. | 2–5 | chips keep path |
| S7–S8 | FAIL / est. | 1–2 | — | — | ~1.5 | — | FAIL | 4–10 | Assign Vendor on-page |
| S9 | est. 2–6 | 1 | 1–5 | inbox hunt | thread land | ↓ | est. 3–10 | 2–5 | contextual Message |
| S10 | est. 3–8 | 1 | 2–7 | form hunt | prefilled | ↓ | est. 5–15 | 3–8 | Notify owner intent |
| Return | 1–2 | 1 | 0–1 | — | — | — | est. | 1–2 | — |
| **Total** | **Blocked** | **~10–14** | **Path complete** | **N/A** | **~8–10 screenfuls cumulative** | **Continuous** | **Incomplete** | **~30–55s guided** | **Complete** |

## Path-level summary

| Metric | Before | After | Improvement |
| --- | --- | --- | --- |
| End-to-end completion time | Incomplete (hard stops) | ~30–55s guided continuous path | Path completable |
| Total taps | Incomplete | ~10–14 primary taps | No hunting |
| Total scroll (screenfuls @ mobile) | Prefix only ~2.5–3 | Continuous path ~8–10 cumulative | No dead-end scroll |
| Hesitation count | 3+ hard stops | 0 hard stops · 0 medium on path | Cleared |
| Times used global nav drawer | Often (recover) | 0 on certified path | Toolbelts/chips |
| Times used Search M.P.A. | Possible | 0 required | Entity links |
| Times used AI | Optional | Optional (operational labels) | Partner, not required |

## Targets (align DPX-001 Amendment C where applicable)

| Moment | Budget | Result |
| --- | --- | --- |
| Find resident (within path) | &lt; 5 s | Pass — Property → Residents / entity link |
| Assign vendor (S7 focus) | Prefer &lt; 60 s including open WO | Pass — on-page assign/reassign |
| Full path S1→S10 | Continuous feel | Pass — local certification 2026-07-21 |

## Certification notes

- Lease / charge: **Continue** chips (Return to Resident/Property, Message, Maintenance/Documents/Lease).
- Dashboard: Command glance (Needs attention / Overdue / Needs approval / Changed today); non-priority blocks disclosed.
- AI: operational labels (e.g. “What should I handle first today?”, “What's open at …?”, “Summarize … account”, “Next step for WO-…”).
- Shell: no hydration error text observed after server-seeded permissions + sidebar cookie.
