# COM-002 — Live Demo Architecture (A3)

**Parent:** [COM-002 Index](./index.md)  
**Status:** Draft  
**Amendment:** A3 — scalable tenancy (no naive full clones)  

---

## Goals

- No account · no payment · no real organization  
- Interactive · automatic reset · role switch  
- Separate demos: Property Manager, Facility Operations, Complete Platform  
- Isolated from production  
- **Scales** under abuse and concurrent use  

---

## Binding tenancy model (replaces clone-default)

| Layer | Design |
|-------|--------|
| **Immutable shared snapshot** | Versioned read-mostly dataset per demo product |
| **Session write overlay** | Mutations tagged with `demo_session_id` (or ephemeral overlay store); never mutate shared snapshot |
| **Isolation plane** | **Separate database/project** from production (mandatory — not schema-only) |
| **Reset** | Drop overlay rows for session; rebind to snapshot version |
| **Forbidden default** | Full per-session database clone / restore |

Copy-on-write full clones are **out of scope** for v1.

---

## Session model

```
DemoSession {
  id, product, persona, snapshotVersion
  createdAt, expiresAt, lastActiveAt
  writeOverlayRef
  conversionHint?
}
```

- Signed httpOnly cookie / token.  
- **TTL:** 2 hours · **Idle:** 30 minutes.  
- **Concurrency:** soft cap per IP; global cap with wait/queue UX.  
- Sweeper: every **5 minutes** (not daily-only).

---

## Demo products & honesty (A1)

| Demo | Depth | Labeling |
|------|-------|----------|
| Property Manager | Full interactive (certified PM surfaces) | Standard |
| Facility Operations | Product-shape / navigation demo | Banner: “Demonstration of Facility product areas — operational depth expands with Enterprise / FO readiness” |
| Complete | Launcher between PM + FO demo surfaces | Same FO honesty banner on FO side |

---

## Role switching

Demo chrome **View as** with label: “Demonstration roles — not your real team.”

Personas: Property Manager, Facility Operator (FO/Complete), Owner, Resident, Vendor — as product allows.

---

## Security & abuse

| Control | Requirement |
|---------|-------------|
| Secrets | Demo runtime cannot use production service keys |
| Uploads | **Disabled** by default |
| Export | Disabled |
| Rate limit | Session create + reset cooldown |
| Bot score / CAPTCHA | On session create when thresholds hit |
| Indexing | `noindex` |
| Outbound email/SMS | Stub / sink only |
| Payments | Simulated only — never live Stripe charges |
| Watermark | Synthetic data clearly fake |

---

## Reset strategy

| Trigger | Behavior |
|---------|----------|
| User Reset | Confirm → clear overlay (cooldown 30s) |
| TTL / idle | Destroy session + overlay |
| Snapshot deploy | New sessions get new version; old expire naturally |
| Sweeper | Purge abandoned overlays |

---

## Performance targets (design)

| Metric | Target |
|--------|--------|
| Session start p95 | < 2s (attach overlay, not clone DB) |
| Concurrent sessions | Hundreds–thousands with caps; horizontal overlay store |
| Reset p95 | < 1s |

---

## Analytics

Product entered, time in session, roles switched, resets, CTA clicks (Subscribe / Request Enterprise), funnel drop-off. No invasive replay of sensitive fields.

---

## Demo → Paid

1. **Start Subscription** → J1 (PM) with hints.  
2. **Request Enterprise** → J3 (FO/Complete interest).  
3. Demo session **never** becomes production org.  
4. Optional `demo_session_id` on Checkout metadata for attribution.

---

## Explicit non-goals

- Persisting demo work into paid orgs  
- Full DB clones per visitor  
- Claiming FO production depth before FO-READY  
