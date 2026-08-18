# 205 — Facility Public Work Request Intake Implementation Certification

**Status:** **IMPLEMENTED IN-REPO** — Production released in [docs/206](../206-facility-public-work-request-production-release/index.md)  
**Date:** 2026-08-18  
**Authority:** Owner approval of [docs/204](../204-facility-custom-work-request-forms/index.md) + [ADR-034](../18-decision-log/adr-034-facility-public-work-request-intake.md)  
**Implement SHA:** `c3fc21bca11b6e8badc3da882fa208c8483cbec3`  
**Certification SHA:** recorded on the docs/205 commit of this branch  
**Successor:** [docs/206](../206-facility-public-work-request-production-release/index.md)  
**Production:** released — stamp `20260818011913` · app SHA `06164778` · see docs/206

---

## Verdict

Phase 1 Facility custom work request forms and QR/link intake is implemented in-repo and design-faithful.

A valid public submission creates **exactly one** canonical facility work order (`maintenance_work_orders`, `work_surface = facility`, `status = submitted`) plus an immutable intake snapshot. Staff do not accept, convert, or retype.

In-repo implementation remains design-faithful. Production apply + deploy + controlled UAT are certified in [docs/206](../206-facility-public-work-request-production-release/index.md). Do not replay unused `20260818013000`.

---

## Owner decisions used

| # | Decision | Implementation |
|---|---|---|
| 1 | Immediate work order + snapshot | `submitPublicRequest` → one WO + `facility_request_submissions` |
| 2 | No anonymous Phase 1 | `contact_required` and `authenticated_only` only |
| 3 | Status tracking in Phase 1 | Separate high-entropy status token + `/request/status/{token}` |
| 4 | `facility.request_forms` | FO-effective `organization_admin` / `property_manager` only |
| 5 | Location labels | Floor / department / room stored as labels; Building / Asset referenced when present |
| 6 | Human-friendly request number | `FR-YYYY-NNNNN` (example `FR-2026-00124`); WO UUID never public |

---

## 1. Implementation SHA

`c3fc21bca11b6e8badc3da882fa208c8483cbec3` — *Implement Facility public work request intake (docs/204 / ADR-034).*

This certification commit is successor documentation only.

---

## 2. Migrations

| Stamp | File | Applied to Production? |
|---|---|---|
| `20260818013000` | `supabase/migrations/20260818013000_docs_204_facility_request_forms.sql` | **No** — Production used stamp twin `20260818011913` (docs/206). Do not replay |

Additive only. New tables + nullable/defaulted work-order columns. Does not replay J6 / STAB-004 / MEDIA-001 / FAC-003 / docs/180 / docs/194 / unused stamp twin `20260817220000`.

---

## 3. Schema / data model

| Object | Role |
|---|---|
| `facility_request_forms` | Multiple forms per organization; draft / active / inactive; access policy |
| `facility_request_form_versions` | Immutable published `field_snapshot`; current draft pointer on the form |
| `facility_request_intakes` | QR / share-link entrance; SHA-256 token hash + prefix; context JSON; revoke |
| `facility_request_submissions` | Immutable receipt: version, values, source, requester, status-token hash, idempotency |
| `facility_request_submission_values` | Per-field label + value rows |
| `facility_request_media_grants` | Short-lived MEDIA-001 intake grants |
| `facility_request_number_counters` | Org + year sequence |
| `maintenance_work_orders` extras | `intake_channel`, `request_number`, `floor_label`, `department_label`, `room_label` |
| MEDIA-001 | `facility_request_intake` parent; `uploaded_by_user_id` nullable |

RLS: authenticated staff select/write via `is_org_member` / `can_manage_facility_ops`. `anon` / `public` revoked. Public writes use the service role after token-hash lookup.

Unique `(organization_id, request_number)` where not null. Unique `(organization_id, intake_id, idempotency_key)`.

---

## 4. Form builder

