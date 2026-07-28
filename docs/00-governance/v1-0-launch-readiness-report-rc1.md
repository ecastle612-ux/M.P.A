# Version 1.0 Launch Readiness Report (RC1)

**Type:** Launch certification — documentation only (no new feature work)  
**Date:** 2026-07-27  
**Release candidate:** RC1  
**Branch audited:** `checkpoint/pre-phase5`  
**Policy:** [Implementation Gate](./implementation-gate.md) · [V1.0 Mission](./v1-0-implementation-mission.md)  
**Living dashboard:** [v1-0-readiness-dashboard.md](./v1-0-readiness-dashboard.md)

> Measured by **complete customer workflows** and **operational safety**, not code volume.

---

## 1. Executive summary

M.P.A. engineering has completed the approved acquisition → billing → entitlement → setup path (ACQ / BILL / AUTH / COM) and strong property / facility / money rails. Automated tests and typecheck on the working tree are green.

**However**, Production ship HEAD and the working tree have diverged sharply (~374 changed/untracked paths). Live Stripe operator sign-off for public Checkout is still open. Commercial Launch remains **not authorized**. Push commercial cert is abandoned/FAIL. EP-019 performance cert is Not Approved.

**Verdict: READY FOR BETA**

| Audience | Ready? |
|----------|--------|
| Design-partner / beta orgs (ops-supervised) | **Yes** — after Critical deploy tasks on a controlled environment |
| Limited production (self-serve paying) | **Not yet** — close Critical blockers first |
| General Availability | **No** |

**Estimated V1.0 completion (workflow-weighted): ~89%**

---

## 2. Workflow certification results

| Workflow | Result | Notes |
|----------|--------|-------|
| **Commercial Acquisition** | **PASS (engineering)** · **OPS PENDING** | Landing → Checkout → webhook → provision → email → first login → Guided Setup → Active → Dashboard exists in WIP (ACQ A–C). Live Stripe checklist ☐ |
| **Property Operations** | **PASS (with limits)** | Property → units → tenants → lease → rent (API-005 CERT) → owner portal/reporting (OWNER-001 CERT) → communications. ACH thinner than card. Owner ACL interim. |
| **Facility Operations** | **PASS (with SKIP)** | FAC-002 package CERT PASS; production role smoke 9 PASS / 1 SKIP (facility-only org fixture) |
| **Subscription Management** | **PASS (engineering)** | Purchase (public + org billing), entitlement enforcement (BILL Phase C), past_due gates. Upgrade/downgrade/cancel via Stripe Customer Portal + webhook mirror. Live SaaS price/ops walk still needed. |
| **Administration** | **PASS (engineering)** | Org users/roles/invites, recovery audit (AUTH-E WIP), notifications stack present; privileged Master Admin tools WIP-heavy |

### Launch checklist (RC1)

| Item | Status |
|------|--------|
| Production build | ⚠️ RC1 found blockers (broken acquire imports, unused catalog var, Stripe index access) — **fixed**; `tsc --noEmit` ✅; full `next build` re-verify required after land |
| Automated tests | ✅ **396 passed** / 82 files (`apps/web` vitest, 2026-07-27) |
| Type safety | ✅ `tsc --noEmit` clean on working tree |
| Authentication | ✅ Login / first-login / contact verify / invitations (WIP vs HEAD) |
| Authorization | ✅ Capability/entitlement gates; multi-tenant org scoping |
| Multi-tenant isolation | ✅ Org-scoped APIs + RLS model; interim owner ACL residual risk |
| Stripe (SaaS + payments + Connect) | ✅ Separated rails; SaaS public Checkout wired; Connect transfers **ops-gated** |
| Webhook reliability | ✅ Duplicate event ignore + activation idempotency (code evidence) |
| Email delivery | ✅ Resend adapter; **requires production keys** |
| Notification delivery | ⚠️ OneSignal present; **PUSH-001 commercial cert FAIL / abandoned** |
| Audit logging | ✅ Impersonation / commercial / recovery paths (WIP depth) |
| Reporting | ✅ Finance/ops foundations; facility reports under FAC-002 |
| Subscription enforcement | ✅ Seat/property/module gates (BILL Phase C) |
| Guided Setup | ✅ Finish Setup requires recovery + commercial Active |
| Mobile responsiveness | ✅ Marketing + app responsive; PWA present |
| Accessibility | ✅ ACQ public a11y pass (Slice C); platform-wide axe not re-run |
| SEO (public) | ✅ ACQ marketing SEO/sitemap/robots (Slice C) |
| Performance | ⚠️ EP-019 **Not Approved**; M0 remediations exist historically |
| Error recovery | ✅ Acquire cancel/error/delay; billing portals |
| Backup / restore | ⚠️ Relies on Supabase/project ops — **no V1.0 DR runbook attested in this cert** |
| Operational logging | ✅ Structured acquire + SaaS logs |
| Security review | ⚠️ Hardening migrations exist; **formal launch security sign-off open** |

---

## 3. Remaining launch blockers

### Critical (must fix before Limited Production / self-serve paying)

