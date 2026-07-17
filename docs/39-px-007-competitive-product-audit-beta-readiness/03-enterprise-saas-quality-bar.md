# PX-007.03 — Enterprise SaaS Quality Bar

**Status:** Draft

---

## Reference products

M.P.A. should feel like software built in the **2020s enterprise SaaS** tradition — not legacy property management UI with a fresh coat of paint.

| Reference | What to borrow (not copy) |
|-----------|---------------------------|
| **Linear** | Information density, keyboard affordances, calm hierarchy, purposeful motion |
| **Stripe** | Clarity of money flows, trustworthy empty/error states, precise typography |
| **Notion** | Progressive disclosure, contextual side panels, approachable empty surfaces |
| **Ramp** | Operational dashboards that prioritize **actions** over charts |
| **Vercel** | Responsive layout discipline, consistent spacing system, dark/light polish |

This is a **craft bar**, separate from feature parity with AppFolio.

---

## Evaluation dimensions

Score **1–5** on observed M.P.A. behavior (post-PX-006 baseline):

### Visual & layout craft
- [ ] Consistent spacing rhythm (8px grid / token system)
- [ ] Typography hierarchy obvious within 5 seconds
- [ ] Desktop workspace utilization (not overly narrow)
- [ ] No accidental dead zones at 1280–1920px
- [ ] Cards and elevation used consistently

### Interaction craft
- [ ] Primary action obvious on every screen
- [ ] Success states guide next step (PX-006 — verify, don’t rewrite)
- [ ] Loading states present; no layout jump
- [ ] Forms: labels, errors, focus order
- [ ] Tables: scannable density; responsive collapse

### Workflow craft
- [ ] Create flows feel continuous (not “save → lost”)
- [ ] Context rails add information, not noise
- [ ] Command palette / search useful (where implemented)
- [ ] Breadcrumbs match mental model

### Trust & professionalism
- [ ] Copy sounds human, not database-generated
- [ ] Financial numbers formatted consistently
- [ ] Destructive actions confirmed
- [ ] Auth/session errors helpful

### Accessibility (minimum beta bar)
- [ ] Color contrast WCAG AA on primary text
- [ ] Focus visible on interactive elements
- [ ] Touch targets ≥ 44px on mobile primary actions
- [ ] Tables usable at 390px without horizontal scroll hell

---

## “Do not change” reminder

Meeting the enterprise bar **does not** mean adopting Linear’s sidebar or Stripe’s exact layout. It means:

- If M.P.A. already meets the criterion → **leave it**
- If a criterion fails → document **specific evidence** (screenshot, click count, contrast ratio)

---

## Craft vs. feature decision tree

```
Is the issue missing functionality?
  → Yes → Competitive gap / PRR / phase work (not PX-007 UI tweak)
  → No → Is there measurable UX harm?
           → Yes → Remediation backlog item
           → No → Do nothing
```
