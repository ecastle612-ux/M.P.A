# Phase 12 — Provider Abstractions

Vendor-neutral boundaries per MHF-015. Implement interfaces first; wire real providers in later INT-* phases.

---

## Design principles

1. **Interface in shared package** — contracts usable by web, future mobile, edge functions
2. **Provider registry** — org-level or env-level provider selection
3. **Idempotent webhooks** — external callbacks map to internal request IDs
4. **Audit everything** — provider requests/responses logged (redact PII in logs)
5. **Stub-first** — local dev and CI use noop providers

---

## SignatureProvider

```typescript
interface SignatureProvider {
  readonly key: string;
  createEnvelope(input: CreateSignatureEnvelopeInput): Promise<SignatureEnvelopeRef>;
  getEnvelopeStatus(ref: SignatureEnvelopeRef): Promise<SignatureEnvelopeStatus>;
  cancelEnvelope(ref: SignatureEnvelopeRef): Promise<void>;
  handleWebhook(payload: unknown, headers: Record<string, string>): Promise<SignatureWebhookResult>;
}
```

**Future vendors:** Dropbox Sign (HelloSign), DocuSign, Adobe Acrobat Sign, SignNow, PandaDoc (INT-202)

**Document types:** lease, renewal, addendum, pet, parking, ACH, background auth, credit auth, rules, move-in/out inspection

> **Superseding design:** After Approve, [API-004 — Electronic Signatures & Digital Lease Execution](../50-api-004-electronic-signatures/README.md) is authoritative for `SignatureService` / `SignatureProvider` / Dropbox Sign-first adapters, multi-signer packages, vault certificates, and Ops/Command Center. This Phase 12 stub remains the historical interface sketch.

---

## ScreeningProvider

```typescript
interface ScreeningProvider {
  readonly key: string;
  submitApplication(input: ScreeningApplicationInput): Promise<ScreeningCaseRef>;
  requestAuthorization(ref: ScreeningCaseRef): Promise<AuthorizationUrl | void>;
  getCaseStatus(ref: ScreeningCaseRef): Promise<ScreeningCaseStatus>;
  fetchReport(ref: ScreeningCaseRef): Promise<ScreeningReportSummary>;
  handleWebhook(payload: unknown, headers: Record<string, string>): Promise<ScreeningWebhookResult>;
}
```

**Future vendors:** TransUnion, RentPrep, build-in-house (INT-201)

**Workflow states:** application → authorization → identity → credit → criminal → eviction → income → complete

> **Superseding design:** After Approve, [API-003 — Background Screening & Applicant Verification](../48-api-003-background-screening/README.md) is authoritative for `ScreeningService` / `ScreeningProvider` / Checkr-first adapters, FCRA consent, adverse action, retention, and Ops/Command Center. This Phase 12 stub remains the historical interface sketch.

---

## PushProvider

```typescript
interface PushProvider {
  readonly key: string;
  registerDevice(input: RegisterDeviceInput): Promise<DeviceRegistration>;
  sendNotification(input: PushNotificationInput): Promise<PushDeliveryResult>;
  validateSubscription(subscription: PushSubscriptionJSON): Promise<boolean>;
}
```

**Future vendors:** OneSignal (API-001 / ADR-017 Proposed), Web Push (native), Firebase/APNs via future adapters

**Notification types:** announcement, message, maintenance, lease, payment, inspection, emergency

**Respects:** `notification_preferences`, quiet hours, org emergency override

> **Superseding design:** After Approve, [API-001](../44-api-001-onesignal-notification-foundation/README.md) is authoritative for production push (`NotificationProvider` + OneSignal). This Phase 12 stub remains the historical interface sketch.

---

## Registration pattern

```
apps/web/src/lib/integrations/
  providers/
    signature/
      types.ts
      noop.provider.ts
      registry.ts
    screening/
    push/
```

Environment:

```
SIGNATURE_PROVIDER=noop
SCREENING_PROVIDER=noop
PUSH_PROVIDER=noop
```

---

## Testing

- Unit tests per provider interface with noop
- Contract tests with recorded fixtures when real vendor selected
- No vendor API keys in CI
