# 03 — Provider Abstraction

**Package:** API-003  
**Status:** Draft — Ready for Approval

---

## Invariant

```
Business modules
  → ScreeningService
    → ScreeningProvider
      → CheckrProvider | SmartMoveProvider | RentPrepProvider | EquifaxProvider | NoopProvider
```

**Forbidden:** Applicant UI, lease service, Ops widgets, or Command Center calling Checkr/TransUnion SDKs or REST clients directly.

This extends (and will supersede at Approve) the Phase 12 sketch in [04-provider-abstractions](../41-phase-12-resident-experience-digital-operations/04-provider-abstractions.md) and the current noop stub under `apps/web/src/lib/integrations/screening/`.

---

## ScreeningService (domain)

Owns:

- Authorization (`screening:read|create|decide|admin`)
- Consent gates (cannot call provider consumer-report APIs without valid consent)
- Case/party/component state machine
- Normalized result persistence + vault refs
- Audit events
- Notification + timeline emission
- Retry scheduling for transient provider errors
- Decision + adverse action orchestration

Does **not** own:

- Vendor-specific field mapping details (delegated to adapter)
- Raw provider credentials (env / secrets manager)

---

## ScreeningProvider interface (design contract)

```typescript
interface ScreeningProvider {
  readonly id: "checkr" | "smartmove" | "rentprep" | "equifax" | "noop";

  /** Create or sync remote invitation / candidate / report order */
  createOrder(input: ScreeningOrderInput): Promise<ScreeningOrderRef>;

  /** Provider-hosted or M.P.A.-hosted consent URL if required */
  getAuthorizationUrl?(ref: ScreeningOrderRef): Promise<string | null>;

  getStatus(ref: ScreeningOrderRef): Promise<ProviderCaseStatus>;

  /** Normalized summary — never return raw PII dumps to callers without service gating */
  fetchNormalizedReport(ref: ScreeningOrderRef): Promise<NormalizedScreeningReport>;

  /** Downloadable artifacts (PDF) → service stores via vault/media */
  listArtifacts?(ref: ScreeningOrderRef): Promise<ProviderArtifact[]>;

  cancel?(ref: ScreeningOrderRef): Promise<void>;

  /** Verify signature + map to internal events */
  handleWebhook(
    payload: unknown,
    headers: Record<string, string>
  ): Promise<ScreeningWebhookResult>;
}
```

`ScreeningOrderInput` includes org id, case id, party identity payload (minimized), package code, callback URLs, and consent attestation id.

---

## Normalization model

Adapters map vendor payloads into M.P.A. shapes:

| Normalized field | Purpose |
|------------------|---------|
| `components[].type` | identity / credit / criminal / eviction / sex_offender / income |
| `components[].status` | pending / clear / review / fail / error / not_requested |
| `components[].flags[]` | Machine flags for PM UI (not auto-decision) |
| `scoreHints` | Optional vendor scores — display only; never sole decision |
| `completedAt` | |
| `expiresAt` | Provider or org policy |
| `rawArtifactRefs` | Internal only after vault storage |

UI and rules engines consume **normalized** data only.

---

## Registry

```
SCREENING_PROVIDER=noop | checkr | smartmove | rentprep | equifax
```

Optional per-org override in `organization_integrations` (future table) with RLS.

Local/CI: **noop** returns deterministic fake progress without external calls.

---

## CheckrProvider (first adapter)

Responsibilities:

- Create candidate / invitation / report package per Checkr product mapping
- Map webhooks (report completed, invitation completed, etc.)
- Pull PDF/artifacts into vault via ScreeningService + API-002A patterns
- Retry on 429/5xx with exponential backoff; dead-letter after N attempts

Secrets: `CHECKR_API_KEY`, webhook secret — server/Edge only.

---

## Webhook ingress

```
Provider → Edge Function /api/webhooks/screening/[provider]
  → verify signature
  → idempotency key = provider event id
  → persist integrations_webhook_events
  → ScreeningService.applyProviderEvent(...)
```

Aligns with architecture rule: Stripe/screening/e-sign ingress through idempotent webhook store.

---

## Retry & failover

| Capability | Phase |
|------------|-------|
| Idempotent createOrder | Phase 1 |
| Transient retry + DLQ | Phase 1 |
| Manual re-drive from Ops | Phase 1 |
| Automatic provider failover | Future |
| Multi-provider dual-run | Out of scope |

---

## Testing strategy

- Unit: each adapter maps fixtures → normalized report
- Contract: recorded Checkr webhook fixtures (no live keys in CI)
- Domain: consent gate blocks order without consent
- RLS: cross-org isolation on cases/reports
- QA-001: P1 workflow “start screening → consent → ready for review” after Approve implement
