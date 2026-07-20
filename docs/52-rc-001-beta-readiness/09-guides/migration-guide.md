# Migration Guide

**RC-001 · Design Partner data import**

## When to use Migration Center

Importing properties, units, tenants, or related records from spreadsheets / prior systems into a new M.P.A. organization.

## High-level flow

```
Create job → Upload → Map columns → Preview/validate → Import → Review → (Rollback if needed)
```

Open **Migration** in the PM app.

## Tips

1. Start with a **small sample** (one property + units).  
2. Fix validation errors before full import.  
3. Re-run preview until clean.  
4. After import, spot-check Properties / Units / Tenants.  
5. Attach documents/media after structural data is correct.  
6. Use rollback only if the job supports it and you understand impact.

## Documents & media

- Structural import first  
- Then vault/media uploads on entities  
- Do not expect a full DAM during beta  

## Verification checklist

- [ ] Property count matches source  
- [ ] Unit numbers unique per property  
- [ ] Tenant emails correct (needed for resident portal match)  
- [ ] Spot-check one lease / charge if imported  
- [ ] Ops Center portfolio health looks sane
