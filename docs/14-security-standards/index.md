# 14 — Security Standards

## Security Posture

M.P.A. handles financial transactions, legal documents, personal screening data, and multi-party communication. Security is not a feature — it is a foundation. A single data leak or payment error can end the company.

**Target:** SOC 2 readiness architecture from day one (certification is a business decision, not engineering block).

---

## Authentication

| Requirement | Implementation |
|-------------|----------------|
| Identity provider | Supabase Auth |
| Session management | `@supabase/ssr` with HTTP-only cookies |
| Session refresh | Next.js middleware on every authenticated request |
| MFA | Available for PM org admins (enforce for production org owners) |
| Password policy | Supabase defaults + minimum 12 characters |
| OAuth | Google for PM portal (optional v1); evaluate per portal |

---

## Authorization (Four Planes)

See **09 Database Architecture** for data model. Security enforcement:

| Plane | Enforcement | Client Trust |
|-------|-------------|--------------|
| PM organization | RLS via `org_members` | Zero — RLS is authority |
| Property owner | RLS via `owner_property_access` | Zero |
| Tenant | RLS via `tenant_lease_access` | Zero |
| Vendor | RLS via `marketplace_vendor_users` | Zero |

### Rules

1. **RLS on every table** — no exceptions for "internal" tables
2. **Edge Functions re-verify** — JWT + business authorization check
3. **Service role key** — Edge Functions and CI only; never client-side
4. **No authorization in React** — UI hides elements for UX; RLS enforces security

---

## Data Protection

| Data Class | Protection |
|------------|------------|
| PII (names, emails, phones) | RLS + encrypted at rest (Supabase default) |
| Financial (payments, bank) | Stripe handles PCI; we store tokens only |
| Screening results | Encrypted, restricted role access, audit logged |
| Documents | Storage RLS + signed URLs (15-min TTL) |
| AI prompts | No PII unless necessary; sanitize inputs |

---

## Row Level Security Testing

**Mandatory:** Every RLS policy has integration tests verifying:

- Authorized user CAN access
- Unauthorized user CANNOT access
- Cross-organization isolation
- Cross-plane isolation (tenant cannot see other tenant's data)
- Service role bypass works for Edge Functions only

CI gate: PR cannot merge without RLS tests for affected tables.

---

## API Security

| Threat | Mitigation |
|--------|------------|
| JWT tampering | Supabase JWT verification |
| CSRF | SameSite cookies; Edge Functions use Bearer tokens |
| Injection | Parameterized queries (PostgREST/Supabase client); Zod validation |
| Prompt injection | Input sanitization; system prompt boundaries; RLS-scoped retrieval |
| Webhook spoofing | Provider signature verification (Stripe-Signature, etc.) |
| Replay attacks | Idempotency keys on all payment/integration endpoints |
| Rate limiting | Per-user and per-org limits on Edge Functions |

---

## Stripe Security

| Rule | Detail |
|------|--------|
| Connect onboarding | Stripe-hosted onboarding (no raw bank data in M.P.A.) |
| Webhook verification | `STRIPE_WEBHOOK_SECRET` validated on every event |
| Idempotency | All payment operations idempotent |
| Test mode | Staging and preview use test keys exclusively |
| Key rotation | Documented procedure; keys in env vars only |

---

## Storage Security

```
Bucket: documents
Path: {organization_id}/{entity_type}/{entity_id}/{filename}

RLS policy: user can access path iff they can access the DB record
Signed URLs: 15-minute TTL default
Upload validation: file type whitelist, max size per org tier
```

---

## Audit Trail

```sql
audit_log
  id, organization_id, actor_id, actor_type
  action, entity_type, entity_id
  changes       JSONB
  ip_address, user_agent
  created_at
```

**Logged actions:** Financial mutations, lease status changes, screening decisions, role changes, document access (sensitive), AI suggestion acceptance on high-stakes items.

---

## Secrets Management

| Secret | Location |
|--------|----------|
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Function env, CI only |
| `STRIPE_SECRET_KEY` | Edge Function env |
| `STRIPE_WEBHOOK_SECRET` | Edge Function env |
| `OPENAI_API_KEY` | Edge Function env |
| `NEXT_PUBLIC_*` | Client-safe only (URL, anon key, publishable Stripe key) |

**Never:** Secrets in git, client bundle, or Server Component props.

---

## Compliance Considerations

| Regulation | M.P.A. Posture |
|------------|----------------|
| Fair Housing | Screening workflow enforces consistent criteria; AI flags inconsistency |
| State landlord-tenant law | Jurisdiction field on properties; lease template versioning |
| PCI DSS | Stripe handles; we never touch card numbers |
| GDPR (future) | Data export and deletion architecture planned; not v1 blocker |
| SOC 2 (future) | Audit logs, access controls, encryption — architected now |

---

## Incident Response

| Severity | Response |
|----------|----------|
| Data breach suspected | Rotate keys, audit access logs, notify within 72 hours |
| Payment anomaly | Pause webhook processing, Stripe dashboard review |
| RLS policy failure | Hotfix migration, retroactive access audit |

---

## Security Review Checklist (Per PR)

- [ ] New tables have RLS policies
- [ ] RLS integration tests added
- [ ] No secrets in code
- [ ] Edge Function validates JWT
- [ ] User input validated with Zod
- [ ] AI prompts scoped to authorized data
- [ ] File uploads validated
- [ ] Audit log for sensitive mutations

---

## Related Documents

- **09** Database Architecture
- **10** API Standards
- **13** AI Strategy
- **16** Testing Standards
