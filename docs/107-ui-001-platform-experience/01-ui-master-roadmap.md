# 01 — UI-001 Master Roadmap

**Package:** UI-001 — Platform Experience Redesign  
**Status:** 🔮 **Future** · Blueprint only · Implement 🔒 **locked**  
**Date:** 2026-07-23  
**Parent:** [README](./README.md) · [00 Principles](./00-platform-design-principles.md) · [02 Research](./02-workflow-research.md) · [03 Constitution](./03-ui-constitution.md)  
**Sequencing:** Post–Commercial Launch (after CORE-002 → GA). Does **not** authorize code.

> **Documentation only.** No UI changes, screen modifications, or implementation are authorized by this roadmap.

---

## Purpose

This is the **master blueprint** for the complete post-launch platform experience redesign.

It turns Tenant Home–proven principles into a phased program that covers:

0. Workflow research (jobs before pixels)  
1. Shared design system discipline  
2. Navigation  
3. Every role’s home (“What do I need to do today?”)  
4. Core workflows (fewer clicks, fewer decisions)  
5. Visual / a11y polish  
6. Commercial UX certification  

**Binding philosophy:** [00 — Platform design principles](./00-platform-design-principles.md).  
**Phase 0 research:** [02 — Workflow research](./02-workflow-research.md).

---

## Preconditions (before any phase implements)

| Gate | Requirement |
|------|-------------|
| Commercial sequencing | CORE-002 blockers closed · GA policy allows UI-001 to open |
| **Phase 0** | Workflow research validated (or explicitly accepted as brief) before Phases 1–6 implement |
| Package status | Future → Design → Document → **Approve** (per phase or whole package) |
| Canopy | Remains approved; material token changes re-Approve Canopy if needed |
| Scope law | No new product modules invented “for redesign” — reshape existing surfaces |
| Spine | Does not displace FIN-003 / PUSH-001 / EP-019 while those are active |

---

## Roadmap phases

```
Phase 0  Workflow research
    ↓
Phase 1  Platform Design System
    ↓
Phase 2  Navigation Redesign
    ↓
Phase 3  Dashboard Redesign (all roles)
    ↓
Phase 4  Workflow Redesign
    ↓
Phase 5  Visual Polish
    ↓
Phase 6  Commercial UX Certification
```

### Phase 0 — Workflow research

**Goal:** Document real user jobs before redesigning the interface.

**Artifacts:**
- [02 — Workflow research](./02-workflow-research.md)
- [04 — Platform experience audit](./04-platform-experience-audit.md) (current-state scores & friction baseline)

**Exit criteria:** Role briefs complete; platform audit published; validation checklist started; Phase 4 job order informed by frequency × urgency.

---

**Default order is serial (0→6).** Limited parallelization is allowed only when:

- Phase 1 tokens/components are stable enough to consume, **and**  
- Work does not invent conflicting nav/dashboard patterns (Phases 2–3 stay ahead of deep workflow chrome in Phase 4).

---

### Phase 1 — Platform Design System

**Goal:** One shared visual and interaction language so later phases do not invent per-portal dialects.

| Workstream | Scope |
|------------|--------|
| Typography | Display / title / body / meta scale; greeting vs section hierarchy |
| Spacing | Vertical rhythm, section gaps, page margins (tokenized) |
| Cards | Radius, border, padding, elevated vs quiet; feed vs action vs Today |
| Buttons | Primary / secondary / ghost; one primary per screen rule |
| Icons | Single icon language, sizes, gaps (extend platform nav icons) |
| Motion | Enter / exit / reduced-motion policy (reuse Canopy / CSS tokens) |
| Colors | Semantic surfaces, feedback, brand emphasis; dark-mode parity plan |
| Forms | Field density, labels, errors, focus — consumer-calm |
| Tables | Density, mobile alternative (cards/lists), sticky headers |

**Exit criteria**

- Documented component/token map cited by Phases 2–5  
- Storybook or living examples optional; **Approve** required before broad adopt  
- No screen redesign yet beyond reference demos if Approve allows

**Depends on:** Canopy · Experience Architecture · principles in `00`

---

### Phase 2 — Navigation Redesign

**Goals:** Reduce clutter · Workflow-first · Progressive disclosure · Mobile-first · Consumer chrome

