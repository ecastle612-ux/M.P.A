/** Owner-approved public legal copy for /privacy and /terms (docs/180). */

export const PUBLIC_LEGAL_SERVICE_NAME = "My Property Assistant (M.P.A.)";
export const PUBLIC_LEGAL_EFFECTIVE_DATE = "August 17, 2026";
export const PUBLIC_LEGAL_CONTACT_EMAIL = "enterprise@my-property-assistant.com";
export const PUBLIC_LEGAL_GOVERNING_LAW = "Minnesota, United States";

export const PUBLIC_LEGAL_PATHS = {
  privacy: "/privacy",
  terms: "/terms"
} as const;

export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

export const PRIVACY_POLICY_INTRO =
  "This Privacy Policy describes how My Property Assistant (M.P.A.) handles information when you use the hosted property-operations service at my-property-assistant.com. It is written from the live product. It does not claim certifications or guarantees that M.P.A. has not established.";

export const TERMS_INTRO =
  "These Terms of Use govern access to My Property Assistant (M.P.A.), a hosted property-operations service. They reflect the product as it works today. They do not create a separately named corporation or publish a mailing address.";

export const PRIVACY_POLICY_SECTIONS: LegalSection[] = [
  {
    heading: "Who provides the service",
    paragraphs: [
      "The public service and product identity is My Property Assistant (M.P.A.). These pages do not name a separate legal entity because one is not established in M.P.A.’s approved public records.",
      "Privacy, support, account, and deletion requests: enterprise@my-property-assistant.com."
    ]
  },
  {
    heading: "Information we process",
    paragraphs: [
      "When you create an account or are invited to an organization, we process identifiers such as your email address or username, membership and role information, and the operational records your organization enters. That can include properties, units, residents, work orders, documents, communications, and operational finance records.",
      "If you buy a self-serve subscription, Stripe processes the SaaS payment. M.P.A. does not store full card numbers.",
      "Transactional messages about the product (invitations, work-order notices, and similar operational mail) may be sent from My Property Assistant at noreply@my-property-assistant.com."
    ]
  },
  {
    heading: "SaaS subscription billing is not tenant payment collection",
    paragraphs: [
      "M.P.A. SaaS subscription billing is the charge for the software itself (Property Manager, Facility Operations, or Complete Platform). That billing is processed by Stripe Checkout and related SaaS subscription records.",
      "Property and resident financial records, and operational FIN-OPS tools, are organization records used to run the property. They are not the same as M.P.A. SaaS billing. Tenant Pay Once and tenant-authorized AutoPay use a Stripe connected account for that organization after the organization completes Stripe Connect and an authorized admin enables Online Payments. AutoPay requires the tenant’s own consent. Tenant funds settle to that organization’s connected account, not the M.P.A. SaaS subscription account. M.P.A. does not automatically assess late fees or run collections."
    ]
  },
  {
    heading: "How we use information",
    paragraphs: [
      "We use this information to provide the service, authenticate users, operate organizations, send transactional email when notification preferences allow it, maintain security and business records, and communicate about the account you asked us to operate.",
      "M.P.A. does not offer SMS, Web Push, or native push notifications."
    ]
  },
  {
    heading: "Service providers",
    paragraphs: [
      "These providers receive only what is needed to perform their role:",
      "Stripe processes M.P.A. SaaS Checkout and SaaS subscriptions on the platform account. When a property organization completes Stripe Connect and enables Online Payments, Stripe also processes tenant Pay Once and tenant-authorized AutoPay on that organization’s connected account. Those tenant funds do not settle into the M.P.A. SaaS subscription account.",
      "Supabase provides authentication and application data hosting.",
      "Resend sends transactional application email.",
      "Vercel hosts the web application.",
      "SignWell may be used when an organization chooses the optional e-sign integration.",
      "This list describes factual use. It is not a certification or contractual claim about those providers."
    ]
  },
  {
    heading: "Cookies and similar technologies",
    paragraphs: [
      "M.P.A. uses essential authentication, session, and service technologies so you can sign in and use the product. These pages do not claim that M.P.A. uses no cookies.",
      "The public site does not show a separate cookie-consent prompt."
    ]
  },
  {
    heading: "Retention",
    paragraphs: [
      "Information may be retained as reasonably necessary to provide the service, maintain business and security records, satisfy legal obligations, resolve disputes, and enforce these terms, subject to applicable law.",
      "M.P.A. does not promise automatic deletion after a fixed number of days, months, or years. To request account or deletion help, email enterprise@my-property-assistant.com."
    ]
  },
  {
    heading: "Children",
    paragraphs: [
      "M.P.A. is intended for business, property, and facility operations. It is not directed to children, and we do not market the service to children."
    ]
  },
  {
    heading: "Changes",
    paragraphs: [
      "If this policy changes, we will update the effective date on this page."
    ]
  }
];

