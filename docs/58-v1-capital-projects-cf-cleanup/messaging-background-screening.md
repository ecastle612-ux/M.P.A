# Version 1.0 commercial messaging — Background Screening + Capital cleanup

**Branch:** `cursor/v1-remove-capital-projects-cf-82f3`  
**PR:** awaiting Owner acceptance before merge

## Marketing copy summary

| Surface | Change |
|---------|--------|
| Landing feature comparison | Row: **Background Screening** → status **Planned** (all platforms) |
| Landing | Subtle **Future integrations** note + FAQ clarifying Planned (not available today) |
| Pricing inclusion matrix | Same **Planned** row + Future integrations note |
| Modules cards | Line item: `Background Screening (Integration Planned)` + shared note |

**Wording chosen:** `Background Screening (Integration Planned)` / table cell `Planned`  
Does **not** say Included, Available Now, Integrated, or Version/date promises.

**Tone:** ecosystem expansion confidence — not unfinished-software framing.

## Capital Projects

Customer-facing Capital Projects references remain removed (prior commit on this branch). Internal entitlements/routes retained.

## Out of scope (unchanged)

Pricing amounts, Checkout, Stripe, subscriptions, navigation, auth, architecture, DB, feature flags.

## Validation

- typecheck / lint on `@mpa/web`
- Confirm no CF “Capital Projects” strings in marketing components
- Manual: landing, pricing, modules — desktop + mobile layout of new note/row

## Deployment rule

1. PR  
2. **Owner acceptance**  
3. Merge  
4. Production deploy  
5. LIVE verify  
6. Owner LIVE acceptance  
