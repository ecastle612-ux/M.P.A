# DX-004 — Operating System Vision

**Status:** Draft — Ready for Approval  
**Aligns with:** [Zero Learning Goal](../21-experience-architecture/zero-learning-goal.md) · [Experience Principles](../21-experience-architecture/experience-principles.md)

---

## 2. Operating System Vision

### The metaphor (precise)

M.P.A. is not a website with modules. It is the **control plane** for a portfolio:

| OS concept | M.P.A. surface |
| --- | --- |
| Desktop / home | **Today’s Work** (Operations Center) |
| Spotlight / Start | **Universal Command Palette** (⌘K) |
| New document | **Global Quick Add** (+) |
| Finder preview | **Right-side Quick Inspector** |
| Multi-select | **Bulk Operations** on lists |
| Notifications | Notification Center + attention queue |
| Apps | Existing modules (Properties, Residents, …) — opened only when depth is required |

Managers should spend most of the day in **Today’s Work + Inspector + Palette**, dipping into full pages only for rare depth (migration review, statement generation, complex lease edits).

### The 5-Minute Rule (normative)

> A **common job** is completable in **≤ 5 minutes** by a new staff member who has never seen training docs, using only on-screen labels and Next Best Action.

**Common jobs** (must pass):

1. Clear morning attention (top 5 due items)  
2. Record a resident payment  
3. Create + assign a work order  
4. Approve applicant → start move-in  
5. Publish a property announcement  
6. Start guided move-in for a vacant unit  
7. Find any resident/unit/WO by name and update status  
8. Invite a teammate  

**Exempt from 5 minutes** (still must be guided, not opaque):

- Full portfolio migration import  
- First-time org setup  
- Complex owner statement packages  
- Multi-party legal disputes  

### Interrupted-user design laws

1. **Resume without archaeology** — Today’s Work remembers what was due; Inspector does not require re-opening a detail route.  
2. **One primary action per card** — Context Actions answer “what next?”  
3. **Creates never require hunting a module** — Quick Add + Palette.  
4. **Phone parity for triage** — Today’s Work + Inspector usable at 390px; depth pages may degrade gracefully.  
5. **AI suggests; humans commit** — especially money, access, lease activation.  

### What we refuse

- A second “mobile app IA” that diverges from desktop  
- Infinite home-screen widgets that recreate AppFolio density  
- Auto-running destructive bulk actions  
- Replacing guided Move in with a single mega-form “for speed”  

### Relationship to page modules

Modules remain the **system of record UI**. The OS layer is the **system of action UI**.  
DX-004 does not delete `/tenants` or `/maintenance`; it makes them secondary for daily volume work.
