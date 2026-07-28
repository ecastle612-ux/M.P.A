# 14 — Deferred Beyond Version 1.0

**Package:** SIGN-002  
**Status:** Draft — Ready for Approval

These signature-related workflows are **intentionally excluded** from V1.0 SIGN-002 implementation.

| Item | Reason |
|------|--------|
| Wet-ink / notary / witness-required ceremonies | Separate legal product; API-004 non-goal |
| Multi-provider failover (DocuSign + SignWell mesh) | ADR-030 single provider; future adapter work |
| AHJ/regulator deep integrations (city portals) | Inspection email signer is enough for V1.0 |
| Resident-to-resident roommate agreements | Low V1.0 demand; use custom org doc if needed |
| Owner packet financial report e-sign (FIN reporting) | FIN packages defer live e-sign; use SIGN-002 C3 later if required |
| Marketplace vendor onboarding signatures outside org vendor directory | Out of FAC/VENDOR scope |
| Bulk 1:N blast policy campaigns with advanced HRIS sync | C2 is acknowledgement only; no HRIS |
| Embedded iframe signing as default UX | Email/provider redirect acceptable; embedded is optional enhancement |
| Automatic re-send storms / predictive remind AI | Manual + scheduled remind from API-004 only |
| Cross-org multi-tenant countersign (portfolio company) | Single-org packages only |
| Template marketplace / clause AI drafting that signs | AI never signs (API-004 invariant) |
| `move_out_form` first-class document_type | Metadata `kind=move_out_ack` sufficient; promote later via API-004 amendment |
| Separate consumer “Signatures” mobile app | Stay in module surfaces + portals |

If product later requires any row, open a new Design → Document → Approve cycle (amendment to SIGN-002 or successor package).
