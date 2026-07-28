# 16 — Slice A Implementation Notes

**Package:** SIGN-002  
**Status:** Slice A complete — stop for review before Slice B  
**Date:** 2026-07-27  

---

## Authorization

SIGN-002 approved as the governing design package for electronic signature workflow integrations (extends API-004 + ADR-030).  
**Slice A authorized and implemented.** Facility Operations (Slice B) is **not** started.

---

## Business workflows implemented

| ID | Workflow | `document_type` / kind | Surface | Auto-advance on complete |
|----|----------|------------------------|---------|--------------------------|
| A1 | Lease Agreement | `lease_agreement` | Lease + Applicant | Lease → `signed` |
| A2 | Lease Renewal | `lease_renewal` | Lease | End date + `renewal_status=renewed` |
| A3 | Owner Management Agreement | `owner_agreement` | Property (owner contact) | Property metadata `ownerAgreementStatus=executed` |
| A4 | Move-In Acknowledgement | `move_in_form` | Lease + move-in wizard | Checklist + finalize pending move-in |
| A5 | Move-Out Acknowledgement | `general_pdf` + `kind=move_out_ack` | Lease + move-out wizard | Checklist metadata; blocks move-out complete when required |

Shared UX lifecycle labels: Draft → Pending Signature → Viewed → Awaiting Others → Completed → Declined → Expired → Voided → Archived.

---

## Files modified / added (application)

### Added

- `apps/web/src/lib/signature/lifecycle.ts` (+ `lifecycle.test.ts`)
- `apps/web/src/lib/signature/templates.ts`
- `apps/web/src/lib/signature/workflow-advance.ts` (+ `workflow-advance.test.ts`)
- `apps/web/src/lib/signature/settings.ts`
- `docs/116-sign-002-electronic-signature-workflow-integrations/16-slice-a-implementation-notes.md`

### Modified (selected)

- `apps/web/src/lib/signature/server.ts` — property/tenant/kind create + list filters; vault entity paths; call `advanceBusinessWorkflowAfterSignature`
- `apps/web/src/lib/signature/contracts.ts` — `propertyId`, `tenantId`, `kind`, `metadata` on create input
- `apps/web/src/lib/signature/document-generation.ts` — template resolution by type/kind
- `apps/web/src/app/api/signatures/route.ts` — filters + create fields
- `apps/web/src/components/signature/signature-package-panel.tsx` — configurable document type/kind + lifecycle badges
- `apps/web/src/app/(app)/leases/[leaseId]/page.tsx` — A1/A2/A4/A5 panels
- `apps/web/src/app/(app)/properties/[propertyId]/page.tsx` — A3 panel
- `apps/web/src/app/(app)/applicants/[applicantId]/page.tsx` — explicit lease_agreement panel
- `apps/web/src/lib/resident-lifecycle/*` — acknowledgement checklist + gates
- `apps/web/src/components/resident-lifecycle/move-in-wizard.tsx` / `move-out-wizard.tsx`

---

## Database changes

**None.** Reused existing API-004 tables (`signature_requests`, recipients, documents, audit) and `organization_signature_settings.metadata` for:

- `move_in_acknowledgement_required` (default **true**)
- `move_out_acknowledgement_required` (default **true**)

Existing columns `pm_countersign`, `owner_required` continue to drive countersign behavior.

---

## APIs updated

| Endpoint | Change |
|----------|--------|
| `GET /api/signatures` | `propertyId`, `tenantId`, `documentType`, `kind` filters; returns `metadata` |
| `POST /api/signatures` | Accepts `propertyId`, `tenantId`, `kind`, `documentType` |
| `GET /api/signatures/:id` | Unchanged shape; exposes recipients `isRequired` + package metadata for lifecycle |
| Move-in / move-out lifecycle APIs | Acknowledgement required semantics |

Webhook / provider APIs unchanged (SignWell remains sole V1.0 provider per ADR-030).

---

## Notifications

**Reused** existing signature notification paths via `notify` / API-001 (invite, remind, complete, decline). No new notification product. Slice A workflows inherit package-level events already wired in SignatureService.

---

## Audit events

**Reused** `signature_audit_events` + existing package/recipient audit writers. Business advance records originating-entity metadata (`renewalSignaturePackageId`, `ownerAgreementPackageId`, move-in/out acknowledgement package ids). No parallel audit subsystem.

---

## Reports

**Reused** `getSignatureOpsSnapshot` (outstanding / completed today / expired / vault / failures). No new reporting engine. Module filters compose `document_type` + `metadata.kind` for Slice A lists. Cross-module widgets remain Slice D.

---

## Automated tests

- `apps/web/src/lib/signature/lifecycle.test.ts` — UX labels + templates + settings defaults
- `apps/web/src/lib/signature/workflow-advance.test.ts` — A1–A5 advance hooks
- Existing provider / contracts tests remain authoritative for API-004 platform

---

## Remaining work before Slice B

1. **Review Slice A** against [13 — Acceptance checklist](./13-acceptance-checklist.md) A1–A5 (manual E2E with SignWell sandbox / simulate).
2. Confirm org settings UX for `move_in_acknowledgement_required` / `move_out_acknowledgement_required` (currently metadata defaults; admin UI optional).
3. Optional hardening: gate manual lease `renew` mutation when a renewal package is outstanding (completion path already advances via workflow).
4. Owner portal Documents surface for executed `owner_agreement` (OWNER-001) if not already visible via vault entity links.
5. Explicitly **authorize Slice B** only after this review — do not implement vendor / WO / inspection signature gates until then.

---

## Stop line

**Do not begin Facility Operations integrations (Slice B) until Slice A has been reviewed.**
