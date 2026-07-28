# 03 — Provider Abstraction

**Package:** API-004  
**Status:** Approved · Amended (ADR-030 SignWell)

---

## Invariant

```
Business modules
  → SignatureService
    → SignatureProvider
      → SignWellProvider | DocuSignProvider | AdobeSignProvider | SignNowProvider | PandaDocProvider | NoopProvider
```

No lease, applicant, Ops, or Command Center module imports SignWell / DocuSign / Adobe SDKs.

Dropbox Sign / HelloSign adapters are **retired** (ADR-030).

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

```typescript
interface SignatureProvider {
  readonly id: string; // "signwell" | "docusign" | "adobe_sign" | "signnow" | "pandadoc" | "noop"

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
SIGNATURE_PROVIDER=noop|signwell|docusign|adobe_sign|signnow|pandadoc
SIGNWELL_API_KEY=
SIGNWELL_WEBHOOK_ID=
SIGNWELL_MODE=sandbox|production
SIGNWELL_ALLOW_SIMULATE=true|false
SIGNWELL_ACCOUNT_ID=          # optional
SIGNWELL_API_BASE_URL=        # optional
```

Org settings may override env default (same pattern as screening).

Retired env (do not set): `DROPBOX_SIGN_*`, `HELLOSIGN_*`.

---

## SignWell (V1.0 adapter)

| Concern | Design |
|---------|--------|
| Product | SignWell email or embedded signing |
| Auth | `X-Api-Key` (server-only) |
| Sandbox | `test_mode` + no-key local stub when `SIGNWELL_MODE=sandbox` |
| Webhooks | Event hash HMAC (`type@time` with webhook ID) → `/api/webhooks/signature/signwell` → `SignatureService` |
| Artifacts | Download completed PDF; audit trail embedded (certificate companion from same PDF) |
| Retries | 429 / 5xx exponential backoff in adapter |
| Mapping | SignWell statuses/events → normalized events |

See [12 — SignWell migration](./12-signwell-migration.md).

---

## Future adapters

| Provider | Notes |
|----------|-------|
| DocuSign | INT-202 historical candidate; envelope + Connect webhooks |
| Adobe Acrobat Sign | Enterprise agreements |
| SignNow | Cost-sensitive alternative |
| PandaDoc | Strong templates; may overlap document generation |

Each adapter implements the same `SignatureProvider` interface. Template merge remains in M.P.A. where possible so vendor template lock-in is minimized.

---

## Noop provider

Local/CI: creates fake envelope IDs, can simulate webhook via authenticated sandbox endpoint (`PUT` simulate). Never contacts external network.
