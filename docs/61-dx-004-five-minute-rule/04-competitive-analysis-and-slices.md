# DX-004 — Competitive Analysis & Implementation Slices

**Status:** Draft — Ready for Approval  
**Constraint:** Do not copy competitor UI. Prefer guided jobs + OS surfaces.

---

## 14. Competitive analysis

Persona lens: 500-unit PM, interrupted, laptop + phone. Comparison is **time-to-clear common jobs**, not feature checklist parity.

| Competitor | Strength | Weakness (speed) | M.P.A. preference (why faster/easier) |
| --- | --- | --- | --- |
| **AppFolio** | Dense ops home; familiar to many PMs | High training tax; widget noise; mobile often “lite” of desktop | **Today’s Work** without mosaic overload; guided Move in instead of tribal form sequences |
| **Buildium** | Clear accounting mental model | Module hopping for maintenance + residents; creates feel like back-office forms | **Quick Add + Inspector** keep creates in the flow of attention |
| **Rent Manager** | Power-user depth; reports | Steep IA; keyboard power unevenly documented | **Universal Palette** makes power available on day one without “Rental Manager school” |
| **Propertyware** | Portfolio ops for multifamily | Heavy screens; slow interrupt recovery | **Inspector + Context Actions** — act without re-opening deep records |
| **DoorLoop** | Modern UI; onboarding polish | Still page-collection under the chrome; AI often decorative | **Next Best Action** tied to real due work + human confirm on money/leases |

### Where M.P.A. can be *noticeably* faster

1. **Interrupt recovery** — Today’s Work + Inspector beat “which tab was I on?”  
2. **Creates** — Global Quick Add vs sidebar archaeology  
3. **Lifecycle** — WF-003 guided Move in/out vs multi-form tribal knowledge  
4. **Search → act** — Palette runs actions, not only navigation  
5. **Mobile triage** — same OS grammar as desktop (sheet Inspector), not a second IA  

### What we refuse to copy

- AppFolio-style home full of competing widgets  
- DoorLoop-style marketing AI that doesn’t bind to due work  
- Rent Manager density as the default for new staff  

### Preference statement (partner-facing)

> M.P.A. is preferred when the operator’s day is interruptions: clear what’s due, act without leaving the list, create without hunting modules, and finish common jobs in under five minutes — with AI that suggests, never silently commits money or leases.

---

## 15. Implementation slices (post-Approve only)

**Sequencing:** Approve DX-003 + DX-004 → implement **DX-003 P0** first → then DX-004 OS slices.

| Slice | Scope | Depends on | Outcome |
| --- | --- | --- | --- |
| **OS-A** | Today’s Work v1 on Ops Center (due/overdue buckets + Context Actions) | DX-003 attention Resolve wiring | Morning clear ≤5 min |
| **OS-B** | Global Quick Add (+ / ⌘N) for WO, Payment, Applicant, Announcement | DX-003 one-shot payment / WO paths | Creates without module hunt |
| **OS-C** | Universal Palette actions mode (creates + lifecycle + settings) | Existing ⌘K search | Search → run, not only go |
| **OS-D** | Right-side Inspector (lists: Maintenance, Applicants, Residents, Charges) | List row model | Assign/complete/decide without `/edit` |
| **OS-E** | Bulk ops on Maintenance + Charges (select → assign/status/export) | Residents bulk grammar | Multi-unit morning batch |
| **OS-F** | Keyboard plan + `?` cheatsheet + shortcut collision fix | OS-C | Power without training |
| **OS-G** | Next Best Action (suggestions only) on Today’s Work + Inspector | OS-A, telemetry hooks | Assistive prioritization |
| **OS-H** | Mobile sheet Inspector + FAB Quick Add parity | OS-B, OS-D | Phone triage between calls |

### Explicitly out of first Approve scope

- Replacing guided Move in with a single mega-form  
- Auto-posting payments / auto-approving applicants  
- Native mobile apps  
- Full Documents hub redesign (Inspector attachments only in v1)

### Definition of done (package)

- ≥85% of common jobs in §3 of [02](./02-five-minute-audit-and-screens.md) pass the 5-Minute Rule in partner walkthrough  
- Zero Learning Goal still holds for money/lease mutations (confirm required)

---

## Approval checklist

- [ ] Product agrees OS metaphor (Today’s Work as home, modules as depth)  
- [ ] DX-003 P0 sequencing accepted before OS-A…H  
- [ ] AI guardrails accepted (suggest ≠ commit)  
- [ ] Competitive differentiation language accepted for Design Partners  
- [ ] **Approve** recorded → Implement unblocked for sliced scope only  
