# AI-001 — Global Copilot Runtime Certification

**Initiative ID:** AI-001  
**Priority:** Critical  
**Status:** Design ✔ · Document ✔ · Runtime fixes shipped · **Awaiting User Verification**  
**Constraint:** Runtime certification only — no new AI features, no UI redesign  
**Depends on:** UX-009 floating AI · SH-002 AI isolation · SH-003 shell PASS

## Goal

The floating AI Copilot must behave like part of the M.P.A. operating system: available and functional on every authenticated surface.

## Non-goals

- New prompts, models, or conversation schema
- Visual redesign of the launcher / panel
- Expanding AI product capabilities

## Documents

| Doc | Purpose |
| --- | --- |
| [01-audit-findings.md](./01-audit-findings.md) | Runtime defects found |
| [02-fix-log.md](./02-fix-log.md) | Fixes applied |
| [03-certification-protocol.md](./03-certification-protocol.md) | Human verification checklist |
| [04-certification-report.md](./04-certification-report.md) | PASS / FAIL evidence |

## Pass rule

**PASS** only after real user interaction confirms the AI Copilot opens and works consistently across authenticated app + portal routes on phone and desktop.
