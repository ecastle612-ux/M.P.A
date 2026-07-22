# 04 — App States (Phase 4)

**Package:** PUSH-001  
**Status:** Draft — awaiting Approve  

---

## Rule

Delivery must succeed (or fail with documented platform limit) in every state below.

| State | Desktop | Android | iPhone PWA |
| --- | --- | --- | --- |
| Application open (foreground) | ☐ | ☐ | ☐ |
| Application background | ☐ | ☐ | ☐ |
| Application closed / killed | ☐ | ☐ | ☐ |
| Cold launch from notification tap | ☐ | ☐ | ☐ |
| Phone locked | N/A | ☐ | ☐ |
| Desktop minimized / other space | ☐ | N/A | N/A |
| Installed PWA | ☐ (if installed) | ☐ | ☐ required |
| Browser tab only | ☐ | ☐ | Document limit |

---

## Pass notes

- Foreground: OS banner and/or in-app consistency acceptable if product chooses one primary; must not drop silently.  
- Cold launch: must land on deep link target (Phase 5), not generic home.  
- iPhone Safari tab: if Apple does not deliver, record **platform limitation** with Apple version — still require installed PWA PASS.
