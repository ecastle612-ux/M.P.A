# 206 — Facility Public Work Request Production Release Certification

**Title:** FACILITY PUBLIC WORK REQUEST PRODUCTION RELEASE CERTIFICATION  
**Status:** **FACILITY PUBLIC WORK REQUEST PRODUCTION RELEASE SUCCESSFUL**  
**Date:** 2026-08-18  
**Authority:** Owner authorization to release certified Facility Public Work Request Intake Phase 1 · [docs/204](../204-facility-custom-work-request-forms/index.md) **Approved** · [ADR-034](../18-decision-log/adr-034-facility-public-work-request-intake.md) **Accepted** · [docs/205](../205-facility-public-work-request-intake-implementation/index.md) certified implementation  
**Certified implementation SHA:** `c3fc21bca11b6e8badc3da882fa208c8483cbec3`  
**Production application SHA:** `06164778c77d5fdf60e485bb61d83268c877d446`  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2, Postgres 17.6.1.141, `ACTIVE_HEALTHY`) · Vercel `m-p-a-web`  
**Certified source migration:** `supabase/migrations/20260818013000_docs_204_facility_request_forms.sql`  
**Production stamp:** `20260818011913` / `docs_204_facility_request_forms`  
**This package:** Apply certified schema · deploy matching app on the live Production line · one controlled Clinic Demo UAT. **No Stripe Price change. No Connect. No tenant execution flip. No M5. No July reopen. No second feature.**

---

## Verdict

**FACILITY PUBLIC WORK REQUEST PRODUCTION RELEASE SUCCESSFUL**

Phase 1 Facility public work-request intake is live on Production. The certified SQL is registered under platform stamp **`20260818011913`**. The matching application revision **`06164778`** (certified implement `c3fc21bc` rebased onto Production `2e7b5e6d`, plus a Production `created_by` compatibility fix) is serving `www.my-property-assistant.com`. One controlled Wendy request on **M.P.A. UAT Clinic Demo** created exactly one facility work order `FR-2026-00001` in `submitted`. Tracking, branded confirmation email, and `work_order.public_submitted` notifications used the existing maintenance architecture. Tenant payment execution remains **0 TRUE**. July freeze remains **ON**. M5 remains unauthorized. SaaS prices remain **$59 / $59 / $109**.

**Do not replay `20260818013000`.** That source version was not registered on Production.  
**Do not replay unused stamp twin `20260817220000`.**

**STOP.** Do not start another feature.

---

## 1. Production SHA / deployment

| Item | Value |
|------|--------|
| Production SHA | `06164778c77d5fdf60e485bb61d83268c877d446` |
| Certified implement source | `c3fc21bca11b6e8badc3da882fa208c8483cbec3` |
| Rebased implement on Production line | `d4241238` |
| Branch | `cursor/facility-work-request-production-021b` |
| Prior Production SHA | `2e7b5e6d49d334d0259db644cb8ef06653b1fd68` (`dpl_2s3Jv8CTEy9WrM6L3H7ZKe1gjK2B`) |
| First apply-matching deploy | `dpl_7uP95UvuLdJZtdbY99iqkHCiXpAQ` · 2026-08-18T01:20:07Z · SHA `6688d308` |
| Final Production deploy | **`dpl_BSx9eGvkb6zk8A7ixAV7tnMMdVod`** |
| Created | 2026-08-18T01:28:32Z |
| Ready | READY |
| Target | production |
| Aliases | `www.my-property-assistant.com`, `my-property-assistant.com`, `m-p-a-web.vercel.app`, `m-p-a-web-ecastle612-uxs-projects.vercel.app` |
| Live HTML `data-dpl-id` | `dpl_BSx9eGvkb6zk8A7ixAV7tnMMdVod` |

Deploying `c3fc21bc` alone would have rolled Production back from docs/188–203. This release was therefore cut from **`2e7b5e6d`** and cherry-picked the certified design + implement + docs/205, keeping ADR-033 Mission Control handoffs **and** the Request Forms CTA.

---

## 2. Migration actual stamp + source SHA

