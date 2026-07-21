# 15 — Baseline Workflow Map (Phase 1)

**Package:** DPX-002  
**Captured:** 2026-07-21  
**Environment:** Local `localhost:3000` · viewport **390×844** (mobile) · org Canopy Property Partners  
**Method:** Live walk + code path analysis. **No optimization in this phase.**  
**Status:** Baseline complete — implementation may begin on P0 only after this package + friction register are filed.

---

## Path status (live)

| Step | Goal | Result |
| --- | --- | --- |
| S1 | Dashboard / priorities | ✅ Loads; priorities + Resolve CTAs visible |
| S2 | Find property | ✅ List loads; 2 properties |
| S3 | Open property | ❌ **Crash** — `buildAiPageContext` called from server via client module |
| S4 | Open resident | ❌ Error boundary — “Unable to load tenant context” (plus same AI import risk) |
| S5–S7 | Lease / payment / maintenance create | ⛔ Blocked by S3/S4 |
| S8 | Open work order | ❌ **Same crash** as property |
| S9–S10 | Message / notify / return | ⛔ Blocked |

**Conclusion:** The certified daily path **cannot be completed end-to-end today**. Baseline still records what works, structural tap estimates from code, and every defect as friction.

---

## Workflow map (as-designed vs as-lived)

```
Dashboard ✅
  → Review priorities ✅ (Needs attention / Today's Work / Resolve)
  → Find Property ✅ (/properties or Search)
  → Open Property ❌ CRASH (server/client AI context)
  → Open Resident ❌ ERROR
  → Review Lease ⛔
  → Review Payment ⛔
  → Create Maintenance ⛔ (toolbelt exists in code; page unreachable)
  → Assign Vendor ❌ WO detail CRASH
  → Message Resident ⛔ (toolbelt → /communications — unscoped)
  → Notify Owner ⛔ (no in-context owner notify on path)
  → Return Dashboard ✅ (when reachable)
```

---

## Per-step baseline metrics

Viewport: 390×844. Times are **observed** where pages load; otherwise **structural estimates** from code (marked `est.`).

| Step | Screen | Primary goal | Primary action today | Time | Taps | Scroll (screenfuls) | Hesitation | Context switches | Repeated nav/search | Lost momentum |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S1 | `/dashboard` | See what needs action | Scan “Needs attention” / Resolve | ~8–15s | 0–1 | **1.5** (1272px) | Low — clear heading | 0 | 0 | No |
| S1→S2 | | Find a property | Menu or link “Total Properties” / Search | ~5–20s | 1–3 | — | Med — many competing CTAs | 1 | Possible Menu | Mild |
| S2 | `/properties` | Pick property | View | ~5–10s | 1 | ~1.2 est. | Low | 0 | Filters optional | Hydration error overlay (dev) |
| S3 | `/properties/[id]` | Open property | — | **FAIL** | — | — | **Hard stop** | — | Retry loops | **Yes** |
| S4 | `/tenants/[id]` | Open resident | — | **FAIL** | — | — | **Hard stop** | — | — | **Yes** |
| S5 | Lease | View status | Toolbelt Lease (code) | est. 2–4 taps from resident | est. 1–2 | est. 1+ | — | 1 module jump | — | — |
| S6 | Payment | See balance / collect | Toolbelt Collect Rent → financials | est. 2–5 | est. 1–3 | est. 1–2 | — | **Full module switch** | — | — |
| S7 | Create WO | New request | Toolbelt Maintenance → `/maintenance/new` | est. 3–8 | est. 2–6 | form scroll | — | 1 | — | Form friction TBD |
| S8 | Assign vendor | Assign on WO | Toolbelt Assign Vendor `#vendor` | **FAIL** on open | — | — | Hard stop | — | — | **Yes** |
| S9 | Message | Contact resident | Toolbelt Message → `/communications` | est. 3–10 | est. 2–6 | inbox hunt | **High** — not resident-scoped | **Module switch** | Search likely | **Yes** |
| S10 | Notify owner | Owner aware | Announcement path `/communications/new` | est. 5–15 | est. 3–8 | form | **High** — no “notify owner” on path | Module switch | — | **Yes** |
| S11 | Dashboard | Return | Logo / Menu / breadcrumb | est. 1–2 | 1–2 | — | Low | 1 | — | — |

### Path totals (partial — only completable prefix)

| Metric | Observed (S1–S2) | Blocked remainder |
| --- | --- | --- |
| Time | ~15–35s to property list | Cannot finish |
| Taps | ~2–4 | — |
| Scroll | ~2.5–3 screenfuls | — |
| Hard stops | 0 | **3+ detail crashes/errors** |

---

## Code-backed next actions already present (when pages load)

| Surface | Toolbelt / attention (code) |
| --- | --- |
| Resident | Message · Collect Rent · Maintenance · Lease + attention line |
| Property | Add Unit · Add Resident · Work Order · Report + attention |
| WO | Assign Vendor · Complete · Timeline · Photos |
| Dashboard | Priorities + Resolve · disclosure for analytics |

---

## Evidence notes

- Dashboard scrollHeight **1272** / clientHeight **844** → **1.5** screenfuls.  
- AI launcher on dashboard: “AI assistant loading” then available; on lists shows entity-ish labels even on list routes (context drift).  
- Default maintenance filter “Open work orders” showed **0** while dashboard showed 3 waiting-resident WOs — filter mismatch.  
- Dev hydration error: `sidebar.tsx` (noisy; may not ship to prod identically).
