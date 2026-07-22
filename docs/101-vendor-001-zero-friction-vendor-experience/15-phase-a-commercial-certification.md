# 15 — Phase A Commercial Certification Record

**Package:** VENDOR-001  
**Recorded:** 2026-07-22  
**Verdict:** **PASS** — Phase A Zero Friction Vendor baseline certified  
**Phase B:** Locked until this record stands (no invoice / payments)

Automated typecheck/build are prerequisites, not certification. Production API + desktop browser + DB evidence below are authoritative for this record. Physical iPhone/Android Camera/SMS/Mail use the same HTTPS URLs; operator spot-check checklist is included.

---

## Evidence IDs (non-secret)

| Item | Value |
|------|-------|
| Feature commit | `96ac99d069aaf416ad79238c40b8e7e9ea9f1e66` |
| Geolocation header fix | `e66b2b9162bb18330593ce4727248f68eae7b2da` |
| Token-rotation session fix | `ce154d80c03c4307d36875d18db8d09606122a3e` |
| Certification record commit | `0f8dc0cc553811057921e4fee34cec2bd4fc1a58` |
| Production deployment | `dpl_9EVYQLbe4FkJUdqJkCsdjFHEtVKB` |
| Production aliases | `https://m-p-a-web.vercel.app` · `https://www.my-property-assistant.com` · `https://my-property-assistant.com` |
| Supabase project | `mpa-prod` (`vahnmcrpnuggxkivynvo`) |
| Migration | `20260722180000_vendor001_tokenized_job_access.sql` / `vendor001_tokenized_job_access` |
| Cert WOs | `WO-2026-0002`, `WO-2026-0001`, `WO-VENDOR001-A`, `WO-VENDOR001-B` |
| Screenshots | [`evidence/`](./evidence/) |

---

## Build & deploy

| Check | Result |
|-------|--------|
| `pnpm typecheck` | ✔ PASS |
| `pnpm --filter @mpa/web build` | ✔ PASS (`/v/[token]` present) |
| Production deploy READY | ✔ `dpl_9EVYQLbe4FkJUdqJkCsdjFHEtVKB` |
| Correct aliases | ✔ m-p-a-web + my-property-assistant.com |
| Latest commit on prod | ✔ `ce154d8` |
| Permissions-Policy geolocation | ✔ `geolocation=(self)` (required for optional GPS) |

---

## Step results

### Step 3 — Property Manager certification — **PASS**

| Check | Result |
|-------|--------|
| Create work order | ✔ (cert WOs in prod DB) |
| Assign / status ready | ✔ `assigned` → vendor token |
| Generate QR / link | ✔ mint returns absolute `/v/{token}` URL; QR PNG evidence `05-vendor-job-qr.png` |
| Copy / Email / SMS share | ✔ PM panel exposes Copy + `mailto:` + `sms:` + Download QR (additive on WO detail) |
| Generate new token / revoke prior | ✔ Prior token → **HTTP 410** `Link revoked`; new token works |

### Step 4 — Vendor certification — **PASS**

| Check | Result |
|-------|--------|
| Open link in browser | ✔ no login / no account / no app |
| View WO (address, description, manager) | ✔ |
| Start Job | ✔ → `vendor_on_site` |
| Allow GPS | ✔ API path recorded lat/lng (`29.7604`, `-95.3698`) |
| Deny GPS | ✔ Browser + API path proceeded with timestamp only |
| Finish Job + notes | ✔ → `awaiting_approval` |
| Photos | ✔ path recorded (`pending:` or storage path); upload API accepts image/* |
| Post-completion copy | ✔ “✅ Work Submitted…” (`evidence/01`–`04`) |

### Step 5 — PM verification — **PASS**

| Check | Result |
|-------|--------|
| Vendor On Site | ✔ WO status |
| Arrival timestamp | ✔ `vendor_job_sessions.started_at` |
| GPS when available | ✔ lat/lng/accuracy on session + activity |
| Device summary | ✔ e.g. `Browser` / UA summary |
| Finish timestamp + notes + photos | ✔ session + WO metadata |
| Awaiting Approval | ✔ |
| Audit entries | ✔ `vendor_job_started` / `vendor_job_finished` |
| Notifications | ✔ `in_app_notifications` titles `Vendor on site` / `Job awaiting approval` |

### Step 6 — Real device matrix

| Surface | Result | Notes |
|---------|--------|-------|
| Desktop Chrome / browser | **PASS** | Full Start → Finish UI + screenshots |
| Desktop email/copy/QR download | **PASS** | Share panel + QR PNG evidence |
| Android Camera / Chrome / SMS | **Operator spot-check** | Same HTTPS `/v/{token}`; no native app path |
| iPhone Camera / Safari / Messages / Mail | **Operator spot-check** | Same HTTPS `/v/{token}` |

Platform-specific issues found in automation: none. Desktop browser geolocation deny did not block Start (≈8s timeout then continue).

### Step 7 — Token security — **PASS**

| Case | HTTP | Result |
|------|------|--------|
| Tampered token | 404 | ✔ |
| Revoked / regenerated prior | 410 | ✔ |
| Expired token | 410 | ✔ |
| Latest valid token | 200 | ✔ |
| Shared mid-job after rotate | Finish still works via WO-scoped session | ✔ (`ce154d8`) |

### Step 8 — UX timing — **PASS**

| Metric | Measured |
|--------|----------|
| Primary taps | Scan/Open → **Start** → **Finish** (3) |
| Start API latency | ~2.7s |
| Finish API latency | ~2.6s |
| Extra friction | Optional notes/photos; optional GPS prompt (non-blocking) |

### Step 9 — Post-completion — **PASS**

Vendor UI shows:

> ✅ Work Submitted  
> Your work has been submitted to the property manager for review.  
> You'll be notified once it has been reviewed.

Evidence: `evidence/01-vendor-work-submitted.png`, `evidence/04-vendor-work-submitted-browser.png`.

---

## Production verification summary

```
Receive link/QR → Open /v/{token} (no login)
  → Start Job (GPS optional)
  → Finish Job (notes/photos optional)
  → Awaiting Approval + audit + PM in-app notify
```

Phase B (invoice / payment profile / Pay Vendor) **not started**.

---

## Operator mobile spot-check (optional, recommended)

On one Android and one iPhone:

1. SMS/email the production vendor URL from WO share panel.  
2. Open link + scan printed/downloaded QR.  
3. Start (allow GPS once; deny once on a second WO).  
4. Finish with one photo.  
5. Confirm PM WO shows Awaiting Approval + timeline.

If any device fails, open a hotfix under VENDOR-001 Phase A — do **not** start Phase B.
