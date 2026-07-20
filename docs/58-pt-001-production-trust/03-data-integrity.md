# Data Integrity Report

## Audit

`runDataIntegrityAudit(organizationId)` + `GET /api/trust/integrity`

Detects (org-scoped):

| Issue | Severity |
| --- | --- |
| Units without property | error |
| Residents without unit | warning |
| Leases without resident / unit | error |
| Leases missing rent / dates | warning |
| Payments without charge | warning |
| Work orders without property | warning |
| Messages without thread | error |
| Duplicate resident emails | warning |
| Active lease on vacant unit | error |

Each issue includes human recovery guidance.

## Verification

- Unit harness + API wired
- Org-level run requires authenticated session (not executed against a live org in this CLI pass)

## Gaps

- Broken media/document storage object references (orphan GC) still future work
- Applicant / notification / timeline deep graph checks not exhaustive
- No automated nightly integrity job in CI yet (recommend scheduling via QA nightly)
