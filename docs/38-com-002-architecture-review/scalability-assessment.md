# Scalability Assessment — COM-002

Question: Can **one person** operate M.P.A. commercially at rising customer counts?

Assumption: COM-002 automation goals are met; FO feature depth is separately honest.

---

## Operating load model

| Customers | Self-serve provisioning | Support load | Demo ops | Enterprise | One-person viable? |
|-----------|-------------------------|--------------|----------|------------|--------------------|
| **100** | Automated | Low | Manual snapshot updates OK | Occasional | **Yes** |
| **1,000** | Automated | Medium (billing edge cases) | Need sweeper + caps | Small pipeline | **Yes** with playbooks |
| **10,000** | Automated + reconciler | Needs tiered support / helpdesk | Overlay demo required | Dedicated sales time | **Marginal for one person** — commerce OK, support not |
| **100,000** | Requires mature observability, sharding considerations, multi-region story | Team | Platformized demo | Sales org | **No** for one person overall; **commerce automation still required** |

COM-002 correctly removes provisioning as the bottleneck. It does **not** remove customer support, Enterprise sales, or content/demo maintenance.

---

## Remaining manual processes (even after COM-002)

| Process | Who | Scales? |
|---------|-----|---------|
| Enterprise sales/contract/implementation | Humans | Linear with deals |
| Chargeback/dispute response | Humans + tools | Needs runbooks |
| Poison provisioning jobs | On-call | Must be rare |
| Demo snapshot curation | Product/ops | Periodic |
| Price/catalog changes | Eng/ops deploy | Controlled |
| Refund exceptions | Ops | Policy-bound |
| Security questionnaires (Enterprise) | Humans | Expected |
| FO feature delivery | Eng (separate gate) | Not COM-002 |

---

## Technical scale risks

| Risk | At 10k–100k orgs |
|------|------------------|
| Naive demo clones | **Breaks** |
| Single webhook worker | Backlog risk — need queue + concurrency |
| Entitlement checks | Must stay indexed / cached carefully |
| Reconciler full scans | Need incremental |
| Email deliverability | Dedicated domains/providers |
| Multi-tenant noisy neighbor | Existing platform concern |

---

## Verdict

- **Commerce automation design:** suitable foundation for 10k+ orgs **after amendments A3/A5**.  
- **One-person company:** realistic to **~1k** customers if Enterprise volume is low and FO honesty prevents support storms; not realistic at **100k** without a team — but that is not a COM-002 design failure.  
- **Highlight:** Do not pretend Demo + FO oversell can be operated by one person at scale — support will explode.
