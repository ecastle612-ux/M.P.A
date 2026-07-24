# 06 — Security and Compliance

**Package:** PAY-001  
**Status:** 📝 Draft (amended · [11](./11-architecture-amendments.md))

---

## Custody & compliance

| Rule | Binding |
|------|---------|
| No **new** distributable platform rent float for **destination-enrolled** orgs | **Yes** |
| Destination charges → org settlement Express (locked shape) | **Yes** |
| Application fee = disclosed platform revenue only | **Yes** |
| `legacy_platform` collections never FIN-003-transferable | **Yes** |
| Historical platform float: leave in place; no automatic sweep | **Yes** ([03](./03-payment-routing.md)) |
| US / USD first unless Approve expands | **Yes** |
| Money transmitter posture | Orchestrate; Stripe holds settlement |
| Owner payouts | Not in PAY-001 |

---

## Secrets & PCI

| Control | Requirement |
|---------|-------------|
| Stripe secrets | Server-only; PaymentProvider adapter |
| No card data in M.P.A. DB | Retain API-005 tokenization model |
| Webhook signatures | Verify on `/api/webhooks/payments/*` |
| Connect secrets | Remain on Connect rail; do not share with SaaS |
| Client | Never receives destination account ids to set; Checkout URLs only |
| Destination resolution | **Server-only** from org settlement row — never trust client metadata for destination |

---

## RBAC

| Action | Capability guidance |
|--------|---------------------|
| Initiate resident payment | Existing resident / billing paths |
| Refund | Existing PM financial capabilities (tighten if Approve requires) |
| View settlement mapping / ops | `financial:*` / ops roles — least privilege |
| Toggle funding kill switch | Restricted ops / Master Admin |
| Reconcile apply | Restricted ops; audited |
| Create owner transfers | **Forbidden in PAY-001** |

---

## Kill switches

| Switch | Effect |
|--------|--------|
| Env destination funding enable | Master off switch for PAY-001 routing |
| Org destination enrollment / funding enable | Per-org enrollment |
| FIN-003 transfer enable | **Separate** — must remain off; PAY-001 must not flip it |

**Production:** Destination-enrolled orgs **hard-block** when funding off or settlement not ready — **no** silent legacy fallback ([03](./03-payment-routing.md)).

---

## Money-safety controls

| Control | Binding |
|---------|---------|
| Cross-org destination forbid | Destination `acct_…` must equal org’s settlement account |
| Idempotent create | Attempt-keyed idempotency on Checkout/PI create |
| Metadata trust | Webhook re-derives org from durable mapping / server metadata — not client |
| No invented settlement credit | APIs must not credit Express cash without Stripe evidence |
| Platform float monitoring | Alert on unexpected `legacy_platform` success while enrolled + funding on |
| Freeze funding | Blocks new creates immediately |

---

## Audit

Minimum append-only events:

| Event | When |
|-------|------|
| `funding.charge.routed` | Destination charge created |
| `funding.settlement.mapped` | Mapping persisted |
| `funding.charge.settled` | Payment succeeded |
| `funding.refund.*` | Refund lifecycle |
| `funding.ach_return.*` | ACH return lifecycle |
| `funding.dispute.*` | Dispute lifecycle |
| `funding.reversal.detected` | Reversal after possible FIN-003 use (handoff) |
| `funding.kill_switch.changed` | Flag changes |
| `funding.reconcile.apply` | Ops reconcile |
| `funding.alert.legacy_while_enrolled` | Unexpected legacy success |

---

## Cross-org isolation

- Settlement account resolution always org-scoped.  
- Mapping rows include `organization_id`.  
- Never allow charge destination = another org’s Express account.  
- Webhook apply must re-derive org from durable mapping — not trust client.

---

## ADR-024

| Rail | Isolation |
|------|-----------|
| Payments | PAY-001 / API-005 (refund/dispute/ACH authority) |
| Connect account status | FIN-003 webhooks (readiness mirror) |
| SaaS | BILL-001 only |
| Owner transfers | FIN-003 Phase C (future) — not PAY-001 |
