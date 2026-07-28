# 13 — AI Guided Onboarding

**Package:** AUTH-001  
**Status:** Draft — Awaiting Approval

---

## Goal

The AI functions as an **onboarding specialist** that reduces setup from days to minutes by walking the Org Admin through every wizard step, automating mapping/import, and asking for confirmation only when judgment is required.

Aligned with [ADR-006](../18-decision-log/adr-006-embedded-ai-not-chatbot.md): embedded specialist, not a novelty chatbot.

---

## Experience principles

| Principle | Meaning |
|-----------|---------|
| One job at a time | Each turn advances a wizard step |
| Automate the boring | Parsing, mapping, duplicate detection |
| Human confirms irreversible joins | Lease-tenant-unit links, billing connects |
| Org-scoped | AI never retrieves other orgs’ data |
| Auditable | AI suggestions + accept/reject logged |
| Escapable | User may switch to Professional Implementation |

---

## Example dialogue (illustrative)

> “Let's import your properties.”  
> “Upload your rent roll.”  
> “I found 127 tenants.”  
> “I detected 4 duplicate leases.”  
> “I can automatically map your spreadsheet.”  
> “I'll configure Stripe for you.”  
> “I'll invite your employees.”  

---

## Capability map

| Capability | AI behavior | Human gate |
|------------|-------------|------------|
| Upload rent roll | Detect columns; propose mapping | Accept mapping |
| Import properties/units | Create staged entities | Confirm create |
| Import tenants | Dedupe by name/email/phone | Resolve conflicts |
| Import leases | Detect overlaps/duplicates | Confirm links |
| Configure accounting prefs | Propose chart defaults | Accept |
| Connect Stripe | Launch guided Connect/billing steps | User completes provider auth |
| Invite team | Draft invites from roster | Org Admin sends |
| Notifications | Propose defaults by role | Accept |

---

## Safety rules

1. AI cannot grant `master_admin` or cross-org access.  
2. AI cannot email credentials to arbitrary addresses without Org Admin confirm.  
3. AI cannot mark organization `active` without Finish confirmation.  
4. AI cannot bypass BILL-001 or payment provider ownership.  
5. All mutations go through the same services/RLS as manual UI.  
6. Prompt/retrieval is org-scoped; no cross-tenant embeddings in MVP.

---

## Failure & fallback

| Situation | Behavior |
|-----------|----------|
| Unreadable spreadsheet | Ask for CSV/XLSX repair tips; offer Professional path |
| Low-confidence mapping | Require explicit column mapping UI |
| Provider connection fails | Preserve progress; retry; support link |
| AI runtime unavailable | Wizard continues in manual mode |

---

## Success metric (design target)

Time-to-`active` for a mid-size PM rent roll (≤200 units) measurable in **minutes**, not days — subject to data quality.
