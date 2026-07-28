# 14 — Content & Writing Guidelines

**Package:** UX-012  
**Status:** Draft — Awaiting Approval

---

## Voice

| Trait | How it sounds |
|-------|----------------|
| Clear | Short sentences; concrete nouns |
| Calm | No fake urgency |
| Professional | No slang in money/legal |
| Human | “You” / “we” appropriately; not robotic |
| Actionable | Buttons are verbs |

---

## UI copy rules

| Element | Rule |
|---------|------|
| Buttons | Verb + object (“Create work order”) |
| Titles | Outcome or object; not cute |
| Errors | What happened + how to fix |
| Empty | Why empty + next action |
| AI | Labeled as AI; never impersonate staff |
| Money | Exact amounts; timezone for due dates |

---

## Words to prefer / avoid

| Prefer | Avoid |
|--------|-------|
| Work order | Ticket (unless vendor context uses it) |
| Continue / Save | OK everywhere |
| Try again | Unexpected error (alone) |
| Sign in | Login as noun in titles OK; be consistent |

---

## Localization readiness

- No hardcoded sentence concatenation that breaks grammar  
- Date/number formatting locale-aware  
- Leave room for +30% string length in UI  

---

## Acceptance

| ID | Criterion |
|----|-----------|
| CW-01 | Voice traits defined |
| CW-02 | Button/error/empty/AI copy rules |
| CW-03 | No dark-pattern urgency language |
