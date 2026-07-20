# 05 — Security Findings

**Package:** RC-001  
**Date:** 2026-07-17

---

## Review areas

| Area | Finding | Status |
|------|---------|--------|
| Permissions | Capability model (`financial:*`, `screening:*`, `signature:*`, etc.) enforced on API routes | Pass |
| Organization isolation | RLS + `organization_id` on domain tables; active org resolution | Pass |
| Storage access | Media intents + vault paths org-scoped (API-002A) | Pass (partial product surface) |
| Webhook validation | Screening / signature / payments verify signatures (or sandbox simulate gates) | Pass |
| Secrets | Provider secrets server-only; publishable Stripe/OneSignal keys only in `NEXT_PUBLIC_*` | Pass |
| Audit trails | Screening, signature, billing audit tables append-oriented | Pass |
| Rate limiting | Edge/API rate limits not productized | **Gap — document**; rely on platform defaults |
| PCI | PaymentProvider + token refs only; no PAN/CVV storage | Pass (architecture) |
| AI money movement | Forbidden by product rules | Pass (policy) |

---

## Findings

| ID | Severity | Finding | Action |
|----|----------|---------|--------|
| S1 | P1 | Explicit app-level rate limiting not implemented | Accept for Design Partner; add before open beta |
| S2 | P2 | Service-role used in webhook/reconciliation paths — ensure keys never client-exposed | Verified pattern; ops hygiene |
| S3 | Info | Tenant financial access via email↔tenant match | Document; ensure partner tenant emails match portal users |
| S4 | Info | Webhook simulate endpoints disabled in production unless allow flags | Keep `*_ALLOW_SIMULATE` false in partner prod |

---

## Required partner security checklist

- [ ] Supabase RLS enabled (default)  
- [ ] Service role key only on server  
- [ ] Production: `STRIPE_ALLOW_SIMULATE`, `CHECKR_ALLOW_SIMULATE`, `DROPBOX_SIGN_ALLOW_SIMULATE` = false  
- [ ] Separate sandbox vs production provider keys  
- [ ] Least-privilege org roles for partner staff  
- [ ] No secrets in chat/tickets
