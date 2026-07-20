import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { EMAIL_TEMPLATE_KEYS } from "../../src/lib/integrations/email/contracts";
import { passwordResetAuthTemplateHtml, renderMpaEmail } from "../../src/lib/integrations/email/render";

process.env["NEXT_PUBLIC_APP_URL"] = "https://www.my-property-assistant.com";

const dir = "/Users/erickcastillo/mpa/docs/81-eml-001-transactional-email-experience/fixtures/after";
mkdirSync(dir, { recursive: true });

const samples: Record<string, { subject: string; body: string; href: string }> = {
  user_invitation: {
    subject: "You're invited to My Property Assistant",
    body: "You have been invited to join an organization on My Property Assistant as property_manager.\n\nUse the button below to accept your invitation and get started.",
    href: "/accept-invitation/demo"
  },
  welcome_email: {
    subject: "Welcome to M.P.A.",
    body: "Your resident account is ready.\n\nOpen your portal to get started.",
    href: "/portal/tenant"
  },
  announcement_email: {
    subject: "Building notice",
    body: "Elevator maintenance this Saturday 9am–12pm.\n\nPlease plan accordingly.",
    href: "/portal/tenant/announcements"
  },
  maintenance_notification: {
    subject: "Work order update",
    body: "Your work order WO-1042 is in progress.\n\nWe will notify you when it is complete.",
    href: "/maintenance/demo"
  },
  owner_statement: {
    subject: "Owner statement ready",
    body: "Your owner statement for June 2026 is ready to review.",
    href: "/financials/owner-statements/demo"
  },
  financial_report: {
    subject: "Financial summary",
    body: "A new financial report is available in M.P.A.",
    href: "/financials"
  },
  general_notification: {
    subject: "Notification from M.P.A.",
    body: "You have a new update in M.P.A.",
    href: "/dashboard"
  }
};

for (const key of EMAIL_TEMPLATE_KEYS) {
  if (key === "password_reset") {
    const html = passwordResetAuthTemplateHtml();
    writeFileSync(`${dir}/password_reset.auth.html`, html);
    writeFileSync("/Users/erickcastillo/mpa/supabase/templates/recovery.html", html);
    continue;
  }
  const sample = samples[key]!;
  const { html, text } = renderMpaEmail({
    templateKey: key,
    subject: sample.subject,
    body: sample.body,
    href: sample.href,
    recipientName: "Alex"
  });
  writeFileSync(`${dir}/${key}.html`, html);
  writeFileSync(`${dir}/${key}.txt`, text);
}

const sampleHtml = readFileSync(`${dir}/general_notification.html`, "utf8");
if (sampleHtml.includes('font-family:"IBM')) {
  throw new Error("broken double-quoted font stack remains");
}
if (!sampleHtml.includes("font-family:'IBM Plex Sans'")) {
  throw new Error("expected single-quoted font stack");
}

console.log("EML-001 after fixtures regenerated");
