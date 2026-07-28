# 08 — Username Policy

**Package:** AUTH-001  
**Status:** Draft — Awaiting Approval

---

## Principles

1. Usernames are generated **only by M.P.A.**  
2. Subscribers and subaccounts **do not** choose usernames.  
3. Username is the **login identifier**.  
4. Username **never changes**.  
5. Username is **never reused**, even after account deletion.

---

## Format (proposed)

| Rule | Value |
|------|-------|
| Character set | `a-z`, `0-9` only (stored lowercase) |
| Length | 6–32 characters |
| Leading digit | Allowed |
| Separators | None in MVP (no `.` `_` `-`) |
| Reserved words | Blocklist (`admin`, `root`, `support`, `mpa`, `system`, …) |
| Global uniqueness | Required across all principals |

Examples (illustrative):

- `abcpm001`  
- `oakridgeowners`  
- `pinegroveadmin`  

---

## Generation algorithm (design)

```
base = normalize(org_name or person_name)
base = strip_non_alnum → lowercase → trim to max
candidate = base
if reserved or too short → candidate = "org" + random4
while exists(candidate) or was_ever_used(candidate):
  candidate = base + numeric_suffix++  (or entropy suffix)
issue candidate
persist to username_registry (including tombstones)
```

### Variants

| Account type | Seed preference |
|--------------|-----------------|
| Org Admin | Organization / company name |
| Staff | `orgbase` + role hint + suffix |
| Tenant | `orgbase` + `t` + suffix **or** property code + suffix |
| Vendor | `orgbase` + `v` + suffix |

Exact aesthetic rules may be tuned at Implement; immutability and non-reuse are binding.

---

## Registry & tombstones

Deleted or archived usernames remain in a **username registry** forever (or for a legally approved retention period that still forbids reuse in practice). New issuance must check live principals **and** tombstones.

---

## Display vs login

| Field | Mutable? | Used for login? |
|-------|----------|-----------------|
| Username | No | Yes |
| Display name | Yes | No |
| Email | Yes | No |

UI may show display name prominently; login forms always ask for username.

---

## Forbidden operations

| Actor | Cannot |
|-------|--------|
| End user | Set or change username |
| Org Admin | Set username for subaccounts (system generates) |
| Level 0 | Change username after issue (may **reissue credentials**, not rename) |

If a username is issued incorrectly before first login, Level 0 may **void** the principal and provision a replacement — the voided username remains unreusable.
