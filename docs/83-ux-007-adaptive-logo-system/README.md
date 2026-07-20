# UX-007 - Adaptive Logo System

**Initiative ID:** UX-007  
**Status:** **Completed · Production Ready**  
**Scope:** Brand asset policy + reusable runtime selection system (no business logic changes)

---

## Decision intent

M.P.A. now has two approved logo assets and only these assets are allowed:

- `apps/web/public/branding/logo-light.png` (use on dark backgrounds)
- `apps/web/public/branding/logo-dark.png` (use on light backgrounds)

Runtime URLs:

- `/branding/logo-light.png`
- `/branding/logo-dark.png`

## Goal

Create one reusable branding system that selects the correct logo automatically by surface/background context across:

- App shell (sidebar, nav, headers, dialogs, loading, auth)
- Portal surfaces
- Marketing/public pages
- Email templates
- PDF documents
- Any future UI surface

## Non-goals

- No redesign of logo artwork
- No business workflow changes
- No auth/permissions/schema changes
- No one-off manual per-page swaps as final architecture

## Permanent implementation requirement

Any new page, feature, email template, PDF, or marketing surface must use the centralized adaptive logo component/system.

Direct imports of logo image files outside the branding system are prohibited unless explicitly approved in a future ADR.

## Package documents

| Doc | Purpose |
| --- | --- |
| [01-context-and-problem.md](./01-context-and-problem.md) | Why current logo usage must be replaced |
| [02-system-spec.md](./02-system-spec.md) | Reusable adaptive logo architecture |
| [03-surface-adoption-map.md](./03-surface-adoption-map.md) | Surface-by-surface tone source and ownership |
| [04-certification-plan.md](./04-certification-plan.md) | Production certification criteria and FAIL gates |
| [05-approval.md](./05-approval.md) | Gate sign-off checklist |
| [06-migration-report.md](./06-migration-report.md) | Implementation migration and certification evidence |
| [07-visual-certification-report.md](./07-visual-certification-report.md) | Final running-app visual QA pass and remaining blockers |
| [08-production-asset-404-audit.md](./08-production-asset-404-audit.md) | Root-cause audit and fix evidence for production logo 404s |
| [09-release-completion-summary.md](./09-release-completion-summary.md) | Final source-control, validation, deployment, and Production Ready closure |

## Approval record

- Approved command: `APPROVE UX-007`
- Effective date: 2026-07-20

## Completion record

- Implementation: **Complete**
- Migration: **Complete**
- Visual certification: **Complete**
- Production asset validation: **Complete**
- Source control validation: **Complete**
- ADR status: **ADR-019 implemented and operational**
- Final status: **UX-007 Completed and Production Ready**