| Workstream | Scope |
|------------|--------|
| IA slim | Primary destinations ≤ role’s daily jobs; overflow → More |
| Consumer chrome | Quiet org/role selectors when single-context; “Home” not “X Portal” |
| Mobile | Bottom nav where role has stable primaries (Tenant/Owner patterns → PM/Vendor as fit) |
| Desktop | Side nav supportive, not competing with home content |
| Progressive disclosure | Nested routes keep parent active; no module sprawl on login |

**Exit criteria**

- Each role has a published primary vs More map  
- First-login chrome passes “consumer, not admin” review for single-context users  
- Navigation depth to primary job ≤ 1 hop from home (metric baseline)

**Depends on:** Phase 1 (icons, spacing, chrome tokens)

---

### Phase 3 — Dashboard Redesign

**Goal:** Every role home answers **“What do I need to do today?”**

| Portal | Home shape (apply hierarchy from principles) |
|--------|-----------------------------------------------|
| **Tenant** | Reference implementation — extend/certify, don’t regress |
| **Owner** | Portfolio attention + money/docs/messages jobs (align OWNER-001) |
| **Property Manager** | Ops queues / next best action — not module grid |
| **Vendor** | Today’s jobs / start–finish — field-first calm |
| **Administrator** | Severity-ordered health / resolve-now (ADMIN-003 Mission Control aligned) |

**Shared home stack**

```
Greeting / context
→ Needs attention
→ Quick actions (≤ 6, one primary)
→ Current work / Today (contentful only)
→ Everything else
```

**Exit criteria**

- First-impression audit ≥ **8.5** per portal home (Tenant method)  
- No home is a module directory  
- Empty states friendly and non-duplicative  

**Depends on:** Phases 1–2

---

### Phase 4 — Workflow Redesign

**Goal:** Reduce clicks, decisions, and clutter inside the jobs users actually run.

| Workflow | Focus |
|----------|--------|
| Maintenance | Create → track → complete with fewer screens/steps |
| Rent Payment | Tenant pay path clarity; receipt confidence |
| Messaging | Inbox → thread → reply without hunting |
| Documents | Find / open / download with honest empty states |
| Leasing | Applicant → lease path (when in commercial scope) |
| Inspections | Capture → review → close (compose with UX-010 when Approved) |
| Accounting | Manager/owner financial reads — clarity over density |
| Owner Experience | Statements, reports, messages as jobs not tabs soup |
| Vendor Experience | Token/QR job rail remains zero-friction; polish chrome only |

**Exit criteria**

- Top 3 jobs per role: measured **click reduction** and **time-to-complete** vs baseline  
- No new modules; reuse existing services/APIs  
- Primary action identifiable in ≤ 3 seconds on each critical step  

**Depends on:** Phases 1–3 (homes route into redesigned workflows)

---

### Phase 5 — Visual Polish

**Goal:** Premium finish without new product scope.

| Workstream | Scope |
|------------|--------|
| Animations | Subtle, tokenized; honor `prefers-reduced-motion` |
| Loading | Layout-stable skeletons matching final composition |
| Empty states | Varied friendly copy; consolidated calm |
| Errors | Soft, honest, recoverable — non-technical |
| Accessibility | Focus, contrast, SR labels, touch targets |
| Dark mode review | Parity pass against Canopy dark tokens |

**Exit criteria**

- A11y checklist pass on redesigned homes + top workflows  
- Loading/empty/error patterns consistent across portals  
- Dark mode: no broken contrast on primary surfaces  

**Depends on:** Phases 1–4 surfaces exist to polish

---

### Phase 6 — Commercial UX Certification

**Goal:** Prove the platform is commercially ready as an *experience*, not only as feature completeness.

**Evaluate every portal** on:

| Score dimension (1–10) |
|------------------------|
| Visual appeal |
| Ease of use |
| Workflow efficiency |
| Navigation |
| Accessibility |
| Consumer feel |
| Mobile |
| Commercial readiness |

**Exit criteria**

- Per-portal scorecard published  
- Overall commercial UX bar met (product-defined; suggested **≥ 8.5** average, no portal &lt; 7.5 on commercial readiness)  
- Open defects triaged; blockers fixed or explicitly waived  
- UI-001 marked **PASS** only after Product + Design sign-off  

**Depends on:** Phases 1–5 complete for in-scope portals

---

## Estimated implementation order

