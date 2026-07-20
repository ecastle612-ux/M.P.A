# IA-001 — Competitive Differentiation & Implementation Slices

**Status:** Draft — Ready for Approval

---

## 14. Competitive differentiation

| Competitor | Typical AI posture | Gap | M.P.A. preference |
| --- | --- | --- | --- |
| **AppFolio** | Features + reporting density; AI often bolted on | Training tax; chat not ops loop | AI inside **Today’s Work** with Context Actions |
| **Buildium** | Accounting-strong; limited proactive ops AI | Module hopping for maintenance/leasing | Cross-module Ops Manager + Financial Assistant with **money gates** |
| **Rent Manager** | Deep power-user tooling | Steep; AI not the differentiator | Explainable recommendations day-one without “RM school” |
| **Propertyware** | Portfolio ops | Heavy screens; slow interrupt recovery | Push risks to Inspector / mobile sheet |
| **DoorLoop** | Modern UI; marketing AI | Decorative assistants not bound to due work | Next Best Action tied to real attentions + audit |

### Why partners prefer M.P.A. AI

1. **Active, not chat-first** — monitors overnight; briefs in the morning.  
2. **OS-native** — DX-004 surfaces host AI; no second product to learn.  
3. **Hard human gates** — screening, money, signatures never silent ([API-003](../48-api-003-background-screening/README.md) · [API-004](../50-api-004-electronic-signatures/README.md) · [API-005](../51-api-005-resident-payments-billing/README.md)).  
4. **Explainable** — why + evidence on every card.  
5. **Lifecycle-aware** — recommendations resume WF-003 jobs instead of dumping users into CRUD.

Do **not** copy competitor chat widgets or opaque “AI scores” for applicants.

---

## 15. Implementation slices (post-Approve only)

**Sequencing:** Approve IA-001 + prefer DX-003 P0 / DX-004 OS-A before high-volume AI push. Extend Phase 11 tables/APIs; do not fork a second AI stack.

| Slice | Scope | Depends on | Outcome |
| --- | --- | --- | --- |
| **IA-A** | Recommendation/insight schema completeness + accept/dismiss API | Phase 11 `ai_insights` | Measurable feedback loop |
| **IA-B** | Ops Manager: morning briefing + overdue/risk jobs (rules-first) | Ops Center / DX-004 Today’s Work | Proactive home |
| **IA-C** | Maintenance Coordinator: stall + urgency + vendor suggest (L3 confirm) | Maintenance list + Inspector | Faster WO triage |
| **IA-D** | Financial Assistant: delinquency risk + duplicate charge flags (no money mutates) | API-005 read models | Collections awareness |
| **IA-E** | Leasing Assistant: incomplete app + missing docs + screening explain | API-003 review UX | Faster human decisions |
| **IA-F** | Resident Assistant: draft reply + thread summary + frustration flag | Messaging inbox | Faster compassionate replies |
| **IA-G** | Portfolio Health weekly narrative on Ops pulse / AI Ops | IA-B | Executive glance |
| **IA-H** | Command Center Ask AI + Actions from recommendations | DX-004 Palette | Keyboard ops |
| **IA-I** | Notification wiring for briefing + high-risk alerts | API-001 category `ai_operations` | Push without spam |
| **IA-J** | LLM provider for drafts/summaries (server-side, redacted) | IA-A–F rules stable | Higher draft quality |

### Explicitly out of first Approve scope

- Autonomous approve/reject, payments, signing  
- Resident-facing negotiating chatbot  
- Cross-tenant model training  
- Rent optimization / acquisitions AI (AI-403/404)  

### Definition of done (package)

- Hard invariants enforced in design acceptance tests (no L4 auto-exec)  
- ≥40% of Today’s Work due items can carry AI suggestion metadata  
- Design Partner can complete morning briefing → act loop without opening a chat silo  

---

## Approval checklist

- [ ] Risk tiers L0–L4 accepted  
- [ ] Human approval boundaries accepted (esp. API-003/004/005)  
- [ ] Explainability + privacy rules accepted  
- [ ] Surface hosting on Ops / Palette / Today’s Work accepted (not chat-only)  
- [ ] Slice order IA-A→J accepted relative to DX-003/004  
- [ ] **Approve** recorded → Implement unblocked for sliced scope only  
