# Sprint 6 — Architecture Report

## Principle
Build on LAUNCH-001 Shared Documents — do not invent a second vault.

## Spine retained
- Route: `/shared/documents`
- Table: `document_documents`
- Capabilities: `platform.documents:read|write`
- Deep-links: `documentsHref` + strips

## Additive layers
| Layer | Purpose |
| --- | --- |
| Intelligence columns | tags, notes, status, keywords, version_number |
| `document_document_links` | Many relationships per file |
| `document_document_versions` | Version snapshots |
| `pdf-lib` export | Professional PDF generation |
| Expanded entity/category checks | Belong-to vocabulary |

## Non-goals
No auth rewrite · no Storage redesign required for MVP · no nav IA change · no Stripe changes.
