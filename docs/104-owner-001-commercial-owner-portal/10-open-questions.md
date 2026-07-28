# 10 — Open Questions

**Package:** OWNER-001  
**Status:** Approved · Phase 1 ✅ COMPLETE  
**Section:** §13 Open Questions

Resolve or explicitly defer before **Approve**. Unresolved questions that affect schema, capabilities, or IA should not be silently decided in code.

---

## Q1 — Owner ↔ property scoping model

**Question:** For MVP, is an owner’s property set:

- **A)** All properties in organizations where they hold `property_owner`, or  
- **B)** An explicit access map (architecture’s `owner_property_access` / equivalent), requiring minimal schema work?

**Why it matters:** Totals, lists, RLS, and statement filtering.  
**Recommendation (Draft):** Prefer **A** for fastest commercial unblock if product accepts org-wide owner visibility; plan **B** as follow-up if customers need partial-portfolio owners.  
**Status:** Unresolved

---

## Q2 — Message reply capability

**Question:** Approve grant of `message:create` (and related) to `property_owner` for US-E02?

**Why it matters:** Today owners often have `message:read` only.  
**Recommendation (Draft):** **Yes** — reply is in commercial MVP communication requirements; scope to threads the owner can already read.  
**Status:** Unresolved

---

## Q3 — Announcements read path

**Question:** How do owners read announcements without receiving PM `communication:*` publish powers?

**Options:**  
- Dedicated owner announcement read capability  
- Scoped reuse of existing announcement read APIs with role checks  
- Surface announcement-like updates only via notifications + messages (narrower MVP)

**Recommendation (Draft):** Scoped read path; never grant broadcast/publish.  
**Status:** Unresolved

---

## Q4 — Reports: consume vs generate

**Question:** May owners trigger ReportingService generation, or only consume already-generated / vaulted artifacts?

**Recommendation (Draft):** **Consume published/owner-safe artifacts** in MVP; PM remains generator of record. Revisit if statement publish workflow requires owner-side regenerate.  
**Status:** Unresolved

---

## Q5 — Statement source of truth in UI

**Question:** Primary statement list = Phase 10 `owner_statements`, FIN-001 vaulted Owner Statement PDFs, or unified view of both?

**Recommendation (Draft):** Unified owner Statements UI that prefers vaulted PDF when present and falls back to operational statement detail — still one UX, two existing backends, no third pipeline.  
**Status:** Unresolved

---

## Q6 — Mobile nav chrome

**Question:** Owner mobile uses UX-008-style drawer with pinned Financials/Messages/Documents/Statements, or Approve a compact top/bottom pattern?

**Recommendation (Draft):** Drawer chassis reuse with owner-pinned priorities; avoid new tab paradigm unless usability testing demands it.  
**Status:** Unresolved

---

## Q7 — Residents PII depth

**Question:** How much resident detail may owners see (full contact vs name/unit only)?

**Recommendation (Draft):** Name + unit + lease status minimum; contact fields only if already allowed by `tenant:read` policy and customer contracts. Confirm with privacy/security at Approve.  
**Status:** Unresolved

---

## Q8 — FIN-003 placeholder copy

**Question:** Exact product copy for Pending / Completed Payouts (and whether to show $0 vs “Unavailable”).

**Recommendation (Draft):** “Owner payouts will appear here when payouts are enabled” + no fabricated balances.  
**Status:** Unresolved

---

## Q9 — Settings surface depth

**Question:** Settings = profile + notification preferences only, or also document retention prefs / communication channel prefs?

**Recommendation (Draft):** Profile + notification preferences only.  
**Status:** Unresolved

---

## Q10 — Certification dataset

**Question:** What seeded org/owner fixture is mandatory for Blocker 3 commercial cert (properties, statement, vendor payment, message, vault docs)?

**Recommendation (Draft):** Define a single cert checklist dataset in the post-Approve implementation plan; reuse Master Admin demo only for MA Test Mode, not as sole cert evidence.  
**Status:** Unresolved

---

## Decision log (fill at Approve)

| ID | Decision | Decided by | Date |
|----|----------|------------|------|
| Q1 | | | |
| Q2 | | | |
| Q3 | | | |
| Q4 | | | |
| Q5 | | | |
| Q6 | | | |
| Q7 | | | |
| Q8 | | | |
| Q9 | | | |
| Q10 | | | |
