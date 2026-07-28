# 08 — Provider Comparison

**Package:** API-004  
**Status:** Amended (ADR-030) — historical matrix retained

---

## V1.0 lock

**Production primary provider: SignWell** ([ADR-030](../18-decision-log/adr-030-signwell-as-primary-esign-provider.md)).

Dropbox Sign (formerly HelloSign) was the Phase 1 recommendation and implementation. It has been **retired from runtime** after feature-parity validation ([12 — SignWell migration](./12-signwell-migration.md)).

---

## Historical comparison matrix

| Capability | SignWell (V1.0) | Dropbox Sign (retired) | DocuSign | Adobe Acrobat Sign | SignNow | PandaDoc |
|------------|-----------------|------------------------|----------|--------------------|---------|----------|
| Envelope / request API | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Webhooks | ✔ (event hash) | ✔ | ✔ (Connect) | ✔ | ✔ | ✔ |
| Embedded signing | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Multi-signer order | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Certificate / audit trail | ✔ (in completed PDF) | ✔ | ✔ | ✔ | ✔ | ✔ |
| M.P.A. V1.0 fit | **Primary** | Retired | Future | Future | Future | Future |

Scores are directional for product design, not a procurement award.

---

## Adapter roadmap

1. `noop` (local/CI)  
2. `signwell` (**V1.0 production**)  
3. `docusign` (future)  
4. `adobe_sign` (future)  
5. `signnow` / `pandadoc` as demand appears  

**No provider failover mesh in V1.0.**
