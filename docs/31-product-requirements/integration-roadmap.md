# Integration Roadmap (INT)

## Status

**Permanent — integration requirements registry**

Integration requirements define how M.P.A. connects to external systems. M.P.A. **owns the workflow graph**; integrations attach at boundaries (MHF-015, ADR-007).

Pattern reference: [20 Future Integrations](../20-future-integrations/index.md)

---

## Integration Principles

| Principle | Requirement |
|-----------|-------------|
| Workflow ownership | M.P.A. is system of record for operational state |
| Edge function mutations | External callbacks land in Edge Functions (ADR-007) |
| Idempotency | All inbound webhooks idempotent with deduplication keys |
| Event emission | Successful integration handoffs emit domain events (ADR-005) |
| Tenant isolation | Integration credentials scoped per organization |
| Graceful degradation | Core workflows function when integration unavailable |

---

## Category 1 — Payments & Banking

| ID | Integration | Priority | Workflow touchpoints | Phase |
|----|-------------|----------|---------------------|-------|
| INT-101 | Stripe (rent collection) — design: [API-005](../51-api-005-resident-payments-billing/README.md) | HIGH | Rent Collection, Move In | 8, 10 |
| INT-102 | Plaid (bank verification) — design: [API-005](../51-api-005-resident-payments-billing/README.md) | MEDIUM | Owner distributions, trust | 8 |
| INT-103 | ACH batch processing — design: [API-005](../51-api-005-resident-payments-billing/README.md) | MEDIUM | Rent Collection | 8 |
| INT-104 | Payment receipt webhooks — design: [API-005](../51-api-005-resident-payments-billing/README.md) | HIGH | Ledger, resident portal | 8, 10 |

**Requirements:**
- Resident and owner payment surfaces must not store raw card data in M.P.A. database
- Payment status reflected in lease and ledger within event-driven latency target
- Failed payment triggers automation sequence (see AUT-*)

---

## Category 2 — Screening & Leasing

| ID | Integration | Priority | Workflow touchpoints | Phase |
|----|-------------|----------|---------------------|-------|
| INT-201 | TransUnion / Checkr screening — design: [API-003](../48-api-003-background-screening/README.md) (Checkr recommended first) | HIGH | Move In | 5, 10 |
| INT-202 | DocuSign / HelloSign (Dropbox Sign) e-sign — design: [API-004](../50-api-004-electronic-signatures/README.md) (Dropbox Sign recommended first) | HIGH | Move In, Lease Renewal | 5 |
| INT-203 | Credit report storage (metadata) — covered by [API-003](../48-api-003-background-screening/README.md) vault/retention | HIGH | Tenant record | 5 |
| INT-204 | Application portal syndication | MEDIUM | Vacancy Fill | 9+ |

**Requirements:**
- Screening results attach to tenant/lease context — not orphaned PDFs
- E-sign completion updates lease status via webhook → domain event

---

## Category 3 — Communication & Notifications

| ID | Integration | Priority | Workflow touchpoints | Phase |
|----|-------------|----------|---------------------|-------|
| INT-301 | Push delivery (OneSignal default via abstraction; Firebase/APNs adapters future) — see [API-001](../44-api-001-onesignal-notification-foundation/README.md) + [ADR-017](../18-decision-log/adr-017-onesignal-as-primary-push-provider.md) (Proposed) | CRITICAL | MHF-001 all channels | 10 |
| INT-302 | Twilio SMS | CRITICAL | Emergency, fallback | 10 |
| INT-303 | Resend email (primary via EmailProvider abstraction; SendGrid adapter future) — see [INT-303 design package](../77-int-303-resend-email-provider/README.md) + [ADR-018](../18-decision-log/adr-018-resend-as-primary-transactional-email-provider.md) (Accepted) | CRITICAL | Announcements, invites, notify email channel | 10 |
| INT-304 | Translation API (multi-language) | HIGH | MHF-001 | 10 |
| INT-305 | In-app notification center | HIGH | All planes | 10 |

**Requirements:**
- Unified notification orchestration layer — not per-feature ad hoc sends
- Resident preferences honored before delivery (MHF-001)
- Read receipts and delivery analytics stored for PM visibility
- **API-001 (Draft):** OneSignal proposed as default push adapter behind `NotificationProvider` — [design package](../44-api-001-onesignal-notification-foundation/README.md), [ADR-017](../18-decision-log/adr-017-onesignal-as-primary-push-provider.md)