| Item | Value |
|------|--------|
| Certified source | `supabase/migrations/20260818013000_docs_204_facility_request_forms.sql` |
| Source version on Production | **absent** — do not replay |
| Production apply version | **`20260818011913`** |
| Production apply name | `docs_204_facility_request_forms` |
| Predecessor tip | `20260817193519` / `docs_194_online_payments_activation` |
| Repo twin | `supabase/migrations/20260818011913_docs_204_facility_request_forms.sql` |
| SQL body SHA-256 (comments stripped; source = twin) | `e5f3bda50052adbf410eaa59b649800822451f51c4fd24115bdf82704ea52796` |
| Unused stamp twin `20260817220000` | **not applied** |
| Forms / intakes / submissions created by migrate | **0** |

---

## 3. Schema verification

Live objects match docs/205:

| Object | Production |
|---|---|
| `facility_request_forms` | present · RLS on |
| `facility_request_form_versions` | present · RLS on · unique `(form_id, version_number)` |
| `facility_request_intakes` | present · RLS on · unique `public_token_hash` |
| `facility_request_submissions` | present · RLS on · unique `work_order_id` · unique `(org, intake, idempotency_key)` · unique `status_token_hash` |
| `facility_request_submission_values` | present · RLS on |
| `facility_request_media_grants` | present · RLS on |
| `facility_request_number_counters` | present · RLS on |
| WO columns | `intake_channel`, `request_number`, `floor_label`, `department_label`, `room_label` |
| Unique request number | `maintenance_work_orders_org_request_number_uidx` |
| MEDIA-001 | `facility_request_intake` parent allowed · `uploaded_by_user_id` nullable |
| Buckets `media` / `media-private` | both **public=false** |
| `organization_memberships.operating_scope` | intact (ADR-033) |

No unexplained schema drift versus the certified SQL body.

---

## 4. Request-form admin RBAC

Unauthenticated Production:

| Surface | Result |
|---|---|
| `/facility/settings/request-forms` | **307** `/login` |
| `/facility/operations` | **307** `/login` |
| Notification / FO authenticated chrome | **307** `/login` |
| `GET /api/facility/request-forms` | **401** Unauthenticated |
| `GET /api/facility/operations` | **401** Unauthenticated |
| Public `/request/{token}` | **200** — no login for Contact Required |

A Production operator session was not minted in this environment (same limitation as docs/187). Entitlement tests and Clinic Demo memberships remain the binding RBAC proof:

| Actor | `facility.request_forms` |
|---|---|
| FO SKU + manager | Granted |
| FO technician | Denied |
| PM-only SKU | Denied |
| Complete + `facility_operations` / `both` + manager | Granted |
| Complete + `property_operations` | Denied |

Clinic Demo encodes those scopes (`uat.adr033.mike@example.com` FO manager; `uat.adr033.sarah@example.com` Complete PM-only). ADR-033 / docs/202 was not weakened.

---

## 5. Wendy form result

One controlled form on **M.P.A. UAT Clinic Demo** (`a11ce001-0001-4000-8000-00000000c11c`) only. Not a customer org.

| Field | Value |
|---|---|
| Form | Furniture / Maintenance Request |
| Form id | `a11ce204-0001-4000-8000-00000000f204` |
| Access | `contact_required` |
| Building | Demo Clinic Facility |
| Published v1 | Floor, Department, name, Problem, Description, Photo required; Room / Email / Phone optional |
| Share link | one general intake (prefix `STp_-d`) |
| Floor 3 QR | one floor intake (prefix `DYgVQe`) |
| Bulk QR | **not generated** |

After UAT the form was set **inactive** and the share-link intake was **revoked**. The Wendy work order and tracking token were **not** deleted.

---

## 6. QR result

`GET /api/public/request/{qrToken}` **200**. Floor **3** server-resolved and locked. Building locked to Demo Clinic Facility. `requiresAuth=false`. Organization UUID absent from the JSON (no `a11ce001-0001-4000-8000-00000000c11c`). Work-order UUID absent. Public HTML is AuthChrome branding only — no password form.

Submit via QR created `intake_channel = qr`, `source = qr`.

---

## 7. Share-link result

`GET /api/public/request/{linkToken}` **200** while active (building locked, floor **not** locked). HTML **200** at `/request/{token}?via=link`. After revoke: GET **404**, POST **404**. QR remained usable until the form was inactivated. No second Production submission was created from the share link.