export const TERMS_SECTIONS: LegalSection[] = [
  {
    heading: "The service",
    paragraphs: [
      "M.P.A. is a hosted web application for property and facility operations. The commercial products are Property Manager, Facility Operations, and Complete Platform. Enterprise is an optional sales path, not a product or pricing tier.",
      "Tenant Pay Once and tenant-authorized AutoPay are available after an organization completes Stripe Connect and an authorized admin enables Online Payments. AutoPay requires the tenant’s own consent. Operational FIN-OPS records inside an organization are not M.P.A. SaaS subscription charges."
    ]
  },
  {
    heading: "Accounts",
    paragraphs: [
      "You must keep your sign-in credentials confidential and use the service only for lawful organizational operations. Organizations are responsible for the records they enter and the people they invite."
    ]
  },
  {
    heading: "SaaS subscriptions and billing",
    paragraphs: [
      "Self-serve plans are purchased through Stripe Checkout after Confirm Plan. Public prices are Property Manager $59 monthly, Facility Operations $59 monthly, and Complete Platform $109 monthly, with the existing approved annual discount. Additional unit capacity, when quoted, is billed as additional 500-unit blocks.",
      "A valid payment card is required for self-serve Checkout. After a free trial, if one applies to the quote, automatic SaaS billing begins unless you cancel through the supported cancellation flow.",
      "M.P.A. does not currently offer self-service in-app plan swaps or card updates. Contact enterprise@my-property-assistant.com if you need help with the subscription."
    ]
  },
  {
    heading: "Cancellation",
    paragraphs: [
      "You may cancel a SaaS subscription through the currently supported cancellation flow. Cancellation remains subject to the applicable paid billing period. Access continues through the paid-through date, and future renewal stops.",
      "These Terms do not promise refunds. Current product cancellation copy states that no refunds and no prorated refunds are issued."
    ]
  },
  {
    heading: "Acceptable use",
    paragraphs: [
      "Do not misuse the service, attempt unauthorized access, or use it to send unlawful communications. M.P.A. may suspend access that threatens the security or integrity of the service or other customers."
    ]
  },
  {
    heading: "Third-party services",
    paragraphs: [
      "Stripe, Supabase, Resend, Vercel, and optional SignWell operate parts of the service described in the Privacy Policy. Their own terms apply to their processing. M.P.A. does not make certification or compliance claims about those providers."
    ]
  },
  {
    heading: "Disclaimers",
    paragraphs: [
      "The service is provided as a hosted operations tool. M.P.A. does not claim SOC 2, GDPR certification, CCPA certification, HIPAA compliance, or that a data-processing agreement exists.",
      "M.P.A. does not warrant uninterrupted service or that operational records will meet a particular legal or accounting standard."
    ]
  },
  {
    heading: "Governing law",
    paragraphs: [
      "These Terms are governed by the laws of Minnesota, United States, without naming a specific county or court."
    ]
  },
  {
    heading: "Contact",
    paragraphs: [
      "Questions about these Terms, privacy, support, or account deletion: enterprise@my-property-assistant.com."
    ]
  },
  {
    heading: "Changes",
    paragraphs: [
      "If these Terms change, we will update the effective date on this page."
    ]
  }
];

export function flattenLegalCopy(): string {
  return [
    PUBLIC_LEGAL_SERVICE_NAME,
    PUBLIC_LEGAL_EFFECTIVE_DATE,
    PUBLIC_LEGAL_CONTACT_EMAIL,
    PUBLIC_LEGAL_GOVERNING_LAW,
    PRIVACY_POLICY_INTRO,
    TERMS_INTRO,
    ...PRIVACY_POLICY_SECTIONS.flatMap((section) => [section.heading, ...section.paragraphs]),
    ...TERMS_SECTIONS.flatMap((section) => [section.heading, ...section.paragraphs])
  ].join("\n");
}
