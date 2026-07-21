# 05 — Search Expansion (Priority 6)

**Package:** UX-009  
**Builds on:** UX-008 “Search M.P.A.” (nav destinations + synonyms) and desktop ⌘K / Command Center.

---

## Goal

Users find **entities and destinations** without menu archaeology. If search can take them directly there, skip intermediate navigation.

## Must find

| Class | Examples |
| --- | --- |
| Properties | name, address |
| Residents | name, email/phone if already indexed |
| Units | unit label + property |
| Leases | resident / unit / status |
| Vendors | name |
| Work orders | title / id / property |
| Reports | report names / financial report routes |
| Messages | threads / communications entry |
| Settings | settings sections |

## Synonyms (minimum set)

Align with UX-008 synonym list and extend:

`resident` → tenants/residents · `work order` / `WO` / `repair` → maintenance · `rent` / `payment` → financials · `owner statement` → reports · `team` → settings/team · `announce` → communications

## Surfaces

| Surface | Behavior |
| --- | --- |
| Mobile drawer Search M.P.A. | Nav jump **plus** top entity hits (permission-filtered) |
| Desktop ⌘K Command Center | Same index classes; prefer existing providers (`api-providers`, static, help) — extend, don’t fork |
| Empty query | Recent + favorites (UX-008) + suggested destinations |

## Rules

1. **No new backend search engine** unless existing APIs cannot return a class — prefer extending Command Center providers.  
2. Results show **type label** + primary line + secondary line.  
3. Selecting a result **navigates** to the existing detail/list route.  
4. Unavailable classes (permission denied) are omitted, not errored.  
5. Debounce + loading state; never block typing.

## Success metric

Common tasks completable via search without opening the full nav tree (qualitative Design Partner test + scripted jumps in certification).
