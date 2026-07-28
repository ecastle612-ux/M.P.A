# 20 — Feature Discovery

**Package:** COM-001  
**Amendment:** A04  
**Status:** Binding (Approved with Amendments)

---

## Purpose

After implementation reaches Production Ready (or earlier for high-value gaps), the system **continues onboarding** customers through contextual discovery — driving continuous adoption without becoming spam.

---

## Principles

| Principle | Meaning |
|-----------|---------|
| Entitlement-aware | Never pitch features outside the plan ([03](./03-subscription-architecture.md)) |
| One job | One recommendation at a time in primary surfaces |
| Dismissible | User can snooze/dismiss with memory |
| Measurable | Impressions, accepts, dismissals logged on communication timeline |
| Org-scoped | No cross-tenant suggestions |

---

## Example prompts

- “You haven't connected Stripe.”  
- “You have never used AI.”  
- “Invite your maintenance technicians.”  
- “Connect QuickBooks.” *(when integration entitled / future)*  
- “Enable notifications.”  
- “Try Owner Reports.”  

---

## Trigger catalog (design)

| Trigger | Condition | CTA |
|---------|-----------|-----|
| Payments gap | Stripe/payments not connected and required by workflows | Connect payments |
| AI never used | AI entitled; 0 sessions after N days Active | Open AI assist |
| No technicians | Maintenance module on; zero tech users | Invite technicians |
| Accounting disconnect | Integration entitled; not linked | Connect accounting |
| Notifications off | Org prefs disable all channels | Enable notifications |
| Owner reports unused | Owner portal/reports entitled; unused | Open Owner Reports |
| Low WO adoption | Maintenance entitled; no WO in N days | Create first work order |

---

## Surfaces

| Surface | Behavior |
|---------|----------|
| In-app coach marks / banners | Primary |
| AI Assistant | Can surface next best action |
| Email digests | Low frequency; CS tier aware |
| CS playbooks | Operators see open discoveries |

---

## Suppression

- Do not re-show dismissed item for cooldown (e.g. 14–30 days)  
- Suppress during Past Due / Suspended (except billing CTAs)  
- Suppress during active Professional Implementation sessions if specialist owns checklist  
- Cap concurrent discoveries (design default: 1 primary + optional secondary list)

---

## Acceptance (A04)

| ID | Criterion |
|----|-----------|
| FD-01 | Post-implementation continuous adoption prompts defined |
| FD-02 | Entitlement-aware; no unpurchased feature pitches as available |
| FD-03 | Dismiss/snooze + timeline logging |
| FD-04 | Works with health score + AI Assistant |
