# 26 — Unified Search

**Package:** OPS-001  
**Amendment:** A06  
**Status:** Binding (Approved with Amendments)

---

## Purpose

One **global search** across the operational graph — permission-aware, org-scoped, role-appropriate.

---

## Searchable corpora

| Corpus |
|--------|
| Properties |
| Units |
| Tenants |
| Owners |
| Leases |
| Maintenance |
| Documents |
| Invoices |
| Messages |
| Tasks |
| Vendors |
| AI Knowledge |
| Support Articles |
| Commands (quick actions / deep links) |

---

## Security (binding)

```
Results = intersection(
  query matches,
  active organization,
  AuthZ plane + permissions,
  subscription entitlements,
  subject visibility
)
```

- Zero cross-org leakage  
- Tenant sees only their lease/WO/messages  
- Owner sees only owned properties  
- Commands filtered by role + entitlements  
- Restricted documents never appear in snippets  

---

## Result model

| Field | Description |
|-------|-------------|
| `result_id` | Stable |
| `corpus` | Type |
| `title` / `snippet` | Safe text |
| `deep_link` | Navigation |
| `score` | Relevance |
| `priority_hint` | Optional from Priority Engine |

Grouped UI: Top hits + per-corpus sections.

---

## Commands in search

Typing actions (e.g. “create work order”) returns **Commands** corpus entries that invoke Global Quick Actions ([27](./27-global-quick-actions.md)) when permitted.

---

## Indexing

- Event/job driven incremental index updates  
- Near-real-time for creates/updates  
- Rebuild job for repair  
- AI Knowledge / support articles separate index with same AuthZ wrapper  

---

## Acceptance (A06)

| ID | Criterion |
|----|-----------|
| US-01 | Global search covers listed corpora |
| US-02 | Permission-aware; fail closed |
| US-03 | Commands searchable when entitled |
| US-04 | No cross-org results |
