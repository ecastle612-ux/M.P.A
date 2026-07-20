import { describe, expect, it } from "vitest";
import { EMAIL_TEMPLATE_KEYS } from "./contracts";
import {
  invitationEmailContent,
  passwordResetAuthTemplateHtml,
  renderMpaEmail
} from "./render";

describe("EML-001 renderMpaEmail", () => {
  it("renders branded layout without exposing template keys", () => {
    const result = renderMpaEmail({
      templateKey: "general_notification",
      subject: "Portfolio update",
      body: "Your portfolio summary is ready.\n\nReview it when you have a moment.",
      href: "/dashboard",
      recipientName: "Alex"
    });

    expect(result.subject).toBe("Portfolio update");
    expect(result.html).toContain("M.P.A.");
    expect(result.html).toContain("My Property Assistant");
    expect(result.html).toContain("Open in M.P.A.");
    expect(result.html).toContain("support@my-property-assistant.com");
    expect(result.html).toContain("/branding/logo-light.png");
    expect(result.html).toContain("#0F6B56");
    expect(result.html).not.toContain("general_notification");
    expect(result.html).not.toContain("Georgia");
    expect(result.html).not.toContain("templateKey");
    expect(result.html).toContain("font-family:'IBM Plex Sans'");
    expect(result.html).not.toContain('font-family:"IBM');
    expect(result.text).toContain("Hello Alex,");
    expect(result.text).toContain("Support: support@my-property-assistant.com");
    expect(result.text).toContain("Open in M.P.A.:");
  });

  it("covers every template key with premium chrome", () => {
    for (const templateKey of EMAIL_TEMPLATE_KEYS) {
      if (templateKey === "password_reset") continue;
      const result = renderMpaEmail({
        templateKey,
        subject: `Subject ${templateKey}`,
        body: `Body for ${templateKey}`,
        href: "/portal"
      });
      expect(result.html).toContain("border-radius:6px");
      expect(result.html).toContain("support@my-property-assistant.com");
      expect(result.html).not.toContain(`(${templateKey})`);
      expect(result.text).toContain("My Property Assistant (M.P.A.)");
    }
  });

  it("builds invitation content with accept CTA", () => {
    const result = invitationEmailContent({
      email: "pm@example.com",
      token: "invite-token",
      roles: ["property_manager"]
    });
    expect(result.html).toContain("Accept invitation");
    expect(result.html).toContain("/accept-invitation/invite-token");
    expect(result.subject).toContain("invited");
  });

  it("exports Auth password reset HTML with ConfirmationURL placeholder", () => {
    const html = passwordResetAuthTemplateHtml();
    expect(html).toContain("{{ .ConfirmationURL }}");
    expect(html).toContain("Reset password");
    expect(html).toContain("Security");
    expect(html).not.toContain("password_reset");
    expect(html).toContain("support@my-property-assistant.com");
    expect(html).toContain("/branding/logo-light.png");
  });
});
