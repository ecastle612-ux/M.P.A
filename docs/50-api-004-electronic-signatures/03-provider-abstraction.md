# 03 — Provider Abstraction

**Package:** API-004  
**Status:** Draft — Ready for Approval

---

## Invariant

```
Business modules
  → SignatureService
    → SignatureProvider
      → DropboxSignProvider | DocuSignProvider | AdobeSignProvider | SignNowProvider | PandaDocProvider | NoopProvider
```

No lease, applicant, Ops, or Command Center module imports Dropbox Sign / DocuSign / Adobe SDKs.

This package **supersedes** the Phase 12 `SignatureProvider` sketch and the thin RX-001 stub as the authoritative design after Approve.

---

## SignatureService (domain)

Sole public write path. Responsibilities:

| Responsibility | Notes |
|----------------|-------|
| Authz | `signature:create|read|send|cancel|admin` (+ download least privilege) |
| Package CRUD | Draft → ready → send |
| Recipient resolution | From lease parties / manual add |
| Document attach | Template merge output or uploaded PDF |
| Provider orchestration | Create envelope, cancel, remind |
| Webhook apply | Normalize provider events → package/recipient status |
| Vault handoff | On complete: store executed + certificate |
| Notifications | Via NotificationService (API-001) |
| Timeline | Emit domain events |
| Retention hooks | Expiration / purge jobs (configurable) |

---

## SignatureProvider (interface)

Conceptual contract (TypeScript-shaped; not implementation):

```typescript
interface SignatureProvider {
  readonly id: string; // "dropbox_sign" | "docusign" | "adobe_sign" | "signnow" | "pandadoc" | "noop"

  createEnvelope(input: CreateEnvelopeInput): Promise<EnvelopeRef>;
  getEnvelopeStatus(ref: EnvelopeRef): Promise<EnvelopeStatus>;
  cancelEnvelope(ref: EnvelopeRef): Promise<void>;
  remindRecipient(ref: EnvelopeRef, recipientExternalId: string): Promise<void>;
  downloadExecutedDocuments(ref: EnvelopeRef): Promise<ExecutedArtifact[]>;
  downloadCertificate(ref: EnvelopeRef): Promise<ExecutedArtifact | null>;

  /** Verify webhook authenticity + map to internal events */
  parseWebhook(payload: unknown, headers: Record<string, string>): Promise<NormalizedSignatureEvent[]>;
}
```

### CreateEnvelopeInput (normalized)

- Organization + package IDs
- Documents (bytes or vault/media refs + filenames)
- Recipients (name, email, role, order/group, auth method)
- Subject / message
- Expiration
- Callback / metadata (M.P.A. package ID)

### NormalizedSignatureEvent

| Field | Purpose |
|-------|---------|
| `externalEnvelopeId` | Provider package/envelope ID |
| `externalEventId` | Idempotency key |
| `type` | `sent` / `viewed` / `signed` / `declined` / `completed` / `expired` / `cancelled` / `failed` |
| `recipientExternalId` | Optional |
| `occurredAt` | Provider timestamp |
| `ipAddress` / `userAgent` | When provided |
| `payloadDigest` | Hash for audit (not raw PII dump) |

---

## Registry

```
SIGNATURE_PROVIDER=noop|dropbox_sign|docusign|adobe_sign|signnow|pandadoc
DROPBOX_SIGN_API_KEY=
DROPBOX_SIGN_CLIENT_ID=
DROPBOX_SIGN_CLIENT_SECRET=
DROPBOX_SIGN_WEBHOOK_SECRET=
DROPBOX_SIGN_MODE=sandbox|production
```

Org settings may override env default (same pattern as screening).

---

## Dropbox Sign (Phase 1 adapter)

| Concern | Design |
|---------|--------|
| Product | Dropbox Sign (HelloSign) embedded or email request |
| Sandbox | Required for CI/dev without live keys |
| Webhooks | Signed callbacks → Edge Function → `SignatureService` |
| Artifacts | Download signed PDF + certificate of completion after `completed` |
| Retries | Provider + M.P.A. outbound retry with backoff |
| Mapping | HelloSign/Dropbox Sign statuses → normalized events |

**Commercial / legal terms:** Approve may lock vendor; this doc does not negotiate pricing.

---

## Future adapters

| Provider | Notes |
|----------|-------|
| DocuSign | INT-202 primary historical candidate; envelope + Connect webhooks |
| Adobe Acrobat Sign | Enterprise agreements; agreement + webhook model |
| SignNow | Cost-sensitive alternative |
| PandaDoc | Strong templates; may overlap document generation |

Each adapter implements the same `SignatureProvider` interface. Template merge remains in M.P.A. where possible so vendor template lock-in is minimized.

---

## Noop provider

Local/CI: creates fake envelope IDs, can simulate webhook via authenticated sandbox endpoint (`PUT`/`POST` simulate — same pattern as API-003 Checkr sandbox). Never contacts external network.

---

## Webhook ingress

```
Provider → Edge Function /api/webhooks/signature/[provider]
  → verify HMAC / signature header
  → persist raw event (redacted) to integrations_webhook_events
  → SignatureService.applyProviderEvent (idempotent)
  → update package/recipients
  → if completed: vault store + lease/resident side effects
  → notifications + timeline
```

Aligns with architecture rule: Stripe / screening / e-sign ingress through idempotent webhook store.

---

## Error & retry

| Class | Behavior |
|-------|----------|
| Transient (429/5xx) | Exponential backoff; Ops “Provider Failures” |
| Permanent (4xx auth) | Mark package `failed`; alert admin |
| Webhook verify fail | 401; do not apply |
| Duplicate event | No-op success |

**Provider failover** (auto switch Dropbox Sign → DocuSign) is **out of scope** for Phase 1.
