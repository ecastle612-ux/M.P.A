# 00 — Executive Summary

**Package:** VENDOR-001  
**Status:** Draft — Ready for Approval

---

## Goals

1. Vendors start work **without** creating an account or installing an app.  
2. QR / link opens **only** the assigned work order.  
3. Start / Finish in ≤3 taps; arrival & completion timestamps + audit are automatic.  
4. First invoice collects **minimal** payment preference; returning vendors reuse profile.  
5. PMs approve invoices and record payments; property/owner history updates.

## Non-goals

- Marketplace bidding, reputation, or compliance suites (later under ADR-004).  
- Full Stripe Connect Express onboarding in Phase A (preference + Mark Paid first; Connect optional Phase C).  
- Changing PM work-order creation/edit UX beyond “share QR / view vendor session”.

## Success metric

A first-time vendor on phone camera can go from QR scan to **Vendor On Site** in under 30 seconds without credentials.
