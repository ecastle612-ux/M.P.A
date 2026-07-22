# 08 — Implementation Phases

**Package:** VENDOR-001  
**Status:** Draft — Ready for Approval  
**Rule:** No phase until package **Approved** + ADR-025 **Accepted**.

---

## Phase A — Token QR + Start / Finish

- `vendor_work_order_tokens` + mint on approved assignment  
- Public `/v/[token]` job card  
- Start Job → on-site status + audit + PM notify  
- Finish Job → awaiting approval + optional notes/photos  
- PM WO: show QR / share link  

**Exit:** Phone camera QR → Start → Finish without login.

---

## Phase B — Invoice + minimal profile + Mark Paid

- Payment profile on first invoice  
- Invoice submit / approve / reject  
- Mark Paid + payment history on vendor & property  
- Returning vendor welcome  

**Exit:** PM can approve invoice and record payment; vendor notified.

---

## Phase C — Provider payout (optional)

- Stripe Connect or ACH provider for “Pay Vendor”  
- Opaque provider refs on profile  
- Still no raw bank storage in M.P.A.  

**Exit:** At least one live payout path in sandbox.

---

## Phase D — Authenticated vendor dashboard + owner report polish

- Outstanding / awaiting / approved / paid lists  
- Owner report includes vendor payments automatically  

**Exit:** Dashboard + owner report certification.

---

## Explicit deferrals

- Marketplace bidding (ADR-004 expansion)  
- Full accounting / 1099 suite  
- Native apps
