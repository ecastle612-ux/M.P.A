# 05 — Document Generation

**Package:** API-004  
**Status:** Draft — Ready for Approval

---

## Purpose

Signing packages need **correct PDFs** before any provider call. Document generation is an M.P.A. concern (templates + merge + preview). Providers receive final PDFs (or provider templates only when explicitly chosen — Phase 1 prefers M.P.A.-owned PDFs to reduce lock-in).

---

## Supported document types

| Type | Phase 1 | Source |
|------|---------|--------|
| Leases | ✔ | Lease template + merge |
| Lease renewals | ✔ | Renewal template |
| Pet agreements | ✔ | Addendum template |
| Parking agreements | ✔ | Addendum template |
| Move-in forms | ✔ | Form template |
| Inspection forms | ✔ | Form template |
| Owner agreements | ✔ | Owner template |
| Vendor agreements | ✔ | Vendor template |
| General PDF templates | ✔ | Org template library |
| Employment documents | Future | Reserved |
| Uploaded ad-hoc PDF | ✔ | Direct upload via API-002A media |

---

## Template engine (conceptual)

```
Template (versioned)
  → Merge context (lease, parties, property, unit, money, dates)
  → Render engine (HTML→PDF or DOCX→PDF — implementation choice after Approve)
  → Preview (PM)
  → Package document (immutable bytes hash)
  → SignatureProvider.createEnvelope
```

### Merge field categories

| Category | Examples |
|----------|----------|
| Property | name, address, city, state, postal |
| Unit | unit number, beds/baths |
| Parties | applicant/tenant legal names, emails, phones |
| Lease | start/end, rent, deposit, late fee |
| Org | legal entity name, PM contact |
| Custom | org-defined fields |

Unknown required fields block `ready_to_send`.

---

## Preview

- Mandatory before first send (PM confirmation)
- Preview is watermarked “PREVIEW — NOT FOR SIGNATURE” when feasible
- Re-merge after data edits invalidates prior package documents (new hash)

---

## Versioning

| Asset | Behavior |
|-------|----------|
| Template | Versioned; packages pin `template_version_id` |
| Generated PDF | Content-addressed hash stored; vault ref after execute |
| Executed PDF | Separate vault artifact; never overwrite source |

---

## Multi-document packages

A package may include:

1. Primary lease PDF  
2. Addenda (pet, parking, rules)  
3. Disclosures  

All required documents must be signed per provider capability (single envelope multi-file vs separate envelopes). Phase 1 design: **one package → one provider envelope → N files** when provider supports it; otherwise sequenced packages with explicit PM UX.

---

## Relationship to API-002A

- Generated drafts may live as `media_assets` (organization plane) before send
- Executed + certificate stored as vault/media with stronger retention class
- Domain document records link category `executed_lease`, `signature_certificate`, etc.

See [07 — Document Vault Integration](./07-document-vault-integration.md).

---

## Out of scope for Phase 1 generation

- Full clause negotiation / redlining collaboration suite
- AI-authored lease drafting
- Jurisdiction auto-selection of statutory forms without counsel review (templates are org-managed)
