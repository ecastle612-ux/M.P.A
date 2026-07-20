# PX-006.03 — Onboarding, Setup Wizard & Invitations

**Status:** Approved  
**Priority:** P0

---

## P0 — Complete setup wizard

After first login, M.P.A. onboards a new property management company — it does **not** drop the user into an empty dashboard.

### Approved flow

```
Welcome to M.P.A.
    ↓
Complete Profile
    ↓
Create Organization
    ↓
Invite Team (optional)
    ↓
Create Property
    ↓
Add Units
    ↓
Create First Tenant
    ↓
Create First Lease
    ↓
Setup Complete
    ↓
Operations Center
```

The user always knows **where they are** and **what comes next**.

### Presentation

- Route: `/setup` (or stepped overlay within authenticated shell)
- Step indicator visible throughout
- Back navigation allowed where safe
- Skip available on optional steps (invite team)
- Resume incomplete setup on return visit until complete

### Step definitions

| Step | Complete when | Skip allowed |
|------|---------------|--------------|
| Welcome | User acknowledges | No |
| Complete Profile | First + last name saved | No |
| Create Organization | Org exists | No |
| Invite Team | At least one invite sent OR skipped | Yes |
| Create Property | Property exists | No (in wizard; can exit to dashboard after org if needed) |
| Add Units | Unit exists | No |
| Create First Tenant | Tenant exists | No |
| Create First Lease | Lease exists | No |
| Setup Complete | All required steps done | — |

### Integration with existing forms

Wizard steps embed existing create forms (`property-form`, `unit-form`, etc.) — no duplicate form logic.

---

## P0 — Profile completion

### Required fields

- First Name
- Last Name
- Job Title
- Phone (optional)
- Profile photo (optional)

### Greeting rule

After profile complete:

> Good morning, Erick.

Never:

> Good morning.
>
> Good morning, erick@email.com

### Constraints

- Use existing profile API — no schema changes **until** media foundation is approved
- Optional profile photo UX must not require pasting URLs once [API-002A](../46-api-002a-universal-media-foundation/README.md) is Approved and slice 4 ships
- Align with [First Five Minutes](../21-experience-architecture/first-five-minutes.md): wizard is setup-focused, not a feature tour

---

## P0 — Post-organization invitation

After org create within wizard:

```
Invite Your Team

Typical roles:
  • Assistant Manager
  • Leasing Agent
  • Maintenance Manager
  • Property Owner
  • Vendor

[Invite Now]    [Skip for now]
```

Reuse existing invite API. Role templates are UI shortcuts only.

---

## Acceptance

- [ ] New user enters setup wizard before Operations Center
- [ ] All wizard steps show progress indicator
- [ ] Skip works on invite step only
- [ ] Setup resumes on return if incomplete
- [ ] Greeting uses first name after profile step
- [ ] Setup complete lands on Operations Center with health indicator visible
