# API-001 — OneSignal Notification Foundation

**Status:** Draft — Design → Document complete; awaiting Approve  
**Initiative ID:** API-001  
**Gate:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)  
**Provider decision:** [ADR-017](../18-decision-log/adr-017-onesignal-as-primary-push-provider.md) (Proposed)  
**Gate owner:** Product + Lead Architect + Security

---

## Executive Summary

API-001 establishes **OneSignal as M.P.A.'s production push notification provider** and defines the platform notification infrastructure that all modules must use.

This is not a feature bolt-on. It is M.P.A.'s **notification operating layer**:

```
Application Event
  → NotificationService
    → NotificationProvider (interface)
      → OneSignalProvider (default)
        → OneSignal Cloud
```

**Business logic never calls OneSignal directly.** Future providers (Firebase, APNs, FCM, Web Push) swap behind the same interface without changing workflow code.

### Relationship to prior work

| Package | Relationship |
|---------|----------------|
| [Phase 9](../29-phase-9-resident-communication-foundation/README.md) | Delivered announcements, QR, preferences placeholders, `resident_devices` |
| [MHF-001 extension](../43-mhf-001-unified-communication-platform/README.md) | Delivered in-app center + messaging; explicitly deferred OneSignal |
| [Phase 12 providers](../41-phase-12-resident-experience-digital-operations/04-provider-abstractions.md) | Defined `PushProvider` stub pattern — API-001 realizes the production push provider |
| [INT-301](../31-product-requirements/integration-roadmap.md) | PRR listed Firebase/APNs; ADR-017 selects OneSignal as primary while preserving abstraction |

### Explicitly out of scope (this package)

- SMS delivery (INT-302)
- Email delivery (INT-303)
- Native mobile apps
- AI-generated replies
- Redesign of existing PM/resident modules
- Application code, migrations, SDKs, or environment variable commits (Design/Document only)

---

## Documents in this package

| Doc | Purpose |
|-----|---------|
| [01 — Requirements Traceability](./01-requirements-traceability.md) | PRR IDs, capability mapping, deferred items |
| [02 — System Architecture](./02-system-architecture.md) | Layers, data flow, package boundaries |
| [03 — Provider Abstraction](./03-provider-abstraction.md) | `NotificationProvider` / OneSignal / swap strategy |
| [04 — Notification Event Model](./04-notification-event-model.md) | Categories, payload, workflow event routing |
| [05 — User Preferences](./05-user-preferences.md) | Push, quiet hours, emergency override, channels |
| [06 — Notification Center](./06-notification-center.md) | Inbox UX, filters, deep links, retention |
| [07 — Operations & Command Center](./07-operations-command-center.md) | Widgets + search indexing |
| [08 — Security and Secrets](./08-security-and-secrets.md) | Credentials, registration, rotation |
| [09 — Implementation Slices](./09-implementation-slices.md) | Independently deployable slices |
| [10 — Definition of Done](./10-definition-of-done.md) | Closeout checklist |
| [11 — Risk Analysis](./11-risk-analysis.md) | Risks, mitigations, open questions |

---

## Architecture (summary)

1. **Domain / workflow code** emits or already emits application events (or invokes `NotificationService` as the sole notification entrypoint).
2. **NotificationService** resolves recipients, applies preferences (quiet hours, category, property, emergency override), writes the in-app notification record, and enqueues provider delivery.
3. **NotificationProvider** is vendor-neutral.
4. **OneSignalProvider** is the default production implementation.
5. **In-app Notification Center** remains the durable inbox; push is a delivery channel, not the source of truth.

---

## Approval checklist

- [ ] Product sign-off on scope, categories, and event routing table
- [ ] Architect sign-off on architecture + provider abstraction
- [ ] Security sign-off on secrets model (08)
- [ ] ADR-017 Accepted (OneSignal as primary push provider)
- [ ] INT-301 / PRR notes updated to reflect OneSignal + abstraction
- [ ] Status on this README changed to **Approved**
- [ ] Implementation authorized only for approved slices in [09](./09-implementation-slices.md)

---

## Gate status

| Stage | State |
|-------|--------|
| Design | Complete (this package) |
| Document | Complete (this package + ADR-017 Proposed) |
| Approve | **Pending** |
| Implement | **Blocked** until Approve |

**Ready for Approval.**
