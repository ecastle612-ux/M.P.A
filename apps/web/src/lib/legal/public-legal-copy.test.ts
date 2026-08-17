import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PUBLIC_LEGAL_CONTACT_EMAIL,
  PUBLIC_LEGAL_EFFECTIVE_DATE,
  PUBLIC_LEGAL_GOVERNING_LAW,
  PUBLIC_LEGAL_SERVICE_NAME,
  flattenLegalCopy
} from "./public-legal-copy";

const webRoot = join(process.cwd(), "src");
const chrome = readFileSync(join(webRoot, "components/marketing/marketing-chrome.tsx"), "utf8");
const auth = readFileSync(join(webRoot, "components/auth/auth-chrome.tsx"), "utf8");
const confirmPlan = readFileSync(join(webRoot, "components/marketing/checkout-page.tsx"), "utf8");
const copy = flattenLegalCopy();

const INVENTED_CLAIM_PATTERNS = [
  /\bLLC\b/,
  /\bL\.L\.C\./,
  /\bInc\./,
  /\bIncorporated\b/,
  /\bCorp\./,
  /\bCorporation\b/,
  /\bLLP\b/,
  /\bP\.O\. Box\b/i,
  /\bSuite\s+\d+/,
  /\bStreet\b/,
  /\bAvenue\b/,
  /SOC 2 certified/i,
  /GDPR certified/i,
  /CCPA certified/i,
  /HIPAA compliant/i,
  /data-processing agreement is provided/i,
  /collect rent online/i,
  /tenant online card payment is currently enabled/i,
  /pay rent (online|by card)/i,
  /not directed to (children under|minors under)/i,
  /under (13|16|18)/
];

describe("docs/180 public legal copy", () => {
  it("uses Owner-approved identity, contact, law, and effective date", () => {
    expect(PUBLIC_LEGAL_SERVICE_NAME).toBe("My Property Assistant (M.P.A.)");
    expect(PUBLIC_LEGAL_CONTACT_EMAIL).toBe("enterprise@my-property-assistant.com");
    expect(PUBLIC_LEGAL_GOVERNING_LAW).toBe("Minnesota, United States");
    expect(PUBLIC_LEGAL_EFFECTIVE_DATE).toBe("August 17, 2026");
    expect(copy).toContain(PUBLIC_LEGAL_SERVICE_NAME);
    expect(copy).toContain(PUBLIC_LEGAL_CONTACT_EMAIL);
    expect(copy).toContain(PUBLIC_LEGAL_GOVERNING_LAW);
    expect(copy).toContain(PUBLIC_LEGAL_EFFECTIVE_DATE);
  });

  it("does not invent a legal entity, address, phone, age, or certification", () => {
    for (const pattern of INVENTED_CLAIM_PATTERNS) {
      expect(copy).not.toMatch(pattern);
    }
    expect(copy).not.toMatch(/\+1\s*\(\d{3}\)/);
    expect(copy).not.toMatch(/\b\d{3}[-.)]\s*\d{3}[-.]\d{4}\b/);
  });

  it("distinguishes SaaS billing from tenant Online Payments", () => {
    expect(copy).toMatch(/SaaS subscription billing/);
    expect(copy).toMatch(/operational FIN-OPS/);
    expect(copy).toMatch(/enables Online Payments/);
    expect(copy).toMatch(/AutoPay requires the tenant/);
    expect(copy).toMatch(/do not settle into the M\.P\.A\. SaaS subscription account/);
    expect(copy).toMatch(/does not automatically assess late fees or run collections/);
    expect(copy).toMatch(/does not currently offer self-service in-app plan swaps or card updates/);
    expect(copy).toMatch(/do not promise refunds/);
    expect(copy).toMatch(/does not claim SOC 2/);
    expect(copy).toMatch(/does not offer SMS, Web Push, or native push/);
  });

  it("links Privacy Policy and Terms from footer, Auth, and Confirm Plan", () => {
    expect(chrome).toContain("PublicLegalLinks");
    expect(auth).toContain("PublicLegalLinks");
    expect(confirmPlan).toContain('href="/privacy"');
    expect(confirmPlan).toContain("Privacy Policy");
    expect(confirmPlan).toContain('href="/terms"');
    expect(confirmPlan).toContain("Terms");
    expect(confirmPlan).not.toMatch(/type=["']checkbox["']/);
  });
});
