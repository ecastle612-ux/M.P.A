# 01 — Design Principles

**Package:** UX-012  
**Status:** Draft — Awaiting Approval

---

## Binding principles

Every future screen must satisfy:

| Principle | Meaning | Test |
|-----------|---------|------|
| **Simple** | One primary job per view; remove non-essential chrome | Can a new user name the next action in 3 seconds? |
| **Professional** | Precise type, restrained color, trustworthy status language | Would a PM show this to an owner without apology? |
| **Fast** | Perceived and actual speed; skeletons over spinners; optimistic where safe | Does wait time feel explained and short? |
| **Minimal** | No decorative clutter; density without noise | If removed, does understanding suffer? |
| **Premium** | Canopy craft: atmosphere without gimmicks; intentional motion | Does it feel cheap or considered? |
| **Predictable** | Patterns repeat; same control = same behavior | Does learning transfer across modules? |
| **Accessible** | Keyboard, contrast, SR, reduced motion | Does it meet [12](./12-accessibility.md)? |
| **AI-first** | AI assists the job inline; not a bolted chat toy | Is AI helping the workflow in context? |
| **Workflow-first** | Action before analytics; continuity of stages | Does the screen advance work or only display data? |

---

## Relationship to existing doctrine

| Source | Relationship |
|--------|--------------|
| [Canopy](../06-design-language/index.md) | Confidence, Calm, Professionalism, Trust, Efficiency |
| [07 UX Principles](../07-ux-principles/index.md) | Workflow continuity, action before analytics |
| [21 Experience Architecture](../21-experience-architecture/index.md) | Emotional design, first five minutes |
| [UI-001 principles](../107-ui-001-platform-experience/00-platform-design-principles.md) | “What should I do today?” — UX-012 operationalizes |

---

## Anti-principles (forbidden)

| Anti-pattern |
|--------------|
| Dashboard-of-everything first viewport |
| Purple-glow / generic AI chrome |
| User-selected “pick your portal” for dashboards |
| Walls of cards with equal weight |
| Unlabeled icons as sole navigation |
| Motion without purpose |
| Dark patterns (hidden cancel, forced urgency) |

---

## Screen certification question

> Does this screen make the next correct action obvious, feel like Canopy M.P.A., and work for this role on mobile and desktop — accessibly?

If no → do not ship.
