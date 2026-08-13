# PRODUCTION DEPLOYMENT + MEDIA MIGRATION CERTIFICATION

**Status:** PRODUCTION RELEASE SUCCESSFUL  
**Date:** 2026-08-13  
**Release SHA:** `dac469a7de5ee245978c47b08b9e7c03d18abdd4` (`dac469a`)  
**Prior approval:** `docs/81-final-production-deployment-certification`  

---

## 1. Release scope

| Item | Value |
|------|-------|
| Merged vehicle | PR [#178](https://github.com/ecastle612-ux/M.P.A/pull/178) (contains #175 + #177) |
| Complete Plan remediation | API entitlement + work_surface isolation |
| MEDIA-001 Phase 1 | Attachments model, private storage, signed URLs, FO evidence UI |
| Font remediation | Self-hosted IBM Plex (`next/font/local`) |
| Stripe / billing / subscriptions / RBAC | **Unchanged** |

---

## 2. MEDIA-001 production migration

| Field | Value |
|-------|--------|
| Project | Supabase `mpa-prod` (`vahnmcrpnuggxkivynvo`) |
| Migration name | `media001_media_attachments` |
| Migration version (history) | `20260813213805` |
| Source file | `supabase/migrations/20260813210000_media001_media_attachments.sql` |
| Applied via | Supabase MCP `apply_migration` |
| Applied at (UTC) | **2026-08-13T21:38:05Z** (version timestamp) |
| Result | **SUCCESS** |

### Post-apply verification

| Check | Result |
|-------|--------|
| `public.media_attachments` exists | **YES** |
| RLS enabled | **YES** |
| Policies | `select_member`, `insert_member`, `update_member` |
| Storage bucket `media` | **YES** — `public=false`, 100MB limit, image/video MIME allowlist |
| Org isolation helpers | Policies use `is_org_member` / `is_org_manager` |

---

## 3. Production deployment

| Field | Value |
|-------|--------|
| Commit deployed | `dac469a7de5ee245978c47b08b9e7c03d18abdd4` |
| GitHub Production deployment | `5896348342` — state **success** |
| Vercel deployment ID | `dpl_5j41NXUG94oQyuNFXdzbMzTpQWFn` |
| Vercel URL | `https://m-p-a-2qqcp0fqc-ecastle612-uxs-projects.vercel.app` |
| Created (UTC) | **2026-08-13T21:25:15Z** |
| Status | **Ready** (Production) |
| Aliases | `https://www.my-property-assistant.com`, `https://my-property-assistant.com`, `https://m-p-a-web.vercel.app` |

Deployment was produced by the Vercel Git production pipeline on merge of #178 to `main` (certified SHA). No redeploy or force-push performed in this execution.

---

## 4. Post-deploy smoke validation

### Application

| Check | Result |
|-------|--------|
| Homepage loads | **PASS** — HTTP 200, `data-dpl-id=dpl_5j41NXUG94oQyuNFXdzbMzTpQWFn` |
| Self-hosted Plex fonts served | **PASS** — `IBMPlex*.woff2` preloads; CSP `font-src 'self' data:` |
| Login reachable | **PASS** — `/login` HTTP 200 |
| Auth gate on app routes | **PASS** — `/pm/*` and `/facility/*` → 307 `/login` |
| Runtime logs (sample) | Info-level request logs only for smoke probes; no error burst observed |

### APIs (unauthenticated negative tests)

| Endpoint | Result |
|----------|--------|
| `GET /api/shared/media` | **401** Unauthenticated |
| `POST /api/shared/media/upload-intent` | **401** Unauthenticated |
| `GET /api/shared/media/:id/url` | **401** Unauthenticated |
| `GET /api/pm/maintenance` | **401** Unauthenticated |
| `GET /api/facility/vendors` | **401** Unauthenticated |

### Property / Facility / Complete (production surface)

| Check | Result | Notes |
|-------|--------|-------|
| PM routes auth-gated | **PASS** | Redirect to login |
| FO routes auth-gated | **PASS** | Redirect to login |
| Media unauthorized denied | **PASS** | 401 without session |
| Cross-module leakage via anonymous probe | **PASS** | No data returned |

**Note:** Authenticated end-to-end photo/video upload with live org users was not executed in this automation (no production test credentials). Schema + private bucket + signed-URL code path + unauthenticated deny are verified. Operator should complete one authenticated FO evidence upload smoke in a controlled org as follow-up.

### Billing safety

| Check | Result |
|-------|--------|
| Pricing page amounts | **PASS** — PM/FO **$59**, Complete **$109**, annual **$566.40** / **$1,046.40**, Save 20% |
| Stripe Prices / billing logic / subscription migration | **NOT CHANGED** in this release |

---

## 5. Security validation

| Check | Result |
|-------|--------|
| Media bucket non-public | **PASS** |
| Media RLS + org membership policies | **PASS** |
| Unauthenticated media/API access denied | **PASS** |
| App surfaces require login | **PASS** |
| CSP font-src self-only | **PASS** |

---

## 6. Incident status

| Item | Status |
|------|--------|
| Rollback required | **NO** |
| Open production incident | **NONE** observed during smoke |
| Monitor | Vercel production logs sampled post-deploy — healthy |

---

## Final verdict

**PRODUCTION RELEASE SUCCESSFUL**

`main` @ `dac469a` is live on production aliases; MEDIA-001 migration `media001_media_attachments` (`20260813213805`) is applied on `mpa-prod` with private storage and RLS verified. Stop after certification.
