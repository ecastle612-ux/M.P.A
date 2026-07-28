# M.P.A. Version 1.0 Readiness Dashboard

**Type:** Living launch readiness report  
**Updated:** 2026-07-28  
**Mission:** [V1.0 Implementation Mission](./v1-0-implementation-mission.md)  
**Policy:** [Implementation Gate](./implementation-gate.md)  
**RC1 closeout:** [rc1-critical-blocker-closeout.md](./rc1-critical-blocker-closeout.md)

> Percentages are based on **complete customer workflows**, not code volume.

---

## Overall completion

| Module | Completion | Notes |
|--------|------------|-------|
| **Overall V1.0** | **~89%** | RC1: engineering Critical mostly closed; **C3/C4 ops + deploy** remain — [closeout](./rc1-critical-blocker-closeout.md) |
| Customer onboarding | **~98%** | Self-serve eng ready; live Stripe operator runbook ☐ |
| Core Platform | **~82%** | AUTH/COM/OPS on `release/rc1` + migrations attested on `mpa-prod` |
| Property Operations | **~85%** | Owner/tenant portals + money rails strong |
| Facility Operations | **~90%** | FAC-002 CERT PASS; facility-only org QA SKIP |
| Subscriptions / licensing | **~92%** | BILL A–C + public Checkout + ACQ cert |
| Commercial Launch | **Not authorized** | Awaiting C3–C4 ops PASS + H1 |

---

## Critical launch blockers (RC1)

| ID | Status |
|----|--------|
| C1 Ship-tree | 🟡 `release/rc1` — deploy to Vercel required |
| C2 Migrations | ✅ Attested on `mpa-prod` |
| C3 Stripe SaaS ops | 🔴 [Runbook](./rc1-stripe-saas-operator-runbook.md) |
| C4 Env matrix | 🟡 Doc ready — Vercel confirmation ☐ |
| C5 Production build | ✅ Working-tree PASS — re-attest on deploy SHA |

**Recommended next:** Deploy `release/rc1` → confirm Vercel env (C4) → run Stripe SaaS runbook (C3). No new features until Critical ops close.

## Latest completed feature

**RC1 Critical engineering closeout (2026-07-28)** — migration attestation, env matrix, Stripe runbook, types patch, release branch prep.

---

## Completed business capabilities (customer-usable)

- Login / first-login / contact verification (AUTH)
- Org provision + Org Admin credentials (AUTH/COM)
- Settings → Billing (Stripe Checkout + Customer Portal) for existing orgs
- Team invite + invitation lifecycle UI (resend / edit email / revoke)
- Secondary recovery contact + Mark organization active
- **Guided Setup → Finish Setup** (recovery + commercial Active required before “ready to operate”)
- **Hard entitlement enforcement** (seat + property limits; past_due blocks creates; module nav filter)
- **Public acquisition** (landing → tour → pricing → Checkout or Contact Sales)
- **Public Stripe Checkout** → provision via COM→AUTH (Slice B)
- **ACQ production readiness** (funnel analytics, SEO, a11y fixes, rate limits, cert matrix — Slice C)
- Property / unit / tenant / lease CRUD
- Rent collection path (API-005) · Owner payouts (FIN-003, ops-gated)
- Tenant Portal · Owner Portal
- Facility inventory / PM / calendar / inspections / reports (FAC-002)
- Vendor token workflows (VENDOR-001)
- Reporting engine (finance/ops foundations)

---

## Remaining business capabilities

| Capability | Gap | Gate |
|------------|-----|------|
| Live Stripe operator checklist sign-off | Ops run against live/test Stripe | Ops + Commercial Launch |
| Facility-only org end-to-end QA | R10 SKIP | Ops fixture |
| Full AUTH setup wizard (AI/Professional) | Draft / deferred | New authorize |
| SMS-first vendor journey | Partial | Product decision / package |
| ACH product cert depth | Thinner than card | Ops/cert |
| Owner property ACL schema | Interim ACL | Deferred post-OWNER-001 |
| Master Admin SaaS metrics (MRR/ARR) | Phase D | BILL-001 Phase D |

---

## Remaining integrations

| Integration | Status |
|-------------|--------|
| Stripe SaaS Billing | Real adapter; public Checkout wired; ACQ cert READY for ops run |
| Stripe Payments / Connect | Real; Connect transfers kill-switched |
| Resend email | Real; default noop without keys |
| OneSignal push | Real; device cert abandoned |
| Checkr / Dropbox Sign | Real adapters; default noop |
| Twilio SMS sends | Not in production send path |

---

## Remaining reports / notifications / permissions

- Facility report catalog: shipped under FAC-002; broaden as needed
- Push commercial reliability: abandoned track — do not resume without new decision
- Privileged recovery audit: implemented in AUTH-E WIP
- SaaS subscription change in-app notifications: shipped with Phase C

---

## Remaining onboarding work

1. ✅ Finish Setup in `/setup` (recovery + activate) — **done**
2. ✅ SetupGate allows Move In / financials during incomplete setup — **done**
3. ✅ BILL-001 Phase C — enforce seat/property limits — **done**
4. ✅ ACQ-001 Slice B — Checkout + COM + provision wire — **done**
5. ✅ ACQ-001 Slice C — production cert + analytics/SEO/a11y/ops — **done**
6. ☐ Ops live Stripe checklist (per [ACQ §27](../115-acq-001-self-service-customer-acquisition/27-slice-c-implementation.md))
7. Land AUTH/COM/OPS validated WIP on Production ship baseline

---

## Remaining deployment work

- Commit + deploy large AUTH/COM/OPS working tree (~300 files)
- Regenerate Supabase Database types (migrations ahead of generated types)
- Production env matrix for Stripe/Resend/OneSignal per environment
- Complete ACQ live Stripe operator checklist

---

## Open launch blockers

1. **Critical:** Ship-tree drift (~374 paths WIP vs Production HEAD)
2. **Critical:** AUTH/COM/OPS migrations + live Stripe SaaS checklist + env matrix
3. Commercial Launch **not authorized**
4. PUSH-001 commercial cert FAIL / abandoned; EP-019 Not Approved

**RC1 verdict:** [READY FOR BETA](./v1-0-launch-readiness-report-rc1.md) — not Limited Production / GA until Critical close.

---

## Technical debt blocking V1.0

- Stale generated DB types
- Stale root/docs README vs governance closeouts
- Manager Portal intentional FutureRelease (PMs use Ops) — not a blocker if sales language aligns

---

## Latest completed feature

**Version 1.0 Launch Certification RC1 (2026-07-27)**  
Workflow-weighted cert: READY FOR BETA. Critical blockers are deploy/ops (ship tree, migrations, live Stripe, env), not missing core acquisition engineering.

## Recommended next feature

**No new features.** Close Critical C1–C4 (land WIP, migrations, live Stripe checklist, env matrix), then seek Commercial Launch authorization for Limited Production.
