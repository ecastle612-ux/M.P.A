# ADR-034: Facility Public Work Request Intake (Custom Forms + QR / Link)

## Status
Accepted

## Date
2026-08-17

## Accepted
2026-08-18 — Owner approved docs/204 + ADR-034 for implementation. In-repo certification: `docs/205`. Do not apply or deploy from this ADR.

## Context

M.P.A. is live and certified through docs/203. Facility Operations already runs corrective work on the shared `maintenance_work_orders` table (`work_surface = facility`, ADR-020). Staff create work internally at `/facility/operations`. There is no public Facility request portal, no QR / share-link intake, and no per-facility form builder.

Owner product direction: each organization / facility must control what requesters provide. Requests arrive by QR code or shareable link through one secure portal. A requester must not need an M.P.A. paid account merely to report a broken chair (Contact Required). Internal work-order fields must stay hidden from the public.

This is a new **public write** surface and a new form-versioning model. It is Facility Operations (and Complete when the member has effective FO access) only. It is not Property Manager residential maintenance.

Authoritative design: `docs/204-facility-custom-work-request-forms/`.

## Decision

1. **One operational record.** A valid public submit creates a facility work order in `submitted` immediately. Do not introduce an accept/convert request queue. Do not invent a second work-order system.

2. **Immutable intake receipt.** Persist `facility_request_submissions` (and published `facility_request_form_versions`) so form edits never corrupt historical requests. The snapshot is not a parallel staff queue.

3. **Custom forms, not one sheet.** Multiple forms per organization. Standard fields plus Phase 1 custom types (short text, long text, select, yes/no, number, date). Each field is Required / Optional / Hidden. Image and video remain MEDIA-001 standard attachments, not arbitrary custom types. Server validation enforces the published version.

4. **Tokenized public portal.** Share link and QR encode the same HTTPS URL `/request/{public-token}`. Tokens are high-entropy; only hashes are stored. The server resolves organization, form, version, and context. The browser never chooses `organization_id`.

5. **Contextual QR on demand.** Intakes may lock building / floor / department / room / asset display values. Do not auto-generate a code per room or asset. Ordinary form edits do not rotate tokens.

6. **Phase 1 access.** Contact Required (default) and Authenticated Only. Anonymous / Contact Optional is deferred because this is a new public write endpoint.

7. **MEDIA-001 extension, not a new vault.** Public upload uses short-lived intake-scoped grants, private bucket, signed URLs, existing MIME/size limits. Rebind to the work order on submit. Requesters cannot list org media.

8. **Reuse notifications.** Add `work_order.public_submitted` on `maintenance_notifications` / `notifyLifecycle()`. Do not create a notification engine. Do not route into `comms_notifications`.

9. **RBAC.** New entitlement `facility.request_forms` for FO-effective manager-class members (`organization_admin`, `property_manager`). Technicians work resulting work orders through existing `facility.operations` and must not administer forms. Complete PM-only members remain denied (ADR-033 / docs/202).

10. **Product boundary.** Facility Operations and Complete-in-FO-scope only. No PM residential intake in this ADR.

## Consequences

**Easier:** Facilities publish the sheet they actually need. Wendy-style QR intake lands in the existing Operations queue without retyping. History survives form edits. Public tenancy stays server-owned.

**More difficult:** A public write path needs rate limits, idempotency, revoked-token behavior, and a narrow MEDIA grant model. Floor / department / room are labels in Phase 1, not new registries. Create-time staff notification is new (internal create stays quiet).

## Alternatives Considered

- **Accept/convert work_request then work order:** Rejected — duplicate operational records and staff re-entry.
- **Pure work order with JSON in description:** Rejected — form versioning and custom fields would corrupt or become unreadable.
- **Hard-coded universal sheet:** Rejected by Owner — facilities do not share one field set.
- **Anonymous Phase 1:** Rejected as default — abuse risk on a new public endpoint.
- **New notification engine or comms_notifications:** Rejected — reuse the certified maintenance notification path.
- **Public media bucket / public file URLs:** Rejected — violates ADR-023.
- **Auto-QR every room/asset:** Rejected — noisy, unrevokable sprawl.
- **PM residential public forms in the same package:** Rejected — different product; needs a later Owner decision.

## Related

- [docs/204](../204-facility-custom-work-request-forms/index.md)
- ADR-012, ADR-019, ADR-020, ADR-023, ADR-026, ADR-033
