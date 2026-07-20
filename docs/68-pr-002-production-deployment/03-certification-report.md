# 03 — Certification Report

**Package:** PR-002 · EP-007  
**Date:** 2026-07-19  
**Production deployment:** `dpl_4tdnTvG9nJXL3FFzayQaCrb6kWBM`  
**Production alias:** `https://m-p-a-web.vercel.app`  
**Inspector:** https://vercel.com/ecastle612-uxs-projects/m-p-a-web/4tdnTvG9nJXL3FFzayQaCrb6kWBM

---

## 1. Deployment summary

| Item | Result |
| --- | --- |
| Vercel project | `m-p-a-web` (`prj_pZn4nRYNDeN4AlVz1RZqY4L8tfjL`) |
| Team | `ecastle612-uxs-projects` |
| Target | Production |
| Status | **Ready** |
| Root directory | `apps/web` |
| Build | Monorepo `pnpm --filter @mpa/web build` |
| Source | Local working tree upload (not GitHub `main`) |
| Canonical URL env | `NEXT_PUBLIC_APP_URL=https://www.my-property-assistant.com` |
| Env badge | `NEXT_PUBLIC_MPA_ENV=production`, Design Partner mode `true` |

---

## 2. Domain status

| Check | Status | Evidence |
| --- | --- | --- |
| Domain added in Vercel (`www` + apex) | **Pass** | Project Domains lists both hosts |
| DNS → Vercel | **Fail** | `www` / apex do not resolve; NS remain Cloudflare |
| SSL on custom domain | **Blocked** | Pending DNS |
| HTTPS on custom domain | **Blocked** | Pending DNS |
| Apex → www redirect | **Configured** | `apps/web/vercel.json` host redirect; not live until DNS |
| Canonical URL in HTML | **Pass (alias)** | Login HTML references `my-property-assistant.com` |
| Production alias HTTPS | **Pass** | HTTP/2 200 on `/login` with HSTS |

### Operator DNS (required)

Vercel recommended (Cloudflare → DNS only / grey cloud):

| Type | Name | Value |
| --- | --- | --- |
| A | `www` | `76.76.21.21` |
| A | `@` | `76.76.21.21` |

Nameservers today: `blakely.ns.cloudflare.com`, `nile.ns.cloudflare.com` (do **not** need to move to Vercel NS if A records are set correctly).

---

## 3. Provider status

| Provider | Classification | Notes |
| --- | --- | --- |
| Supabase | **Live** | Project `vahnmcrpnuggxkivynvo` (`https://vahnmcrpnuggxkivynvo.supabase.co`); Auth/DB/Storage/RLS present |
| OneSignal | **Live (credentials)** | App ID + API key on Vercel Production; MCP app not linked; **origin must be updated** to prod host |
| Stripe | **Disabled** | `PAYMENT_PROVIDER` / noop posture |
| Resend | **Disabled** | `EMAIL_PROVIDER` noop — invite / password-reset email blocker for email-dependent onboarding |
| Twilio | **Disabled** | `SMS_PROVIDER` noop |
| Dropbox Sign | **Disabled** | Signature provider noop |
| Checkr | **Disabled** | Screening provider noop |
| Google Maps | **Missing** | No Maps key in Production env |

### Supabase subsystem checks (project inventory)

| Area | Status |
| --- | --- |
| Authentication | Live (Supabase Auth project) |
| Database | Live (core ops tables populated) |
| Storage | Live (`storage.objects` + bucket; 12 objects) |
| RLS | Enabled on audited public/storage tables |
| Realtime | Available on project (not separately load-tested this sprint) |
| Document Vault | `vault_documents` + media assets present (12 docs) |
| Facility Records | `facility_records` (1+) |
| Assets | `facility_assets` (4) |
| Timeline | `facility_timeline_events` (3) |

Security advisors: WARN-level function `search_path` / SECURITY DEFINER exposure + leaked-password protection disabled — track for GA hardening, not Design Partner blockers.

---

## 4. Environment verification

See [02-environment-matrix.md](./02-environment-matrix.md).

| Class | Result |
| --- | --- |
| Required Design Partner vars | **Present** on Vercel Production |
| Canonical / Private Beta meta | **Present** |
| Payment / email / SMS / signature / screening live keys | **Absent / noop** (expected for cohort) |
| `DEV_MASTER_ADMIN_PASSWORD` in Production | **Not listed** (good) |

---

## 5. Webhooks

