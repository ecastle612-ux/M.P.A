# Recommendations Before Implementation

**Status:** Required review before UI/component implementation  
**Phases blocked:** UI primitives, portal shells, feature builds — until Phase 1.5 **and** 1.6 are approved

---

## P0 — Approve These First

### 1. Experience Principles (1–18)
Treat as permanent law alongside the six-goal product filter.  
**Action:** Explicit approval of [experience-principles.md](./experience-principles.md).

### 2. Role emotional promises
Confirm the four promises:

| Role | Promise |
|------|---------|
| PM | Ahead — knows what matters |
| Tenant | Home explains itself |
| Owner | Investment is visible and protected |
| Vendor | Easy to accept, complete, get paid |

### 3. Urgency without anxiety standard
Adopt the calm urgency model in the Emotional Design Guide as mandatory for notifications and queue design.

### 4. First-five exit criteria
Agree that each role’s first session must lower or hold stress — never raise it — and deliver one meaningful win.

### 5. Canopy + Experience dual gate
Reaffirm: **Canopy (1.5) + Experience Architecture (1.6)** both approved before any UI component code (Implementation Gate / ADR-012).

---

## P1 — Define Before Foundation UI Sprint

### 6. Attention taxonomy for PM Console
Finalize which event classes enter the Attention Queue vs stay in area pages only (rent, vendor, leasing, compliance, messages).  
**Why:** Emotional “ahead” feeling depends on correct inclusion rules.

### 7. Notification emotional budget
Cap non-critical pushes; define quiet hours defaults per role.  
**Why:** Notification abuse destroys the trust Phase 1.6 requires.

### 8. Empty-state & failure copy bank
Write approved voice lines for top 20 empty/error states before components ship.  
**Why:** Engineers will otherwise invent tone.

### 9. AI emotional contract in UI copy
Standard phrases: “Suggested”, “Draft”, “Based on…”, Accept / Edit / Dismiss — no anthropomorphic overclaim.

### 10. Cross-role message preview
When PM sends tenant-facing text, show “Tenant will see:” preview.  
**Why:** Protects respect principle across planes.

---

## P2 — Early Production

### 11. Experience QA checklist in PR template
Add: orientation, next step visible, urgency calm, success quiet, error teaches, wait explained.

### 12. First-five usability reviews
Before public launch, run 4 sessions (one per role) scored against First Five exit criteria.

### 13. Stress delta metric (qualitative)
After dogfooding: “Do you feel more or less behind than before opening M.P.A.?” Track weekly in early orgs.

---

## Explicitly Rejected

| Idea | Why |
|------|-----|
| Gamification badges for PMs | Wrong emotion (play) for professional stress reduction |
| Aggressive overdue shaming for tenants | Destroys respect; increases conflict |
| Identical first-run for all roles | Breaks emotional journeys |
| Implementing UI from Canopy alone | Looks right, may still feel wrong |
| Feature tours as primary teaching | Violates zero-learning / dignity |

---

## Dependency Map

```
Phase 1.5 Canopy (visual)     ──┐
                                ├──► Foundation UI allowed
Phase 1.6 Experience (feeling)──┘
```

Architecture (Phase 1) is already approved.  
Neither Canopy nor Experience alone is sufficient for implementation.

---

## Approval Checklist

- [ ] Experience Architecture index reviewed
- [ ] Experience Principles approved
- [ ] Emotional Design Guide approved
- [ ] Role Journeys approved
- [ ] First Five Minutes approved
- [ ] Micro Interaction Philosophy approved
- [ ] P0 recommendations accepted
- [ ] Canopy (1.5) approved or explicitly sequenced immediately prior

**Gate owner:** Lead Software Architect / UX Architect / Product  
**Next after approval:** Still no business features — Foundation may implement tokens/shells only against approved Canopy + Experience.

---

## Related

- [Implementation Gate](../00-governance/implementation-gate.md)
- [06 Improvements Before Implementation](../06-design-language/improvements-before-implementation.md)
- ADR-012
