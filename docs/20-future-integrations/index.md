# 20 — Future Integrations

## Integration Philosophy

M.P.A. owns the **workflow graph**. Third-party systems own specialized capabilities. Integrate at boundaries — never rebuild what a proven provider does better.

**Rule:** Every integration connects to a defined workflow stage (05) and maps to the event system (ADR-005).

---

## Integration Categories

### Financial & Payments

| Provider | Workflow | Integration Point | Priority |
|----------|----------|-------------------|----------|
| **Stripe Connect** (recommended first) / Finix / Dwolla / Authorize.net | Rent collection, vendor payouts | Edge Functions + webhooks — design: [API-005](../51-api-005-resident-payments-billing/README.md) (INT-101–104) | P0 (Phase 6+) |
| **QuickBooks Online** | Owner reporting, bookkeeping | Export/sync Edge Function | P1 |
| **Xero** | Owner reporting, bookkeeping | Export/sync Edge Function | P2 |
| **Plaid** | Bank account verification / ACH specialist | PaymentProvider adapter after Stripe — design: [API-005](../51-api-005-resident-payments-billing/README.md) (INT-102) | P3 |

### Leasing & Screening

| Provider | Workflow | Integration Point | Priority |
|----------|----------|-------------------|----------|
| **Checkr** (recommended first) / **TransUnion SmartMove** / RentPrep / Equifax | Tenant screening | Webhook + Edge Function — design: [API-003](../48-api-003-background-screening/README.md) (INT-201) | P1 (Phase 5) |
| **Dropbox Sign** (recommended first) / **DocuSign** / Adobe Acrobat Sign / SignNow / PandaDoc | Lease signing & digital execution | Webhook + Edge Function — design: [API-004](../50-api-004-electronic-signatures/README.md) (INT-202) | P1 (Phase 5) |
| **Zillow Rental Manager** | Listing syndication | API integration | P2 |
| **Apartments.com** | Listing syndication | API integration | P2 |

### Communication

| Provider | Workflow | Integration Point | Priority |
|----------|----------|-------------------|----------|
| **Resend** (or Postmark) | Transactional email | Edge Function | P0 (Phase 1) |
| **Twilio** | SMS notifications | Edge Function | P1 |
| **SendGrid** | Email (alternative) | Evaluate vs Resend | P3 |

### Documents & Storage

| Provider | Workflow | Integration Point | Priority |
|----------|----------|-------------------|----------|
| **Supabase Storage** | All document workflows | Native — design: [API-002A](../46-api-002a-universal-media-foundation/README.md) (INT-901) | P0 |
| **Google Drive** | Document import | OAuth + import Edge Function | P3 |
| **Dropbox** | Document import | OAuth + import Edge Function | P3 |

### AI & Search

| Provider | Workflow | Integration Point | Priority |
|----------|----------|-------------------|----------|
| **OpenAI** | All AI capabilities | Edge Functions | P0 (Phase 3+) |
| **Anthropic Claude** | AI fallback / specific capabilities | Edge Functions | P3 |
| **pgvector** | Embeddings / semantic search | PostgreSQL extension | P1 |

### Compliance & Legal

| Provider | Workflow | Integration Point | Priority |
|----------|----------|-------------------|----------|
| **State-specific lease templates** | Lease signing | Template library + jurisdiction mapping | P1 |
| **NARPM / NAR resources** | Compliance reference | Knowledge base content | P3 |

### Observability

| Provider | Workflow | Integration Point | Priority |
|----------|----------|-------------------|----------|
| **Sentry** | Error tracking | SDK in web + Edge Functions | P0 (Phase 10) |
| **Vercel Analytics** | Web Vitals | Native | P0 |
| **Datadog / Grafana** | Infrastructure monitoring | P2 |

---

## Integration Architecture Pattern

All integrations follow the same pattern:

```
External Provider
        │
        ▼
  Webhook / API call
        │
        ▼
  Edge Function (verify, validate)
        │
        ▼
  integration_webhook_events (store raw event)
        │
        ▼
  Process + update business data
        │
        ▼
  Emit domain_event
        │
        ▼
  Downstream workflow continues
```

### Required for Every Integration

| Requirement | Detail |
|-------------|--------|
| Webhook signature verification | Provider-specific |
| Idempotency | `integration_idempotency_keys` |
| Raw event storage | `integration_webhook_events` before processing |
| Error handling | Retry with exponential backoff; dead letter after 5 attempts |
| Status dashboard | PM admin can see integration health per org |
| Credential storage | Supabase secrets or org-level OAuth tokens in `integration_credentials` |

---

## Marketplace Expansion (Future)

The Vendor Marketplace is designed to expand beyond maintenance:

| Category | Timeline | Integration |
|----------|----------|-------------|
| Maintenance contractors | Phase 3–4 | Core marketplace |
| Cleaning services | Phase 4+ | Marketplace category |
| Landscaping | Phase 4+ | Marketplace category |
| Inspection services | Phase 5+ | Marketplace + leasing workflow |
| Legal services | Phase 7+ | Marketplace + compliance workflow |
| Insurance providers | Phase 8+ | Marketplace + property setup |

Each category adds a `marketplace_service_category` and matching rules — not a new system.

---

## Data Export & Portability

Commercial SaaS requires data portability:

| Export | Format | Trigger |
|--------|--------|---------|
| Property portfolio | JSON + CSV | PM admin request |
| Financial ledger | CSV + QuickBooks format | PM admin request |
| Documents | ZIP archive | PM admin request |
| Owner reports | PDF | Already in document storage |

**Architecture:** Export Edge Function reads via RLS, generates archive, stores in Storage with signed download URL.

---

## Integration Decision Process

Before adding any integration:

1. Which workflow stage does it serve? (05)
2. Build vs integrate? (02 Product Philosophy)
3. Webhook or polling?
4. Data residency requirements?
5. Cost model impact on M.P.A. margins?
6. ADR required if new infrastructure dependency?

---

## Related Documents

- **05** Business Workflows — integration points per workflow
- **10** API Standards — webhook ingress pattern
- **17** Development Roadmap — integration timing
- **ADR-005** — domain events for integration handoffs
