# Mandatory Slice Release Workflow

**Effective:** 2026-08-08  
**Authority:** Product owner — AUTHORIZE COM-002 RELEASE TO MAIN  

## Rule

Every completed slice must follow this workflow:

```
Implement
↓
Merge to main
↓
Deploy
↓
Live verification
↓
Bug fixes
↓
Deploy
↓
Product Owner approval
↓
Next slice
```

No future slice may begin until the previous slice is **visible in production** and **approved** by the product owner.

## Applies to

Every future COM-002 slice and all subsequent product slices unless the product owner explicitly supersedes this rule in writing.

## Explicit stops until owner approval

- Slice F (Customer Billing Portal) — **not authorized**  
- Slice G — **not authorized**  
- Capital Projects — **not authorized**  