---

## 8. Mobile public portal result

Phone-width (390×844) browser UAT:

- Floor 3 prefilled and locked (typing another value did not change it)
- Full-width Submit, photo `Choose File`, no horizontal overflow
- No login
- Tracking card shows only coarse requester-safe fields

Evidence: `/opt/cursor/artifacts/docs206_phone_qr_portal.webp`, `/opt/cursor/artifacts/docs206_phone_tracking.webp`, `/opt/cursor/artifacts/docs206_phone_qr_and_tracking.mp4`.

Code: `max-w-md`, `min-h-12` Submit, `capture="environment"` on image/video.

---

## 9. Media upload result

| Step | Result |
|---|---|
| `POST /api/public/request/{qr}/media` | **200** signed upload URL in private `media` bucket under `facility_request_intake` |
| PUT 128-byte JPEG | **200** |
| After submit | attachment rebound to `related_entity_type=maintenance`, `related_entity_id` = Wendy WO |
| Org | Clinic Demo only |
| Uploader | `uploaded_by_user_id` null (public) |
| Oversized / PDF | rejected **400** before create |

---

## 10. Canonical work-order result

Exactly **one** new `maintenance_work_orders` row. FO queue **14 → 15**. Idempotent replay of the same key returned `FR-2026-00001` and did **not** create a second WO. No accept/convert row.

| Column | Value |
|---|---|
| id | `db2aae48-11d4-49eb-97b5-dd359314d5de` |
| organization_id | Clinic Demo |
| property_id | Demo Clinic Facility |
| work_surface | `facility` |
| status | `submitted` |
| assignee_type | `unassigned` |
| intake_channel | `qr` |
| request_number | `FR-2026-00001` |
| floor_label | `3` |
| department_label | `Cardiology` |
| title / description | Chair arm is broken |
| Submission | 1 row · 9 value rows · requester **Wendy** |

Production `created_by` is NOT NULL. Public service-role insert has no `auth.uid()`, so this release attributes `created_by` to the form publisher (FO manager `a1f4c2c7-…`). `requested_by_user_id` was also stored as that publisher on Production. The immutable snapshot remains the requester record: **Wendy**. This is a compatibility attribution, not a second work order and not a convert step.

---

## 11. Request-number result

`FR-2026-00001`. Counter `facility_request_number_counters` Clinic Demo / 2026 = **1**. Unique `(organization_id, request_number)` is live. Work-order UUID is not on the public confirmation or tracking payloads.

---

## 12. Snapshot / versioning result

After Wendy submitted v1, a v2 was published that retitled “Your name” → “Requester full name”.

| Check | Result |
|---|---|
| Submission `form_version_id` | still v1 `…2204` |
| Submitted value | Wendy |
| Submitted label | **Your name** |
| Live form label | Requester full name |
| Historical values | not rewritten |

---

## 13. Tracking result

Confirmation API returned `statusPath=/request/status/{statusToken}` and human-readable `FR-2026-00001`.

`GET /api/public/request/status/{statusToken}` **200**:

```
requestNumber, submittedAt, title, category, location, status=received, statusLabel=Received
```

No assignee, vendor, labor, parts, cost, internal notes, organization UUID, or work-order UUID. Intake QR token used as a status token returns **404**. Tracking still **200** after form inactive + share-link revoke.

---

## 14. Confirmation email result

| Item | Value |
|---|---|
| To | `ecastle612+facility-request-uat@gmail.com` (Owner-controlled plus-address) |
| Resend id | `1c9e37cb-d8c7-44b9-be3a-e4ccb3f537a7` |
| Status | **delivered** |
| From | `My Property Assistant <noreply@my-property-assistant.com>` |
| Subject | `Request submitted · FR-2026-00001` |
| CTA | **View Request Status** → secure tracking URL |
| Customer mail | **none** |

---

## 15. Maintenance notification result

Seven `maintenance_notifications` rows, key **`work_order.public_submitted`**, org = Clinic Demo, work order = Wendy, href `/facility/operations`, title “New facility request”. Existing `notifyLifecycle` path. No new engine. No `comms_notifications` change.