| Order | Phase | Est. relative effort* | Notes |
|------:|-------|----------------------|--------|
| 0 | Phase 0 — Workflow research | S–M | Docs + interviews; **required before implement** |
| 1 | Phase 1 — Design system | M | Unblocks everything; mostly docs + primitives |
| 2 | Phase 2 — Navigation | M | High first-impression ROI; job maps from Phase 0 |
| 3 | Phase 3 — Dashboards | L | Tenant reference; PM/Owner next per research |
| 4 | Phase 4 — Workflows | XL | Order from Phase 0 (message → maintenance → rent → …) |
| 5 | Phase 5 — Visual polish | M | Can overlap late Phase 4 per portal |
| 6 | Phase 6 — Certification | S–M | Evidence + fixes; job success defs from Phase 0 |

\*S/M/L/XL = relative only; calendar dates set at Approve.

### Suggested job-slice order inside Phase 4

Informed by [Phase 0 research](./02-workflow-research.md) (frequency × urgency):

1. Messaging (cross-role)  
2. Maintenance (PM + Tenant + Vendor)  
3. Rent payment (tenant)  
4. Documents (Tenant/Owner)  
5. Owner financial/docs experience  
6. Vendor job rail polish  
7. Leasing / inspections / accounting (as commercial priority allows)

---

## Success criteria (program-level)

| Metric | Target direction |
|--------|------------------|
| First impression (structured 1–10) | ≥ 8.5 per portal home |
| Workflow completion rate | Up vs pre–UI-001 baseline |
| Average clicks per top job | Down |
| Navigation depth to primary action | ≤ 1 from home |
| Time to complete common tasks | Down (role-specific SLAs at Approve) |
| Accessibility | No Sev-1 a11y defects on certified surfaces |
| Consumer feel / commercial readiness | Phase 6 scorecard pass |

Baselines captured **before** Phase 2 implement starts.

---

## Major risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Starting UI-001 before GA / money-out | Distracts commercial spine | Keep Status Future; freeze/master plan binding |
| Redesign invents new modules | Scope explosion | Principles + “no new modules” law |
| Phase 4 without Phase 1–2 | Inconsistent dialects | Serial default; no workflow chrome ahead of system/nav |
| Regressing Tenant Home | Lose proven 8.5-band feel | Tenant is reference; cert against regression |
| Ignoring mobile until end | Rework cost | Mobile-first in Phases 2–3 |
| Dark mode / a11y deferred forever | Failed Phase 6 | Phase 5 explicit; not optional polish |
| Parallel portal teams diverge | Broken consistency | Phase 1 SoT + design review gate |
| Confusing UI-001 Approve with FIN-003 | Governance failure | Separate packages; this roadmap never unlocks Stripe |

---

## Expected impact

| Area | Expected outcome |
|------|------------------|
| Residents | Faster “what now?” comprehension; fewer dead-end module hunts |
| Owners | Portfolio home that feels like an owner app, not a PM console |
| Property managers | Queue-first day; less cognitive load |
| Vendors | Field-calm job focus |
| Admins | Severity-first Mission Control, not catalog browsing |
| Commercial | Higher demo/conversion confidence; screenshot-ready portals |
| Engineering | Shared system reduces one-off CSS and duplicate nav patterns |
| Support | Fewer “where do I…?” tickets for primary jobs |

**Strategic impact:** Completes the arc from “feature-complete commercial platform” (CORE-002) to “premium experience platform” (UI-001) without changing custody, payments architecture, or RBAC models.

---

## Deliverable summary

| # | Item |
|---|------|
| 1 | **Phases 1–6** defined above |
| 2 | **Implementation order** — 1→2→3→4 (job-sliced)→5→6 |
| 3 | **Major risks** — sequencing, scope, consistency, regression |
| 4 | **Expected impact** — role clarity, commercial confidence, shared system |

---

## Related

- [00 — Platform design principles](./00-platform-design-principles.md)  
- [02 — Workflow research](./02-workflow-research.md)  
- [03 — UI Constitution](./03-ui-constitution.md)  
- [Commercial Launch Master Plan](../00-governance/commercial-launch-master-plan.md)  
- [DPX-003 Tenant home / audit](../96-dpx-003-commercial-product-experience/13-tenant-home-screen.md)  
- [Canopy](../06-design-language/index.md) · [Experience Architecture](../21-experience-architecture/index.md)
