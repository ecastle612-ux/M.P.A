# 03 — Surface Map

**Package:** UX-006  

| Surface | Patterns | Notes |
| --- | --- | --- |
| Property detail | A, B, C, D | Highest scroll (6.6 screens) |
| Unit / Tenant / Lease / WO / Vendor / Applicant detail | A, B, C, D | Same `DetailPageLayout` family |
| Properties / Units / Tenants / Maintenance / Leases lists | E, G | Collapse filters; keep create sticky if long |
| Financials hub + statement/charge pages | B, C, E | Disclose dense tables |
| Communications / Announcement detail | B, C | Sticky publish already on forms |
| AI Operations | F, G | Conversation-first |
| Migration | B, G | Sticky continue (partially present) |
| Settings / Master Admin | C, G | Collapse advanced |
| Auth | G only | UX-005 already premium; light density only |

---

## Delivery slices (post-Approve)

| Slice | Scope | Outcome |
| --- | --- | --- |
| S1 | Shared `MobileSectionNav` + `StickyActionBar` + `DisclosurePanel` | Reusable primitives |
| S2 | Property detail refactor into sections | ≤ ~2 screens default |
| S3 | Apply S2 pattern to Unit / Tenant / Lease / WO | Consistency |
| S4 | AI Ops mobile conversation layout | Composer always reachable |
| S5 | List filter disclosure + chrome trim | Faster lists |
| S6 | Certification screenshots + scroll re-measure | Scorecard |

---

## Success metrics

| Metric | Target |
| --- | --- |
| Property detail default screens (mobile) | ≤ 2.5 |
| Tap to Timeline / Documents / Financials | 1 |
| Primary action visible without scroll-back | 100% of S2–S4 surfaces |
| Information loss | None |
