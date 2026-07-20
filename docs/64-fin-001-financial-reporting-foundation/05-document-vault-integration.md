# 05 — Document Vault Integration

**Package:** FIN-001  
**Status:** Design ✔ · Document ✔ · Approve Pending · Implement Blocked

---

## Intent

Every generated financial report PDF is a **first-class vault document**: org-scoped, property-linked, versioned, auditable, and downloadable through authorized APIs only.

Binary storage follows [API-002A](../46-api-002a-universal-media-foundation/README.md).  
Metadata / vault semantics follow [Phase 12 Document Vault](../41-phase-12-resident-experience-digital-operations/02-architecture-and-integration.md) and patterns proven in [API-004 vault integration](../50-api-004-electronic-signatures/07-document-vault-integration.md).

---

## Logical folder model

User-facing / product tree:

```
Documents
└── Properties
    └── {Property Name}
        └── Financial Reports
            └── {Year}
                └── {Month}
                    └── {Report Type} · v{N} · {timestamp}.pdf
```

This is a **logical** taxonomy. Physical object keys may flatten IDs while metadata preserves year/month/type/version for UI browse.

---

## Physical path convention (design)

Recommended key prefix (illustrative):

```
org/{organizationId}/properties/{propertyId}/financial-reports/{yyyy}/{mm}/{reportType}/v{version}-{contentHash}.pdf
```

Rules:

- Include `organizationId` for tenancy isolation  
- Never reuse the same object key for a new generate  
- `contentHash` optional but recommended for integrity  
- Private bucket / signed read only  

---

## Versioning

| Rule | Behavior |
| --- | --- |
| V-1 | Every successful generate with `persistToVault=true` creates a **new** version `N+1` |
| V-2 | Prior versions remain readable until retention/legal-hold policy says otherwise |
| V-3 | Regenerate never overwrites `vN` bytes or metadata |
| V-4 | “Latest” is max version for the same `{propertyId, reportType, period}` (or fingerprint policy) |
| V-5 | Failed jobs do not consume version numbers (or mark void — pick one at Implement; prefer no version on fail) |

---

## Metadata (minimum)

| Field | Purpose |
| --- | --- |
| `organization_id` | RLS |
| `property_id` | Scope |
| `report_type` | Catalog id |
| `period_start` / `period_end` | Reporting window |
| `year` / `month` | Tree browse |
| `version` | Monotonic per scope key |
| `source_fingerprint` | Cache / staleness |
| `content_hash` | Integrity |
| `media_asset_id` | API-002A pointer |
| `generated_at` | Timestamp |
| `generated_by` | User id |
| `job_id` | Provenance |
| `page_count` | Optional |
| `byte_size` | Optional |

Category / document type enum suggestion: `financial_report`.

---

## Entity linkage

| Link | Required |
| --- | --- |
| Organization | ✔ |
| Property | ✔ |
| Unit | ✘ Phase 1 (optional later for unit-level exports) |
| Owner entity | ✘ Phase 1 (future owner portal publish) |
| Lease | ✘ |

---

## Automatic save

Default product behavior:

1. User clicks **Generate** (or Preview → Generate PDF)  
2. Job succeeds  
3. PDF **automatically** saved to vault under Financial Reports / Year / Month  
4. UI shows success + version number + Download  

“Save to Vault” in preview confirms status when auto-save already completed; if generate ran with `persistToVault=false` (rare), Save triggers persist of existing bytes.

---

## Retention (future-ready, not Phase 1 product UI)

Design hooks only:

| Hook | Intent |
| --- | --- |
| `reporting.retention_days` | Org-configurable purge candidate age |
| Legal hold on property/org | Blocks purge |
| Soft-delete vs hard-delete | Align with vault/media policies |
| Audit `reporting.artifact.purged` | Required when purge ships |

Phase 1: **retain indefinitely** (no purge job) unless security policy forces otherwise at Approve.

---

## Security

- No public URLs  
- Download via authorized ReportingService / documents API  
- Capabilities: at least `financial:read` or `document:read` as matrix decides  
- Cross-org access impossible by construction (RLS + path prefix)

---

## Relationship to “View Previous Versions”

Reports card action opens a version list filtered by property + report type (+ period when selected), newest first, with Download / Preview for each immutable version.