Route: `/facility/settings/request-forms` (FO Settings child). Mission Control manager CTA when `canAccess("facility.request_forms")`.

Supports multiple forms; standard catalog Required / Optional / Hidden; custom labels, helper text, order; custom types short text / long text / select / yes-no / number / date; select options; Preview before publish; activate via publish; deactivate.

---

## 5. Versioning / snapshot behavior

Saving fields after a published version inserts a new unpublished version and moves `current_version_id`. Publish stamps `published_at` and activates the form. Historical submissions keep `form_version_id` + `values_snapshot`. Ordinary edits do not rotate intake tokens. Submit with a stale `expectedVersionId` returns 409 superseded.

---

## 6. Public token architecture

24-byte base64url tokens. SHA-256 stored. UUID-shaped tokens rejected. Public URL is `/request/{token}`. Browser never chooses `organization_id`. Lookup is hash-only.

---

## 7. QR architecture

QR and Share Link are the same portal. `?via=qr` vs `?via=link` only selects source. QR SVG encodes the public URL only. `assertSafePublicRequestUrl` refuses raw UUIDs, `organization_id`, work-order, user, or asset identifiers in the URL.

---

## 8. Contextual locking

Intake `context_json` may lock building / floor / department / room / asset display values. Server validation rejects changed locked labels and forged client property/asset/org ids. Human-readable context is snapshotted onto the submission and denormalized onto the work order.

---

## 9. Public mobile portal

`/request/[token]` is outside the authenticated matcher. Phone-first: full-width Submit (`min-h-12`), `capture="environment"` on image/video, locked context read-only. Auth chrome is branding only.

---

## 10. Contact Required

Default policy. No M.P.A. account. Server requires name plus email or phone when those fields are configured. Hidden contact fields cannot satisfy Contact Required by injection.

---

## 11. Authenticated Only

Unsigned GET shows the sign-in wall. Signed-in requesters see the form (`signedIn` from the server session). POST without `actorUserId` returns 401.

---

## 12. Attachment security

MEDIA-001 grants scoped to the intake, private bucket, signed upload URLs, existing MIME/size limits. On submit, attachments rebind to `related_entity_type = maintenance` and the new work-order id. Requesters cannot list organization media. Public media routes are rate-limited and token-gated.

---

## 13. Canonical work-order creation

One `createFacilityWorkOrder` call: `work_surface = facility`, `status = submitted`, `assignee_type = unassigned`, `intake_channel` set. No request-accept/convert queue.

---

## 14. Human-friendly request number

`formatFacilityRequestNumber` → `FR-{year}-{sequence padded to 5}`. Org + year counter. Unique index is the collision-safe backstop. Never exposed as the work-order UUID.

---

## 15. Tracking-token behavior

Separate high-entropy token, hashed at rest. `/request/status/{statusToken}` returns `publicTrackingView` only: request number, submitted date, title, category, location, coarse status. No assignee, notes, vendor, labor, parts, cost, internal attachments, org internals, user IDs, or work-order UUIDs.

---

## 16. Confirmation email

When requester email is present, `sendOperationalNoticeEmail` sends the branded operational notice: subject `Request submitted · FR-…`, CTA **View Request Status** to the secure tracking URL.

---

## 17. FO queue integration

Existing `/facility/operations` lists the new work order. Detail shows request number, source label, floor / department / room labels, and the submission snapshot from `GET /api/facility/operations/[workOrderId]`.

---

## 18. Notification integration

Reuses `notifyLifecycle` / `maintenance_notifications` with key `work_order.public_submitted` to FO manager-class members. Does not create a notification engine. Does not write `comms_notifications`.

---

## 19. RBAC / ADR-033 behavior

| Actor | `facility.request_forms` |
|---|---|
| FO manager / org admin | Granted |
| FO technician | Denied (can still work resulting WOs via `facility.operations`) |
| PM-only SKU | Denied |
| Complete + `property_operations` | Denied |
| Complete + `facility_operations` or `both` + manager role | Granted |

