# ADR-030: SignWell as the Primary Electronic Signature Provider (V1.0)

## Status
Accepted

## Date
2026-07-27

## Context
API-004 delivered a provider-abstracted electronic signature platform with **Dropbox Sign (HelloSign)** as the Phase 1 adapter (`SignatureService` → `SignatureProvider` → `DropboxSignProvider`). Product direction for M.P.A. Version 1.0 is to use **SignWell** as the sole production e-sign provider.

Requirements:

- Do **not** create a second signature platform or parallel abstractions.
- Keep `SignatureService`, `SignatureProvider`, workflows, notifications, audit, webhooks model, and database models.
- Replace only the concrete provider adapter, configuration, and docs.
- Stop if SignWell lacks a required V1.0 capability used by the current adapter.

Feature-parity analysis (see [12 — SignWell migration](../50-api-004-electronic-signatures/12-signwell-migration.md)) found **no critical V1.0 gaps** relative to the capabilities actually exercised by `DropboxSignProvider`.

## Decision
1. Adopt **SignWell** as M.P.A. V1.0’s **sole production** electronic signature provider.
2. Implement `SignWellProvider` behind the existing `SignatureProvider` interface; select via `SIGNATURE_PROVIDER=signwell`.
3. **Retire** Dropbox Sign / HelloSign adapters, env vars, and webhook aliases from the codebase.
4. Keep `noop` for local/CI without live keys.
5. Verify SignWell webhooks using official **event hash** verification (`HMAC-SHA256` of `type@time` with the **webhook ID** as the key — not a separate shared webhook secret).
6. Document future adapters (DocuSign, Adobe Sign, etc.) as optional later work; they are **not** V1.0 primaries.

## Consequences
**Easier:** Single commercial e-sign vendor for V1.0; JSON REST + `X-Api-Key`; clearer ops story; aligns product procurement with implementation.

**More difficult:** Operators must register SignWell webhooks and store `SIGNWELL_WEBHOOK_ID`; in-flight packages still stored as `provider=dropbox_sign` cannot be driven by the retired adapter (complete or void them before cutover, or leave as historical records).

## Alternatives Considered
- **Keep Dropbox Sign as primary; add SignWell as second adapter:** Rejected for V1.0 — product wants a single provider, not dual live integrations.
- **New `lib/signatures/` platform:** Rejected — duplicates API-004 and breaks the Implementation Gate invariant.
- **DocuSign as primary:** Rejected for V1.0 cost/complexity; remains a future adapter candidate.
- **Force migration despite API gaps:** Rejected — gate requires stop-on-critical-gap; none found for V1.0 used surface.

## Migration strategy
1. Record this ADR and update API-004 docs (SignWell primary; Dropbox Sign retired).
2. Ship `SignWellProvider` + registry + webhook route `/api/webhooks/signature/signwell`.
3. Replace env examples and Integrations / certification probes.
4. Remove `dropbox-sign-provider` and Dropbox/HelloSign env usage after automated tests pass.
5. Default examples remain `SIGNATURE_PROVIDER=noop` until operators configure SignWell.
