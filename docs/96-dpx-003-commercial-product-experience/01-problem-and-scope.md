# 01 — Problem and Scope

**Package:** DPX-003  
**Status:** Draft — awaiting Approve

---

## Problem

Manual testing shows M.P.A. is powerful but not yet *commercial*:

| Symptom | Impact |
| --- | --- |
| Pages feel cluttered | Cognitive load; hesitation; distrust |
| Empty widgets / bubbles / cards | Looks unfinished / broken |
| Tenant dashboard not communication-first | Residents miss what management said |
| Push delivery unproven on real devices | Launch-critical gap |
| Theme flips light/dark during navigation | Severity 1 — trust destruction |
| Inconsistent spacing / patterns | Feels like mini-apps, not one product |
| Mobile scroll / overlap / thumb reach | Field use friction |
| AI still risks generic starters | Not an operational partner |

## Goal

Design Partner–ready **premium commercial product experience** on the existing stack.

## Surface allowlist

Existing authenticated surfaces only (PM, owner, resident/tenant portal, vendor where already present):

- Shell (sidebar, drawer, theme, floating AI, search)  
- Operations Center / dashboards  
- Property · Resident · Lease · Financials · Maintenance · Communications  
- Tenant / resident portal dashboard and related portal pages  
- Push / OneSignal registration + notification tap paths already in product  

## In scope

Polish, hierarchy, empty states, tenant IA, push certification + fixes, theme stability, visual consistency, mobile comfort, AI context/suggestions — **on existing pages and systems**.

## Out of scope

| Forbidden | Why |
| --- | --- |
| New modules / nav / architecture | Scope lock |
| Leasing day (Applicant → Move-in) as primary sprint | Deferred — see [12](./12-roadmap-amendment.md) |
| New notification channels / providers | Certify OneSignal path already chosen |
| Visual redesign for novelty | Canopy + existing patterns; calm, not reinvent |

## Dependency

[DPX-002](../93-dpx-002-complete-daily-workflow/README.md) = **PASS**. Do not regress the gold-standard PM daily path while decluttering.
