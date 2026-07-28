# 10 — AI Interaction Guidelines

**Package:** UX-012  
**Status:** Draft — Awaiting Approval  
**Related:** OPS-001 AI Operations Director · ADR-006

---

## Goal

AI should feel **integrated — not bolted on**.

---

## Surfaces

| Surface | Use |
|---------|-----|
| **Assistant panel** | Side/sheet conversation + actions in context |
| **Inline suggestions** | Field-level or step-level hints |
| **AI summaries** | Timeline / detail headers |
| **Recommendations** | Command Center AI panel cards |
| **Warnings** | Risk callouts (trend, safety) |
| **Automation confirmations** | “AI suggests escalate — Approve / Edit / Dismiss” |
| **Confidence indicators** | High / Medium / Low visual + text |
| **Approval prompts** | Required for mutating/outbound ([OPS-001 22](../111-ops-001-platform-operations-architecture/22-ai-operations-director.md)) |

---

## Visual language

| Do | Don’t |
|----|-------|
| Same Canopy surfaces; subtle AI badge | Neon purple glow chat bubble theme |
| Clear “Suggested by AI” | Pretend AI text is human-authored system truth |
| Show confidence | Hide uncertainty on Medium/Low |
| One-click Approve/Dismiss | Force multi-step for simple accepts |

---

## Interaction rules

1. AI never silently sends resident-facing messages (default).  
2. Approval controls are buttons with verbs, not buried menus.  
3. Dismiss remembers cooldown (OPS discovery rules).  
4. Streaming responses show progress; allow stop.  
5. Errors: “AI unavailable — continue manually” with path.  
6. Mobile: assistant as sheet; doesn’t cover primary CTA permanently.  

---

## Confidence UI

| Level | Presentation |
|-------|--------------|
| High | Subtle check; may auto-apply labels only |
| Medium | “Review suggested” emphasis |
| Low | “Possible insight” quieter |

---

## Acceptance

| ID | Criterion |
|----|-----------|
| AI-UX-01 | Surfaces listed have patterns |
| AI-UX-02 | Integrated visual language (no bolt-on theme) |
| AI-UX-03 | Confidence + approval prompts standardized |
| AI-UX-04 | Manual fallback when AI down |
