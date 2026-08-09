# Sprint 6 — Relationship Model Report

## Model
**One document · many relationships · no duplicate uploads.**

1. Primary ownership remains `document_documents.entity_type` + `entity_id`.
2. Additional relationships live in `document_document_links` (unique on document + entity type + id).
3. Upload creates the primary link automatically; staff can Link more records from the detail panel.
4. Virtual lease docs (`lease:…`) reuse leasing records; indexing into the library unlocks extra links.

## Example
Vendor invoice → primary Vendor + links to Work Order, Property, Financial Record, Asset — same file.
