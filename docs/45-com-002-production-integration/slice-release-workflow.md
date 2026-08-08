# Mandatory Slice Release Workflow

**Effective:** 2026-08-08  
**Authority:** Product owner — COM-002 Production Integration authorize  

## Rule

No new slice may begin until the previous authorized slice is:

1. **Merged** to `main`  
2. **Deployed** to Production (`m-p-a-web` for www)  
3. **Verified live** on `https://www.my-property-assistant.com`  
4. **Approved** by the product owner  

## Applies to

Every future COM-002 slice and all subsequent product slices unless the product owner explicitly supersedes this rule in writing.

## Explicit stops until owner approval

- Slice F (Customer Billing Portal) — **not authorized**  
- Slice G — **not authorized**  
- Capital Projects — **not authorized**  