| Endpoint | Probe (POST empty JSON on alias) | Status |
| --- | --- | --- |
| `/api/webhooks/payments/stripe` | 200 | Placeholder / noop-safe |
| `/api/webhooks/signature/dropbox_sign` | 200 | Placeholder / noop-safe |
| `/api/webhooks/screening/checkr` | 200 | Placeholder / noop-safe |
| OneSignal | N/A (dashboard origin + SW) | SW at `/push/onesignal/OneSignalSDKWorker.js` → **200** |
| Future placeholders | Documented in runbook | Not live-certified on custom domain |

---

## 6. Email

| Check | Status |
| --- | --- |
| Resend domain | **Missing / disabled** |
| SPF / DKIM | **Not verified** |
| Password reset email | **Blocked** until Resend live (or waived) |
| Invitation emails | **Blocked** until Resend live (or waived) |

---

## 7. Build / runtime (production alias)

| Check | Result |
| --- | --- |
| Deploy Ready | Pass |
| `/login` HTTP 200 | Pass |
| Browser login shell | Pass (title, form, logo) |
| Hydration error text | Not observed on login |
| Missing brand assets | Pass (superseded by UX-007 approved logo assets, icons, manifest, offline) |
| Brotli compression | Pass (`Content-Encoding: br`) |
| HSTS | Pass (`max-age=31536000; includeSubDomains; preload`) |
| CSP / X-Frame / nosniff | Pass |
| OneSignal SW | Pass (`/push/onesignal/OneSignalSDKWorker.js`) |
| PWA SW | Pass (`/sw.js`) |

---

## 8. Application surface smoke (alias)

Unauthenticated probes: **307 → login** means middleware protection is active (Pass). **404** means no top-level route (feature lives nested).

| Area | Route | Result |
| --- | --- | --- |
| Login | `/login` | **200** |
| Operations Center | `/dashboard` | **307** (auth) |
| Properties | `/properties` | **307** |
| Residents / Tenants | `/tenants`, `/residents/move-in` | **307** |
| Maintenance | `/maintenance` | **307** |
| Facility | `/facility`, `/facility/assets` | **307** |
| Financials / Reports | `/financials`, `/financials/reports` | **307** |
| Document Vault | `/settings/documents` | **307** |
| Settings / Integrations | `/settings`, `/settings/integrations` | **307** |
| AI / Command surfaces | `/ai-operations` (+ Command Center overlay in shell) | **307** |
| Timeline / Assets | Nested on property/unit/asset pages | Protected with parent routes |
| Brand assets | `/branding/*`, `/icons/*` | **200** |

Full authenticated walkthrough on custom domain is **pending DNS**.

---

## 9. Performance

| Check | Result |
| --- | --- |
| Compression | Brotli on HTML |
| Caching | `public, max-age=0, must-revalidate` (SSR/dynamic) |
| Image / static assets | Served from Vercel CDN |
| Lighthouse | **Not run** this sprint (no CI Lighthouse gate) |
| Bundle sizes | Middleware λ ~190KB; page λ ~2.65MB reported by Vercel inspect |

---

## 10. Security

| Control | Result |
| --- | --- |
| HTTPS (alias) | Pass |
| HSTS | Pass |
| Cookies / session | `SESSION_COOKIE_NAME` set; auth redirects enforce login |
| Security headers | CSP, COOP, CORP, Permissions-Policy, Referrer-Policy |
| Secrets | Encrypted on Vercel; not committed |
| Environment isolation | Production env separate; Design Partner mode on |
| Rate limiting | Still open (GA blocker from PR-001) |

---

## 11. Remaining blockers

1. Cloudflare DNS A records for `www` + apex → `76.76.21.21`  
2. Confirm SSL + apex→www on `https://www.my-property-assistant.com`  
3. OneSignal production Site URL / allowed origin  
4. Supabase Auth redirect URLs for production host  
5. Resend (or explicit email waiver) for invites / password reset  
6. Align GitHub `main` with deployed tree before relying on git-based deploys  
7. GA-only: live Stripe/Checkr/Dropbox Sign + rate limiting  

---

## 12. Scores

| Score | Value | Rationale |
| --- | ---: | --- |
| Design Partner readiness | **8.8 / 10** | App + providers for cohort ready on alias; canonical domain + email still open |
| Production readiness | **7.8 / 10** | Real prod deploy + headers + env; DNS/SSL on brand domain incomplete |
| Commercial readiness | **6.9 / 10** | Unchanged — paid rails still noop |

---

## 13. Commercial readiness

Design Partner Private Beta: **ready on production alias**; brand domain pending DNS.  
Paid commercial GA: **not ready** (payments, screening, e-sign, transactional email, rate limits).

---

## 14. Launch recommendation

**CONDITIONAL GO** — proceed with Design Partner onboarding on the production alias now; flip to canonical domain immediately after Cloudflare DNS propagates and OneSignal/Supabase allow-lists are updated.

**NO-GO** for unsupervised paid GA.
