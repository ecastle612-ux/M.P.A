# 09 — Notification Matrix

**Package:** SIGN-002  
**Status:** Draft — Ready for Approval  
**Transport:** API-001 NotificationService only (no parallel notifier)

---

## Platform events (all workflows)

Map to existing / extended signature notification keys. Prefer deep links to **originating record** Documents panel (not a bare provider URL).

| Event | Recipients | Priority | Category hint |
|-------|------------|----------|---------------|
| Signature request sent | Each signer (invite); PM/sender copy optional | high | leases / facility / org as applicable |
| Document viewed | Package watchers (PM) — optional, default on for PM | normal | same |
| Reminder sent | Outstanding signers | normal | same |
| Recipient signed (partial) | PM + remaining signers optional | normal | same |
| Document completed | PM + all parties with accounts | high | same |
| Declined | PM + sender | high | same |
| Expired | PM + sender | high | same |
| Voided / cancelled | PM + affected signers with accounts | high | same |
| Vault sync failed | PM + org admin | high | system |

Reuse API-001 catalog entries where they exist (“Document requires signature”, “Document signed”, “Lease signed”). Extend catalog only for facility/org categories when those triggers become real (no dead triggers).

---

## Per-workflow notes

| ID | Extra routing |
|----|---------------|
| A1–A2 | On complete: also emit lease-signed / renewal-complete style events already in product |
| A3 | Notify owner portal user + PM |
| A4–A5 | Notify resident + PM; owner only if org shares move docs |
| B1–B2 | Vendor via email/SMS link; PM in-app |
| B3 | Vendor token channel + PM; block-start messaging on WO |
| B4 | Inspector + manager; external email if template has AHJ |
| B5 | Vendor + PM |
| C1–C2 | Employee/user + admin |
| C3–C4 | Selected signers + sender |

---

## Idempotency

`idempotency_key = hash(orgId, eventType, packageId, recipientId, occurrenceKey)` per API-001 rules.
