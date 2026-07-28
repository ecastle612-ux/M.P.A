# 02 — Design Principles

**Package:** SIGN-002  
**Status:** Draft — Ready for Approval

---

## 1. Value test (required)

A signature is **in scope** for V1.0 only if at least one is true:

| Value | Examples |
|-------|----------|
| **Legal / contractual** | Lease, renewal, owner management agreement, vendor MSA |
| **Regulatory / compliance** | Fire/safety inspection sign-off where org policy requires it |
| **Accountability** | Move-in condition acknowledgement; keys received; deposit documentation |

If the action is routine ops (assign vendor, add note, upload photo, change WO status without authorization policy), **do not** require a signature.

---

## 2. Workflow is the product

- Entry points live on lease / owner / vendor / inspection / org document surfaces.  
- Progress uses M.P.A. language ([03](./03-cross-platform-ux.md)).  
- Provider ceremony may open externally; return paths land on M.P.A. progress views.

---

## 3. Mandatory vs configurable

| Mode | Meaning |
|------|---------|
| **Mandatory** | Product blocks a defined state transition until package is `completed` (or org has no alternate policy) |
| **Configurable** | Org setting enables/disables requirement; default documented per workflow |
| **Optional** | Available action; never blocks |

Defaults are conservative: require signatures where industry practice expects a signed instrument; make facility work authorization **configurable** (off by default).

---

## 4. Recipients without M.P.A. accounts

External signers (tenants, owners, vendors, contractors, employees without portal accounts) sign via provider invitation **unless** the workflow explicitly requires authenticated portal presence (rare; documented per workflow).

---

## 5. One package, one business purpose

Do not bundle unrelated acknowledgements into a single package unless the product presents them as one form (e.g. a single Move-In Acknowledgement PDF covering keys + rules + condition).

---

## 6. Failure is first-class

Decline, expire, cancel, void, and provider failure must:

- Update package status  
- Notify appropriate parties  
- Audit with entity links  
- Leave the originating record in a recoverable state (retry / new package lineage)

---

## 7. No provider leakage

Forbidden in UI copy: SignWell, Dropbox Sign, DocuSign, “envelope,” “HelloSign.”  
Allowed: “Send for signature,” “Pending signature,” “Completed,” “Declined,” “Download signed document.”