---

## Category 4 — Listings & Marketing

| ID | Integration | Priority | Workflow touchpoints | Phase |
|----|-------------|----------|---------------------|-------|
| INT-401 | Zillow / Apartments.com syndication | MEDIUM | Vacancy Fill | 9+ |
| INT-402 | MLS feed (where applicable) | LOW | Vacancy Fill | Post-launch |
| INT-403 | Google Business Profile | LOW | Property marketing | Post-launch |

**Requirements:**
- Listing data sourced from canonical property/unit records — no duplicate entry

---

## Category 5 — Accounting & ERP

| ID | Integration | Priority | Workflow touchpoints | Phase |
|----|-------------|----------|---------------------|-------|
| INT-501 | QuickBooks Online sync | HIGH | Accounting | 8 |
| INT-502 | Xero sync | MEDIUM | Accounting | 8 |
| INT-503 | Chart of accounts mapping per org | HIGH | Onboarding | 8 |

**Requirements:**
- ADR-010: defer full native accounting; integrations must not block ledger design
- Sync conflicts surface to PM — silent overwrite forbidden

---

## Category 6 — Maintenance & Field Operations

| ID | Integration | Priority | Workflow touchpoints | Phase |
|----|-------------|----------|---------------------|-------|
| INT-601 | Smart lock / access (August, etc.) | LOW | Move In, Maintenance | 6+ |
| INT-602 | IoT sensor alerts (integrate) | LOW | Preventive maintenance | 6+ |
| INT-603 | GPS / routing (vendor mobile) | MEDIUM | Vendor dispatch | 7 |

---

## Category 7 — Identity & Enterprise SSO

| ID | Integration | Priority | Workflow touchpoints | Phase |
|----|-------------|----------|---------------------|-------|
| INT-701 | SAML / OIDC enterprise SSO | MEDIUM | Org onboarding | Enterprise |
| INT-702 | SCIM user provisioning | LOW | Large org admin | Enterprise |

---

## Category 8 — AI & Data Services

| ID | Integration | Priority | Workflow touchpoints | Phase |
|----|-------------|----------|---------------------|-------|
| INT-801 | LLM provider (OpenAI / Anthropic) | HIGH | AI Operations | 11 |
| INT-802 | Document OCR / extraction | MEDIUM | Lease intake, invoices | 8, 11 |
| INT-803 | Embedding / vector search | MEDIUM | Portfolio intelligence | 11 |

**Requirements:**
- MHF-004: AI integrations assist — never auto-execute high-risk actions
- PII minimization in prompts; org-scoped retrieval

---

## Category 9 — Storage & Documents

| ID | Integration | Priority | Workflow touchpoints | Phase |
|----|-------------|----------|---------------------|-------|
| INT-901 | Supabase Storage (primary) | HIGH | All document attachments | Current — design owned by [API-002A](../46-api-002a-universal-media-foundation/README.md) |
| INT-902 | Virus scan on upload | MEDIUM | Security | 12 — hook designed in API-002A; implement after foundation |
| INT-903 | Long-term archival (cold storage) | LOW | Compliance | Post-launch — lifecycle hooks in API-002A |

---

## Integration Sequencing (Recommended)

```
Phase 5–6:  Screening, e-sign (INT-201, INT-202)
Phase 8:    Payments, accounting sync (INT-101, INT-501)
Phase 10:   Push, SMS, email (INT-301–303) — unblocks MHF-001
Phase 11:   LLM, OCR (INT-801, INT-802)
Phase 12:   Enterprise SSO, hardening
```

---

## Decision Points (from Roadmap 17)

Before implementing each integration category:

1. Confirm INT ID is in scope for the phase
2. Verify webhook and auth patterns in Edge Functions
3. Document failure modes and PM-visible error states
4. Add domain events for downstream automation

---

## Related Documents

- [Communication Platform](./communication-platform.md)
- [Future Integrations](../20-future-integrations/index.md)
- [Automation Roadmap](./automation-roadmap.md)
- [Must-Have Features](./must-have-features.md) — MHF-015