| ID | Blocker | Status (2026-07-28) |
|----|---------|---------------------|
| **C1** | **Ship-tree drift** | 🟡 Closed on `release/rc1` branch — **Vercel Production deploy still required** |
| **C2** | **Migrations on Production** | ✅ **CLOSED** — AUTH/COM/OPS/FAC attested on `mpa-prod`; `property_ids` applied |
| **C3** | **Live Stripe SaaS operator checklist** | 🔴 **OPS PENDING** — [runbook](./rc1-stripe-saas-operator-runbook.md) |
| **C4** | **Production env matrix** | 🟡 Matrix updated — **Vercel value confirmation OPS PENDING** |
| **C5** | **Working-tree production build** | ✅ **CLOSED** on working tree — re-attest after deploy |

Living closeout: [rc1-critical-blocker-closeout.md](./rc1-critical-blocker-closeout.md)

### High

| ID | Issue | Impact |
|----|-------|--------|
| **H1** | Commercial Launch **not authorized** (governance) | Formal Limited Production / GA blocked |
| **H2** | PUSH-001 real-device cert FAIL / abandoned | Push cannot be sold as reliable; email/in-app remain primary |
| **H3** | Owner payout transfers kill-switched (`FIN003_TRANSFERS_ENABLED`) | Paying customers with owners need ops enable + destination readiness |
| **H4** | Stale generated Database types vs migrations | Deploy/type risk until regenerated |

### Medium

| ID | Issue |
|----|-------|
| **M1** | EP-019 performance cert Not Approved |
| **M2** | Facility-only org E2E SKIP |
| **M3** | ACH product cert thinner than card |
| **M4** | Interim owner property ACL |
| **M5** | No attested backup/restore drill for V1.0 |
| **M6** | Formal security launch sign-off incomplete |

### Low

| ID | Issue |
|----|-------|
| **L1** | Manager Portal FutureRelease (PMs use Ops) — sales language only |
| **L2** | Master Admin SaaS MRR/ARR Phase D deferred |
| **L3** | ACQ Slice D residual analytics optional |

---

## 4. Risk assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Onboard customers on Production HEAD missing ACQ/AUTH | High if rushed | Critical | Do not invite self-serve until C1–C4 closed |
| Webhook delay after payment | Medium | High (support load) | Success poll + delayed messaging already shipped |
| Push marketed as available | Medium | Medium (trust) | Explicitly exclude push from V1.0 claims |
| Owner payouts assumed live | Medium | High | Keep kill switch; ops enable per org |
| Performance under load | Medium | Medium | Soft beta traffic caps until EP-019 |
| Multi-owner ACL overshare | Low–Med | Medium | Document interim ACL; avoid multi-owner beta orgs |

---

## 5. Production deployment readiness

| Gate | Ready? |
|------|--------|
| Clean ship commit of AUTH/COM/OPS/ACQ/BILL WIP | ❌ |
| Supabase migrations applied to target | ❌ (attest required) |
| Stripe SaaS webhook + prices | ❌ (ops checklist) |
| Resend production domain | ❌ (env matrix) |
| FIN-003 transfers | Ops-gated (intentional) |
| Rollback plan | Partial (git revert + Supabase PITR if enabled — **attest**) |

**Deployment readiness: NOT READY** until Critical C1–C4 close.

---

## 6. Outstanding operational tasks

1. Land / review / deploy the commercial WIP tree to a release branch → Production  
2. Apply AUTH/COM/OPS migrations; regenerate DB types  
3. Complete [ACQ §27 live Stripe checklist](../115-acq-001-self-service-customer-acquisition/27-slice-c-implementation.md)  
4. Configure production env matrix (Stripe SaaS, Resend, `NEXT_PUBLIC_APP_URL`)  
5. Confirm Supabase backup/PITR for the production project  
6. Decide push messaging: exclude from V1.0 marketing or resume PUSH-001 with device evidence  
7. Ops-enable owner payouts only when destination readiness allows  
8. Issue Commercial Launch authorization after C1–C4 + H1 process  

---

## 7. Recommended release sequence

```
RC1 (this report)
  → Beta environment deploy (close C1–C4 on staging/prod-beta)
  → Design-partner beta (manual or self-serve with ops watch)
  → Limited Production (after Commercial Launch authorize + live Stripe PASS)
  → GA (after EP-019 Accept/PASS or explicit risk accept + push decision)
```

Do **not** begin new feature packages during this sequence unless a Critical defect blocks an approved V1.0 workflow.

---

## 8. Estimated Version 1.0 completion

| Module | % | Basis |
|--------|---|-------|
| Overall | **~89%** | Workflow-weighted |
| Customer onboarding / acquisition | ~98% eng / ~85% ops | Live Stripe pending |
| Core platform | ~78% | Ship drift + push + security sign-off |
| Property operations | ~85% | Strong; ACL/ACH residuals |
| Facility operations | ~90% | FAC-002 PASS; 1 SKIP |
| Subscriptions / licensing | ~92% | Eng strong; ops walk pending |
| Commercial Launch | 0% authorized | Governance |

---

## 9. Final verdict

# READY FOR BETA

**Not** READY FOR LIMITED PRODUCTION until Critical blockers **C1–C4** are closed.  
**Not** READY FOR GENERAL AVAILABILITY.

Interactive summary: open the RC1 canvas beside chat (path recorded in the agent response).
