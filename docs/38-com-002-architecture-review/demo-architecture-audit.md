# Demo Architecture Audit — COM-002

## Challenge thesis

“Fully interactive + feels identical to production + per-session clone + three products + role switch + viral traffic” is **not automatically scalable**. Without a concrete tenancy model and honesty rules, Demo becomes the most expensive and riskiest COM-002 surface.

---

## Isolation

| Requirement | COM-002 | Assessment |
|-------------|---------|------------|
| Separate data plane | Stated (schema/DB/project) | Good intent; must pick **one** mandatory option at Approve |
| No production secrets | Stated | Pass |
| No real org rows | Stated | Pass |

**Gap:** “schema **or** DB **or** project” leaves implementers free to choose a weak schema-only split. For tens of thousands of orgs *and* public demo abuse, prefer **separate project/database** for demo.

---

## Security

Strong: rate limits, noindex, synthetic PII, no live Stripe charges, outbound stubbed.

Weak:

| Risk | Why |
|------|-----|
| Demo scraping | Full product UX without account = competitive intelligence + bot farming |
| Upload paths | “Quarantine if risky” is soft — default **disable uploads** in demo |
| Session fixation / token theft | Signing mentioned; rotation/binding to IP or UA not specified |
| FO overpromise | Demo of empty shells trains false confidence |

---

## Performance & scalability (A3)

Per-session full clone:

| Concurrent demos | Rough cost pattern |
|------------------|--------------------|
| 10 | Fine |
| 100 | Painful |
| 1,000+ | Likely untenable if each clone is a heavy dataset |

**Required default architecture to document:**

1. **Shared immutable snapshot** (read-mostly).  
2. **Session-scoped write overlay** (row-level session id or ephemeral schema with hard TTL).  
3. **Hard concurrency caps** + queue/wait UX.  
4. **Aggressive sweeper** (minutes, not daily-only).  

Daily sweeper alone is too slow for abuse.

---

## Reset strategy

User reset + TTL + sweeper: good. Missing:

- Reset storm protection (per-session cooldown).  
- Snapshot version skew messaging when product UI ships mid-session.

---

## Role switching

Good for sales. Risks: confusing “View as” with true multi-user; leaking entitlement edges. Require demo chrome labeling: “Demonstration roles — not your real team.”

---

## Demo data quality

Synthetic data must tell a **story** (delinquency, open work orders, attention ranks) or Mission Control feels empty. Package under-specifies narrative quality bars.

FO demo: if modules are shells, demo cannot claim parity with PM demo depth.

---

## Demo → Paid conversion

Correct that demo session ≠ production org. Good attribution via metadata.

Missing: abandoned demo retargeting policy (privacy); Enterprise CTA from demo for large portfolios.

---

## Scalability verdict

| Scale | Demo viable? |
|-------|----------------|
| Early launch | Yes with caps |
| 10k orgs (customers) | Yes if overlay model |
| Viral spike 5k concurrent demos | **No** on naive clones |

**Amendment A3 is blocking.**
