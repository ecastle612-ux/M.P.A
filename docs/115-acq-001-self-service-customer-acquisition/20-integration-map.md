# 20 — Integration Map

**Package:** ACQ-001  
**Status:** Draft — Ready for Approval

---

## Reuse (do not duplicate)

| Concern | Existing system | ACQ role |
|---------|-----------------|----------|
| Checkout Session / Portal | BILL-001 SubscriptionService | Call from Checkout entry |
| Webhooks / mirror / entitlements | BILL-001 | Unchanged |
| Hard limits | Entitlement gate (Phase C) | Rely on |
| Opportunity / activation | COM-001 | Self-serve may create thin opportunity or skip to activation |
| Org + Org Admin provision | AUTH-001 | Unchanged pipeline |
| Welcome / first-login | AUTH credentials | Unchanged |
| Guided Setup / Finish Setup | Setup module | Redirect into |
| Commercial Active | Commercial activation | Unchanged |
| In-app notify on sub change | SaaS lifecycle notify | Unchanged |
| Ops events | OPS-001 emitters | Emit via existing COM/AUTH/BILL |
| Nav module gating | Shell entitledModules | Unchanged |
| Capability matrix | AUTH-001 / BILL plans | Pricing view only |

---

## New surfaces (ACQ Implement only after Approve)

| Surface | Type |
|---------|------|
| Landing, Tour, Pricing, FAQ, Contact Sales | Public UI |
| `/acquire/success|canceled|error` | Public UI |
| Checkout entry client wiring | Thin API client |
| Funnel analytics | Events |
| Optional public Checkout Session route hardening | API guardrails for plan allow-list |

---

## Explicitly out of scope for ACQ

| Item | Owner |
|------|-------|
| Rent payments / Connect | API-005 / FIN / PAY |
| Master Admin CRM redesign | COM / ADMIN |
| Founder grant UI | Master Admin |
| Push certification | PUSH-001 |
| Performance cert | EP-019 |
