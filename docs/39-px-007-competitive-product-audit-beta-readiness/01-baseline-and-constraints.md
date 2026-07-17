# PX-007.01 — Baseline & Constraints

**Status:** Draft

---

## PX-006 baseline (locked)

PX-007 evaluates M.P.A. **as it exists after PX-006**. The following patterns are intentional and should not be “redesigned” without defect evidence:

### Workflow & onboarding
- `/setup` wizard with skippable invite step
- `SetupGate` redirect for incomplete portfolios
- `WorkflowSuccessPanel` / `WorkflowSuccessBanner` on create flows
- `PortfolioSetupHealth` on Operations Center (client-safe; fetches `/api/setup/status`)

### Workspace & layout
- `AppPage` / `mpa-page-wide` (90–95% desktop utilization)
- `CreatePageLayout` (2fr form + 1fr context rail)
- `DetailPageLayout` + module context rails
- `ListWorkspaceHeader` + `DataTableLayout` on list pages

### Human experience
- `lib/experience/empty-states.ts` — educational empty surfaces
- `lib/experience/guidance-tips.ts` — contextual tips
- `lib/experience/context-rail-empty.ts` — human empty copy in rails
- Progressive disclosure (hide empty analytics; show onboarding)

### Architecture
- `lib/workflow/server/` — server-only portfolio counts
- `lib/workflow/shared/` — pure helpers safe for client
- Client components must not transitively import `auth/server.ts` or `next/headers`

---

## Defect vs. preference

| Type | Action in PX-007 |
|------|------------------|
| **Defect** | Broken flow, regression, accessibility failure, misleading copy, layout break at breakpoint | Log in remediation backlog; fix after approval |
| **Preference** | “I would style this differently” | **Reject** unless tied to measurable problem |
| **Competitive gap** | Missing capability competitors have | Document in gap analysis; **do not** fake with UI — route to PRR/phase work |
| **Polish opportunity** | Real hierarchy/readability issue with evidence | Remediation candidate |

---

## Forbidden during PX-007 audit

- Reverting or rewriting PX-006 components for aesthetic variety
- Adding features disguised as “UX improvements”
- Schema, API, RLS, or permission changes under audit banner
- Side-by-side mockups that replace working flows without approval

---

## Allowed during PX-007 audit

- Documenting gaps honestly
- Screenshot capture at defined breakpoints
- Measuring click counts on critical workflows
- Accessibility checks (contrast, focus, touch targets)
- Beta cohort scoping (who M.P.A. serves today)
- Problem-driven micro-fixes **only after** item appears on approved remediation backlog
