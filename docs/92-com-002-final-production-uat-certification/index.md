# COM-002 FINAL PRODUCTION UAT CERTIFICATION

**Title:** COM-002 FINAL PRODUCTION UAT CERTIFICATION  
**Status:** PRODUCTION RELEASE SUCCESSFUL  
**Date:** 2026-08-14  
**Recorded at:** 2026-08-14T03:40:00Z  
**Prior records:** PR #197 blocked UAT · [docs/91](../91-com-002-uat-remediation-certification/index.md) READY FOR UAT RE-RUN  
**Approved design:** [docs/80](../80-com-002-tenant-communication-center/index.md) · [ADR-024](../18-decision-log/adr-024-com-002-tenant-communication-center.md)  
**Merge:** PR #198 MERGED into `main` at `2026-08-14T03:23:41Z`  
**Release SHA:** `102b63da5f606e8a625e9d547e1e3e8964af4b4a`  
**Production deploy:** `dpl_9qb1SBLvE1u3uGXQJrDZoeMDD8ZV` READY  
**Production alias:** `www.my-property-assistant.com` (serves `dpl_9qb1SBLvE1u3uGXQJrDZoeMDD8ZV`)  
**Preview:** SUCCESS `5SCeoYzRn8P7SSNUCJhwpnoDjxzJ` · `https://m-p-a-75fxvof85-ecastle612-uxs-projects.vercel.app` @ `2950ad6a`  
**CI:** PR verify SUCCESS (run `31766515191`) · `main` push SUCCESS (run `31766674959`)  
**Prod schema:** `20260814030010` / `com_002_uat_remediation` (already on `mpa-prod`)  
**UAT org:** M.P.A. UAT Property Demo (`a11ce002-0001-4000-8000-0000000000c2`)  
**Stripe / billing / commercial flow:** **Unchanged**

Identifier note: COM-002 Tenant Communication Center (ADR-024 / docs/80), not Self-Service Commercial.

---

## Final verdict

**PRODUCTION RELEASE SUCCESSFUL**

The tenant Notification Center application path is live on Production. Property Manager and tenant notification create, bell/count, deep-link, and `read_at` all passed on the controlled UAT org. Security regressions held. No new messaging features, billing, Stripe, commercial, or FO tenant-messaging changes were introduced.

Stop here.

---

## 1. Deployment

| Check | Result |
|-------|--------|
| Branch merged into `main` | **PASS** — PR #198 MERGED · merge commit `102b63da5f606e8a625e9d547e1e3e8964af4b4a` |
| CI pass | **PASS** — PR run `31766515191` SUCCESS; `main` run `31766674959` SUCCESS |
| Preview pass | **PASS** — Vercel Preview `5SCeoYzRn8P7SSNUCJhwpnoDjxzJ` SUCCESS @ `2950ad6a` |
| Production SHA recorded | **PASS** — `102b63da5f606e8a625e9d547e1e3e8964af4b4a` · `dpl_9qb1SBLvE1u3uGXQJrDZoeMDD8ZV` READY on `www.my-property-assistant.com` |

Typecheck follow-up `2950ad6a` (exactOptional inbox props + notification actor return type) is included in the merge.

---

## Accounts used

| Actor | Email | Role |
|-------|-------|------|
| Property Manager | `uat.pm.property.demo@my-property-assistant.com` | `property_manager` |
| Tenant | `uat.tenant.property.demo@my-property-assistant.com` | `tenant` |
| FO (security only) | `uat.fo.property.demo@my-property-assistant.com` | `facility_technician` |

Passwords are not stored in this blueprint.

---

## 2. Property Manager notification path

**PASS**

PM sent on Production after deploy:

`COM-002 final UAT PM message — tenant should be notified.`  
Message `afced5a2-6726-4463-9a7b-86c4f1ed444d` · thread `d409029d-bcbe-4725-9f67-41b37e1e9f28` · no audit RLS error.

After the tenant replied, PM:

| Check | Result |
|-------|--------|
| Receives tenant reply notification | **PASS** · `comms_notifications` `6f2e4d1d-0a1a-40aa-9bb8-7a03359a603a` · body matches the tenant reply · `href` `/shared/communications/conversations/d409029d-bcbe-4725-9f67-41b37e1e9f28` |
| Bell count updates | **PASS** — Notifications badge **1** |
| Opens thread | **PASS** — Open → same conversation URL; tenant reply visible |
| Notification marks read | **PASS** — `read_at` `2026-08-14 03:32:39.199+00` |

---

## 3. Tenant Notification Center path

**PASS**

| Check | Result |
|-------|--------|
| Receives PM message notification | **PASS** · `b34bd19e-727f-499d-bc54-91330f74ea90` · body `COM-002 final UAT PM message — tenant should be notified.` · `href` `/portal/tenant/messages/d409029d-bcbe-4725-9f67-41b37e1e9f28` |
| Tenant bell appears | **PASS** — resident header **Notifications** with unread count **1** after hard refresh of the new Production JS |
| Opens conversation | **PASS** — Open deep-links to `/portal/tenant/messages/d409029d-bcbe-4725-9f67-41b37e1e9f28` |
| `read_at` updates | **PASS** — that row `read_at` `2026-08-14 03:29:19.793+00`; opening the thread also set `read_at` on the other same-thread tenant rows at `03:29:22.718+00` |

Tenant reply (no RLS error, no duplicate):

`COM-002 final UAT tenant reply — PM should be notified.`  
Message `1a7bdcb9-c293-4244-a84f-0698dda64a64`.

The work-order notification `e15a06e5-…` (different conversation) stayed `read_at` null — expected.

---

## 4. Final security

**PASS**

| Check | Result |
|-------|--------|
| Tenant sees only own conversations | Tenant JWT REST: the two UAT conversations for resident `a11ce002-…0301` only |
| PM sees authorized residents only | PM JWT REST: same two UAT conversations; `pm_residents` in this org is **UAT Tenant** only |
| FO denied | FO login → `/unauthorized?reason=role`. `/shared/communications` and `/portal/tenant/messages` redirect to unauthorized. FO JWT `comms_conversations` = `[]` |
| Media authorization maintained | Unauthenticated `GET /api/shared/media/78a3b1d2-…/url` → **401** `Unauthenticated` |

---

## Constraints held

- No new messaging features
- No billing / Stripe / commercial changes
- No FO tenant messaging
- ADR-024 Notification Center remains alerts that point at threads

---

## Unchanged / out of scope

- Product Constitution commercial flow
- Facility Operations tenant messaging
- Legacy `properties` / `units` dual-FK shadow rows for residential work-order create (noted in the blocked UAT; not part of this release)