Public `/api/public/request*` remains unentitled (token-gated). ADR-033 `canAccess` / `effectiveSurfaces` intersection preserved.

---

## 20. Wendy acceptance test

Shared + service tests:

1. Floor 3 QR context locked  
2. Department Cardiology entered  
3. Name Wendy  
4. Problem / description Chair arm is broken  
5. Photo required  
6. Result: one facility WO, `submitted`, source `qr`, labels + snapshot + `FR-2026-#####`  
7. Staff notify `work_order.public_submitted`  
8. Confirmation + View Request Status path when email present  

---

## 21. Warehouse acceptance test

Same contracts, different published snapshot: Building required, custom Zone required, Asset optional, Category required, Description required, Safety required, Photo optional, Department and Person hidden. No application-code change — configuration only.

---

## 22. Abuse / rate-limit tests

In-memory limiter: 12 attempts / 15 minutes per key (`token` + IP + route). 13th returns false (HTTP 429 on public GET/POST/media/status). Idempotency key unique per org+intake. UUID-shaped tokens rejected.

---

## 23. Organization / RLS isolation tests

Shared validation rejects forged `organization_id`, building, and asset context. Admin API entitlement denies PM-only and Complete PM-scope. Migration RLS is org-scoped; public writes never grant anon table access.

---

## 24. Media isolation tests

Shared attachment validation rejects disallowed MIME and oversized files. Public upload requires a valid intake token and writes `organization_id` from the token, not the browser. Rebind is org + intake-parent scoped.

---

## 25. Accessibility / mobile tests

Public portal uses labeled controls, `aria-readonly` on locked context, 12-unit submit target, and `capture="environment"`. No separate automated a11y suite in this package.

---

## 26. Broader regression

| Suite | Result |
|---|---|
| `@mpa/shared` vitest | **55 files / 372 tests passed** |
| `@mpa/web` vitest | **119 files / 555 tests passed** |

Includes commercial nav, operating-scope, and existing FO work-order tests.

---

## 27. Typecheck / lint / build

| Check | Result |
|---|---|
| `packages/shared` `pnpm typecheck` | Pass |
| `apps/web` `pnpm typecheck` | Pass |
| eslint on new request-form sources | Pass |
| `apps/web` `pnpm build` (local compile; dummy public env; **not a deploy**) | Pass — routes include `/facility/settings/request-forms`, `/request/[token]`, `/request/status/[statusToken]` |

---

## 28. Production safety proof

| Check | Result |
|---|---|
| Implement commit finance/Stripe/complimentary/M5/July files | **None** (`git show c3fc21bc`) |
| `isFinanceM5Authorized()` | `false` |
| Tenant payment execution flag | Untouched |
| Production migration apply | Later performed in [docs/206](../206-facility-public-work-request-production-release/index.md) as stamp `20260818011913` |
| Production deploy | Later performed in docs/206 |
| Complimentary / Checkout / Connect / SaaS Prices | Untouched by this implement commit |

This package remains the in-repo implementation record. Production evidence lives in docs/206.

---

## 29. Known limitations

1. Request-number increment is not a single locked SQL transaction. Unique `(organization_id, request_number)` is the collision-safe backstop.
2. Idempotent replay cannot re-issue the original plaintext status token (hash-only storage). The first response and confirmation email carry it. Lost-token recovery remains out of Phase 1 (docs/204 decision 11).
3. Optional design flag `facility_public_request_intake` was not added. Production apply + deploy is the control.
4. Floor / department / room remain labels. No registries.
5. Public APIs return 503 when the service-role client is unavailable (correct fail-closed for this in-repo package).
6. No large analytics dashboard, no HTML/JS customization, no new logo uploader, no automatic QR for every location.

---

## 30. Exact Production release gate

Owner separately authorized Production in [docs/206](../206-facility-public-work-request-production-release/index.md).

Do not replay unused `20260818013000`. Do not start another feature from this package.
