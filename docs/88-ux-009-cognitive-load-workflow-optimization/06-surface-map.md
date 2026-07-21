# 06 — Surface Map

**Package:** UX-009  
**Legend:** P1 header · TB toolbelt · PD progressive disclosure · ES empty state · AI float (shell) · SR search

---

| ID | Surface | Patterns | Notes |
| --- | --- | --- | --- |
| S1 | App shell | AI, SR | Floating AI + search expansion; coordinate with UX-008 ＋ New offsets |
| S2 | Dashboard | P1, PD, ES | Adaptive priorities above fold; relocate embedded AI |
| S3 | Properties list | P1, ES, SR | Tighten filters behind disclosure on mobile |
| S4 | Property detail | P1, TB, PD, ES | Toolbelt per audit; section chips if still tall |
| S5 | Units list/detail | P1, TB, PD, ES | |
| S6 | Residents list/detail | P1, TB, PD, ES | Toolbelt: Message · Collect Rent · Maintenance · Lease · More |
| S7 | Applicants list/detail | P1, TB, PD, ES | |
| S8 | Maintenance list | P1, ES, SR | |
| S9 | Work order detail | P1, TB, PD, ES | Toolbelt: Assign · Complete · Timeline · Photos · More |
| S10 | Messages / communications | P1, ES | Unread-first |
| S11 | Accounting / financials | P1, PD, ES | Primary money actions first |
| S12 | Reports | P1, ES | Generate path obvious in 3s |
| S13 | Settings | P1, ES | Clear section purpose |
| S14 | Vendors / leases detail | P1, TB, PD, ES | As audit |
| S15 | AI Ops route | PD | Power-user full library; not required for daily entry |

## Implementation order (post-Approve)

1. Shell: floating AI + toolbelt primitive + empty-state primitive  
2. Entity details: Property, Resident, Work Order (highest hunt cost)  
3. Dashboard adaptive layout  
4. Lists + empty states  
5. Search entity expansion  
6. Remaining surfaces + mobile pass  
7. Before/after screenshots + scroll metrics → certification

## Measurement (per surface)

| Metric | Capture |
| --- | --- |
| Mobile scroll height (px) / screenfuls | Before/after at 390×844 |
| Primary action visibility | Above fold? Y/N |
| Tap count for top 3 tasks | Before/after script |
| Screenshot | `artifacts/before|after/<surface>.png` |