Gmail Clinic Demo manager emails were isolated to **in-app only** for this UAT (prefs restored afterward). `example.com` UAT manager emails attempted and **failed**; the work order remained `submitted`. Email failure does not roll back the work order.

`listFacilityManagers` notifies manager-class members (admin / property_manager) and does not re-filter FO operating scope. In-app rows therefore include Complete PM-scope managers on the same org. That is the certified Phase 1 recipient rule, not a second product.

---

## 16. Token revoke / inactive behavior

| Check | Result |
|---|---|
| Share link while active | GET **200** |
| QR while active | GET **200** + Wendy submit |
| Revoked share link | GET/POST **404** |
| QR after share revoke (form still active) | GET **200** |
| Inactive form | QR GET/POST **404** |
| Existing WO / snapshot / tracking | intact |
| Tracking token ≠ intake token | proven (QR token as status → 404) |
| Token hashes in customer UI | prefixes only; hashes not rendered |

---

## 17. Security / isolation result

Targeted Production checks (no load test):

| Check | Result |
|---|---|
| Forged `organization_id` | **400** Organization cannot be chosen by the browser |
| Forged building / `propertyId` | **400** Building context cannot be changed |
| Forged Floor 9 on Floor 3 QR | **400** Floor is locked |
| Missing Department | **400** Department is required |
| Missing Photo | **400** Photo is required |
| Hidden / unknown field injection | **400** Unknown field |
| Invalid email | **400** |
| Oversized attachment | **400** Attachment is too large |
| Invalid MIME | **400** Attachment type is not allowed |
| Invalid / UUID-shaped token | **404** |
| Revoked / inactive token | **404** |
| Rate limit | certified in-repo: 12 / 15 min per key — not hammered on Production |
| PM-only / technician / Complete PM-scope admin | denied by entitlement tests + route map |
| MEDIA isolation | org + intake token; rebound scoped to Clinic Demo |

---

## 18. Complete / PM / FO scope behavior

| Surface | Result |
|---|---|
| FO-effective manager/admin | `facility.request_forms` granted (tests + Clinic FO memberships) |
| FO technician | denied form admin; operations entitlement unchanged |
| Complete + FO scope | granted |
| Complete + PM-only | denied / hidden |
| PM-only SKU | denied / hidden |
| Property Demo | PM SKU · execution FALSE · not used |
| ADR-033 | `operating_scope` intact · docs/202 handoffs preserved on the rebase |

---

## 19. Global Production safety

| Check | After release / UAT |
|---|---|
| Tenant payment execution TRUE | **0** |
| Property Demo execution | **FALSE** |
| Clinic Demo execution | **FALSE** |
| Active `autopay_enrollments` | **0** |
| Active `financial_autopay_enrollments` | **0** |
| July freeze | **ON** |
| FIN-OPS writes_enabled | true (unchanged) |
| `isFinanceM5Authorized()` | **false** |
| SaaS prices | PM **$59** / FO **$59** / Complete **$109** |
| `saas_subscriptions` / `saas_customers` / checkouts | **4 / 8 / 0** |
| Complimentary grants | **1** (unchanged) |
| Stripe / Connect mutation from this release | **none** |
| FIN-OPS money mutation | **none** |
| PM workflows | unchanged (Property Demo not touched) |
| Schema tip | `20260818011913` only for this feature |

---

## 20. Remaining blocker

**None** for this authorized Phase 1 release.

Known limitations (do not expand in this package):

1. Request-number increment is not a single locked SQL transaction; unique `(org, request_number)` is the backstop.
2. Idempotent replay cannot re-issue the plaintext status token.
3. Production `created_by` required a compatibility attribution to the form publisher.
4. No Production operator cookie was minted; live click-through of FO Settings RBAC was not performed.
5. Optional design flag `facility_public_request_intake` was not added; apply + deploy is the control.
6. The controlled UAT form is now **inactive** and the share link is **revoked**. Leave `FR-2026-00001` in place.

---

## 21. Final verdict

**FACILITY PUBLIC WORK REQUEST PRODUCTION RELEASE SUCCESSFUL**

STOP. Do not start another feature.
