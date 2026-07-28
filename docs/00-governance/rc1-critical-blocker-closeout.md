# RC1 Critical Launch Blocker Closeout

**Type:** Release engineering attestation  
**Date:** 2026-07-28  
**Release candidate:** RC1  
**Production Supabase:** `mpa-prod` (`vahnmcrpnuggxkivynvo`)  
**Policy:** [Implementation Gate](./implementation-gate.md) · [RC1 report](./v1-0-launch-readiness-report-rc1.md)

> Scope: eliminate **Critical** deployment blockers only. No new business features.

---

## Critical blocker status

| ID | Blocker | Status | Evidence |
|----|---------|--------|----------|
| **C1** | Ship-tree drift | 🟡 **Engineering closed on `release/rc1`** — deploy to Vercel still required | Branch `release/rc1` lands AUTH/COM/OPS/ACQ/BILL/FAC WIP |
| **C2** | Migrations on Production | ✅ **CLOSED** (attested) | AUTH/COM/OPS/FAC already on `mpa-prod`; applied `auth001_invitation_property_scopes` 2026-07-28 |
| **C3** | Live Stripe SaaS operator checklist | 🔴 **OPS PENDING** | Checklist: [ACQ §27](../115-acq-001-self-service-customer-acquisition/27-slice-c-implementation.md) + [RC1 Stripe runbook](./rc1-stripe-saas-operator-runbook.md) |
| **C4** | Production env matrix | 🟡 **Doc ready / Vercel values OPS PENDING** | [Env matrix](../68-pr-002-production-deployment/02-environment-matrix.md) + `apps/web/.env.example` |
| **C5** | Production build | ✅ **CLOSED** (working tree) | `pnpm --filter @mpa/web build` PASS 2026-07-28; re-attest on ship commit |

---

## C2 — Migration attestation (`mpa-prod`)

### Present (required for Checkout → provision → activate)

| Object | Present |
|--------|---------|
| `organization_provision_requests` | ✅ |
| `commercial_activation_requests` | ✅ |
| `saas_webhook_events` | ✅ |
| `membership_property_scopes` | ✅ |
| `organization_invitations.property_ids` | ✅ (applied 2026-07-28) |
| AUTH-001 Slices A–E migrations | ✅ (remote versions may differ from local filenames) |
| COM-001 Slices A–E migrations | ✅ |
| OPS-001 Slices A–D migrations | ✅ |
| FAC-002 Slices A–D migrations | ✅ |

### Intentionally not required for RC1 Critical (High residuals)

| Local migration set | Prod | Notes |
|---------------------|------|-------|
| FIN-003 Phase A–E | ❌ not applied | Owner payouts remain ops-gated (`FIN003_TRANSFERS_ENABLED`); High **H3** |
| PAY-001 settlement | ❌ not applied | Settlement foundation; not on Critical acquisition path |

Database TypeScript types: Critical patches applied to `packages/supabase/src/types.ts` (`property_ids`, `membership_property_scopes`). Full regen deferred — breaks unrelated selects until a dedicated types-alignment slice.

---

## C3 / C4 — Operator actions still required

These cannot be closed from git alone:

1. Set Vercel Production env per updated matrix (SaaS billing + Resend live).  
2. Point Stripe SaaS webhook to `https://www.my-property-assistant.com/api/webhooks/saas/stripe`.  
3. Execute [RC1 Stripe SaaS operator runbook](./rc1-stripe-saas-operator-runbook.md) and check every box.  
4. Deploy `release/rc1` to Production (or beta alias) after green build on the ship commit.

---

## Deploy sequence (binding)

```
1. Merge/push release/rc1
2. Confirm Vercel env matrix (C4)
3. Deploy
4. Re-run next build attestation on deployed SHA (C5)
5. Run Stripe SaaS operator runbook (C3)
6. Only then seek Commercial Launch authorize (H1)
```

**Verdict after this closeout:** Critical **engineering** blockers for RC1 are closed except **C3 ops run** and **C4 Vercel value confirmation** + **C1 deploy**. Ready for beta deploy ops; not Limited Production until C3–C4 ops PASS + H1.
