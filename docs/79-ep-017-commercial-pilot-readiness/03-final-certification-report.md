# 03 — Final Certification Report (EP-017)

**Package:** EP-017 · Commercial Pilot Readiness  
**Date:** 2026-07-20  
**Status:** **In progress — operator gates remaining**

---

## Executive summary

EP-017 cleared the **in-repo and environment configuration** blockers from EP-016: Maintenance Summary is live on the existing ReportingService, announcement targeting now uses `tenants.user_id` (not only devices), and Vercel Production Resend secrets were added and redeployed.

**Stripe live supervised payment** and **Master Admin deep walk** still require an operator session and explicit live-charge approval. Until those close, Commercial Pilot remains **GO WITH LIMITATIONS** (not full **GO** / 9.0+).

---

## Scores (current)

| Score | EP-016 | EP-017 (now) | Target |
| --- | ---: | ---: | ---: |
| Design Partner Readiness | 9.95 | **9.95 / 10** | — |
| Production Readiness | 7.9 | **8.4 / 10** | ≥ 8.5 |
| Commercial Readiness | 7.6 | **8.3 / 10** | ≥ 9.0 |

### Why not 9.0 yet

| Gap | Impact |
| --- | --- |
| Stripe live payment + webhook not re-certified this sprint | Commercial −0.4 |
| Master Admin full surface not walked on `ecastle612@gmail.com` | Commercial −0.2 · Production −0.1 |
| www-originated invite/announcement send not proven in-browser (login required on www) | Production −0.1 |

Closing the three operator items below is expected to reach **Commercial ≥ 9.0**, **Production ≥ 8.5**, recommendation **GO**.

---

## Blocker results

### 1. Stripe Live Certification — **BLOCKED (awaiting approval)**

Environment is live (`sk_live_`, `STRIPE_MODE=live`, `STRIPE_ALLOW_SIMULATE=false`). No unattended live charge was executed.

**Need from operator:** explicit approval to run a supervised live payment, including:
- Amount (recommend ≤ $1.00 USD test charge)
- Charge / lease target (e.g. EP-016 deposit charge `52a14035-…`)
- Confirmation that a real card / PaymentMethod may be used

### 2. Hosted Production Resend — **PASS (config + redeploy + API)**

| Check | Result |
| --- | --- |
| `RESEND_API_KEY` on Vercel Production | **Added** |
| `EMAIL_FROM` / `EMAIL_REPLY_TO` / `EMAIL_ENVIRONMENT` | **Added** (`production`) |
| `EMAIL_PROVIDER` | Present (`resend`) |
| Production redeploy | **READY** `dpl_BsvWKadPj4iawsWq9VQzCA92yy9m` |
| Domain verified + inbox delivery (API harness → `ecastle612@gmail.com`) | **PASS** (7/7 templates) |
| www UI-triggered send | **Pending** (www requires login; not authenticated this session) |

### 3. Resident Communication — **PARTIAL**

| Check | Result |
| --- | --- |
| Defect: audience ignored `tenants.user_id` | **Fixed** |
| Portal invite API for Cert Resident | **Invite sent** |
| Portal login / accept with real inbox | **Pending** (resident email is `@example.com`) |
| Push recipients | Requires linked user + OneSignal device |

### 4. Master Admin Certification — **PENDING**

Non–master-admin correctly denied (`/unauthorized`, seed API `403`). Full Provider Health / testing utilities walk needs `ecastle612@gmail.com` session.

### 5. Maintenance Summary — **PASS**

- Catalog type `maintenance_summary` on existing ReportingService
- Generated for EP-016 Certification Court (July 2026): 2 WOs in period, 2 completed, vault download path issued
- Unit tests PASS

### 6. Commercial Pilot Checklist — **PASS (artifact)**

See [02-commercial-pilot-checklist.md](./02-commercial-pilot-checklist.md).

### 7. Final re-cert (full matrix) — **PARTIAL**

Core local workflows remain green from EP-016 + Maintenance Summary. Full desktop/tablet/mobile + Stripe + Master Admin re-run deferred to operator close-out.

---

## Code shipped

| Change | File(s) |
| --- | --- |
| Facility-adjacent EP-016 carry | (already shipped) vendor-complete Facility Record |
| Announcement audience uses `tenants.user_id` | `apps/web/src/lib/communication/server.ts` |
| Maintenance Summary report | `apps/web/src/lib/reporting/*` |
| Docs | `docs/79-ep-017-commercial-pilot-readiness/` |

---

## Commercial Pilot recommendation (now)

### **GO WITH LIMITATIONS**

**Allowed:** Supervised Design Partner / Commercial Pilot using manual payments or already-settled ledger paths; Resend configured on Production; Maintenance Summary available.

**Not yet full GO:** Unsupervised live Stripe checkout until supervised live payment cert completes; Master Admin ops tools until master_admin session cert completes.

---

## Operator close-out checklist (to reach GO / 9.0+)

1. **Approve Stripe live test charge** (amount + method) — reply in chat  
2. **Sign in to www** as PM and send one invite/announcement; confirm inbox  
3. **Sign in as** `ecastle612@gmail.com` for Master Admin Provider Health + testing utilities  
4. Optionally create a resident with a **real** email, accept portal invite, confirm announcement audienceUserCount ≥ 1  

After those, re-run final matrix and publish score lift to Commercial **≥ 9.0** / Production **≥ 8.5** / recommendation **GO**.
