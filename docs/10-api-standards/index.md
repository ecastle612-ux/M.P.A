# 10 — API Standards

## API Philosophy

M.P.A. APIs are **workflow-action oriented**, not REST resource catalogs. Endpoints represent business actions that move workflows forward.

**Naming principle:**
- ✅ `assign-vendor-to-work-order`
- ❌ `PATCH /work-orders/:id`

External clients (web today, mobile tomorrow) call the same contracts.

---

## API Layers

| Layer | Format | Purpose |
|-------|--------|---------|
| **Direct Supabase Client** | PostgREST auto-API | RLS-guarded reads, trivial inserts |
| **Edge Functions** | `POST /functions/v1/{action}` | Business mutations, integrations |
| **Next.js BFF** | `app/api/*` | Cookie bridging, SSR-only needs |
| **Webhooks (Inbound)** | Provider → Edge Function | Stripe, screening, eSignature |

---

## Edge Function Standards

### Naming

```
supabase/functions/
  assign-vendor/
  publish-owner-report/
  process-stripe-webhook/
  generate-ai-summary/
  complete-move-out/
```

Kebab-case, verb-first, workflow-describing.

### Request Format

```typescript
// POST /functions/v1/assign-vendor
{
  "work_order_id": "uuid",
  "vendor_id": "uuid",
  "notes": "optional string"
}
```

### Response Format

```typescript
// Success
{
  "data": { ... },
  "meta": { "request_id": "uuid" }
}

// Error
{
  "error": {
    "code": "VENDOR_COMPLIANCE_EXPIRED",
    "message": "Vendor liability insurance expired on 2026-03-12",
    "details": { "vendor_id": "uuid", "expired_document": "liability_insurance" }
  }
}
```

### Error Codes

| Code Pattern | Meaning |
|--------------|---------|
| `AUTH_*` | Authentication failures |
| `FORBIDDEN_*` | Authorization failures |
| `VALIDATION_*` | Input validation |
| `WORKFLOW_*` | Invalid state transition |
| `INTEGRATION_*` | External service failure |
| `INTERNAL_*` | Unexpected server error |

**Rule:** Error messages use property management language (see **07 UX Principles**).

---

## Versioning

All Edge Functions are implicitly `v1` via Supabase `/functions/v1/` path.

Breaking changes require:
1. New function (e.g., `assign-vendor-v2`)
2. ADR entry
3. Deprecation period documented

---

## Authentication

| Caller | Auth Method |
|--------|-------------|
| Web/mobile client | Supabase JWT in `Authorization: Bearer` |
| Edge Function → DB | Service role (function env only) |
| Webhook ingress | Provider signature verification (Stripe-Signature, etc.) |
| Cron jobs | Service role with internal secret |

Edge Functions **verify JWT** and **re-check authorization** before mutations — never trust client claims alone.

---

## Validation

All inputs validated with **Zod schemas** in a shared schemas directory:

```
src/domains/shared/schemas/
  assign-vendor.schema.ts
  publish-report.schema.ts
```

Same schema used in Edge Function and client for compile-time alignment.

---

## Idempotency

Required for: payments, webhooks, lease signing callbacks, vendor payouts.

```typescript
// Client sends
headers: { 'Idempotency-Key': 'uuid-v4' }

// Stored in
integration_idempotency_keys (key, response, created_at)
```

---

## Webhook Ingress

All inbound webhooks flow through:

```
Provider → Edge Function → Verify signature
                         → Check idempotency
                         → Write integration_webhook_events
                         → Process event
                         → Emit domain_event
```

Never process webhooks in Next.js `app/api` — Vercel serverless is wrong place for payment webhooks.

---

## Direct Supabase Client Usage

### Allowed

- Paginated list reads (properties, work orders, leases)
- Single record fetch by ID
- Trivial status updates where RLS is the only guard (e.g., mark notification read)

### Not Allowed

- Multi-table transactions
- Stripe API calls
- OpenAI API calls
- Cross-org marketplace operations
- Any mutation that emits domain events

---

## Realtime

Supabase Realtime channels scoped per organization:

```
org:{organization_id}:work_orders
org:{organization_id}:notifications
```

Tenants: `lease:{lease_id}:updates`
Vendors: `vendor:{vendor_id}:jobs`

**No global broadcast channels.**

---

## Rate Limiting

| Surface | Limit |
|---------|-------|
| Edge Functions (per user) | 60 req/min default |
| AI endpoints | 20 req/min per org |
| Webhook ingress | Provider-managed |
| Direct reads | Supabase project limits |

---

## OpenAPI Documentation

Maintain `docs/api/openapi.yaml` for Edge Functions. Updated on every API change. Future mobile team depends on this.

---

## Related Documents

- **08** Software Architecture
- **09** Database Architecture
- **14** Security Standards
- **18** Decision Log
