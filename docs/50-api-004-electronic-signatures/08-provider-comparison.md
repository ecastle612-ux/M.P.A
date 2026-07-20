# 08 — Provider Comparison

**Package:** API-004  
**Status:** Draft — Ready for Approval

---

## Recommendation

**Phase 1 primary provider: Dropbox Sign (formerly HelloSign).**

Rationale relative to M.P.A. goals:

| Criterion | Dropbox Sign | Notes |
|-----------|--------------|-------|
| SMB / mid-market fit | Strong | Matches early M.P.A. customer profile |
| Embedded / email signing | Mature | Fits “stay in M.P.A.” progress + provider ceremony |
| API + webhooks | Mature | Required for Ops/timeline |
| Certificate of completion | Yes | Vault requirement |
| Sandbox | Available | CI/dev |
| Template lock-in risk | Manageable | Prefer M.P.A.-generated PDFs |
| Brand familiarity | High (HelloSign legacy) | INT-202 already cites HelloSign |

DocuSign remains the strongest enterprise alternative and should be the **first follow-on adapter**.

---

## Comparison matrix

| Capability | Dropbox Sign | DocuSign | Adobe Acrobat Sign | SignNow | PandaDoc |
|------------|--------------|----------|--------------------|---------|----------|
| Envelope / request API | ✔ | ✔ | ✔ | ✔ | ✔ |
| Webhooks | ✔ | ✔ (Connect) | ✔ | ✔ | ✔ |
| Embedded signing | ✔ | ✔ | ✔ | ✔ | ✔ |
| Multi-signer order | ✔ | ✔ | ✔ | ✔ | ✔ |
| Certificate of completion | ✔ | ✔ | ✔ | ✔ | ✔ |
| Enterprise SSO / advanced ID | Moderate | Strong | Strong | Moderate | Moderate |
| Document generation / CPQ | Light | Add-ons | Light | Light | Strong |
| Typical cost posture | Mid | Higher | Higher | Lower | Mid |
| M.P.A. Phase 1 fit | **Primary** | Future #1 | Future | Future | Future |

Scores are directional for product design, not a procurement award.

---

## Why not DocuSign first?

DocuSign is excellent and remains INT-202’s historical label. For M.P.A. Phase 1:

- Higher complexity/cost for initial leasing volume
- Dropbox Sign covers required ceremony + webhooks + certificates
- Abstraction makes a later DocuSign adapter non-breaking

Approve may still select DocuSign first if commercial/enterprise requirements demand it — the architecture does not hard-code Dropbox Sign beyond the recommended adapter order.

---

## Adapter roadmap

1. `noop` (exists)  
2. `dropbox_sign` (Phase 1)  
3. `docusign`  
4. `adobe_sign`  
5. `signnow` / `pandadoc` as demand appears  

**No provider failover mesh in Phase 1.**
