export type InvitationAudience = "tenant" | "staff" | "vendor";

export function invitationAudienceFromRoleLabel(roleLabel: string): InvitationAudience {
  const normalized = roleLabel.trim().toLowerCase();
  if (normalized === "tenant") {
    return "tenant";
  }
  if (normalized === "vendor") {
    return "vendor";
  }
  return "staff";
}

export function invitationEmailCopy(input: {
  organizationName: string;
  roleLabel: string;
  inviterLabel?: string | undefined;
}): {
  subject: string;
  headline: string;
  previewText: string;
  paragraphs: string[];
  ctaLabel: string;
} {
  const audience = invitationAudienceFromRoleLabel(input.roleLabel);
  const org = input.organizationName.trim() || "your property team";
  const who = input.inviterLabel?.trim();

  if (audience === "tenant") {
    return {
      subject: "You've been invited to M.P.A.",
      headline: "You've been invited to M.P.A.",
      previewText: `Join ${org} to view your home, payments, and maintenance.`,
      paragraphs: [
        who
          ? `${who} invited you to M.P.A. so you can stay connected with ${org}.`
          : `You've been invited to M.P.A. so you can stay connected with ${org}.`,
        "Use this invitation to view your home, payments, maintenance requests, and messages from your property team.",
        "Accept the invitation to create or sign in to your account. This link expires in 7 days."
      ],
      ctaLabel: "Accept Invitation"
    };
  }

  if (audience === "vendor") {
    return {
      subject: `You've been invited to work with ${org}`,
      headline: `You've been invited to work with ${org}`,
      previewText: `Accept your invitation to view assigned work.`,
      paragraphs: [
        who
          ? `${who} invited you to work with ${org} as a vendor.`
          : `You've been invited to work with ${org} as a vendor.`,
        "Accept this invitation to see assigned work orders and updates from the property team.",
        "This link expires in 7 days."
      ],
      ctaLabel: "Accept Invitation"
    };
  }

  return {
    subject: `You've been invited to help manage ${org}`,
    headline: `You've been invited to help manage ${org}`,
    previewText: `Join ${org} as ${input.roleLabel}.`,
    paragraphs: [
      who
        ? `${who} invited you to help manage ${org} as ${input.roleLabel}.`
        : `You've been invited to help manage ${org} as ${input.roleLabel}.`,
      "Accept this invitation to open your workspace and start with the work assigned to your role.",
      "This link expires in 7 days."
    ],
    ctaLabel: "Accept Invitation"
  };
}

export function lifecycleEmailPresentation(input: {
  key: string;
  title: string;
  body: string;
}): { subject: string; ctaLabel: string; body: string } {
  const key = input.key;
  if (key === "work_order.assigned") {
    return {
      subject: "New work order assigned",
      ctaLabel: "Open Work Order",
      body: input.body
    };
  }
  if (key === "vendor.assigned") {
    return {
      subject: "New work assigned",
      ctaLabel: "Open Vendor Portal",
      body: input.body
    };
  }
  if (key === "work_order.emergency") {
    return {
      subject: "Emergency work order",
      ctaLabel: "Open Work Order",
      body: input.body
    };
  }
  if (key.startsWith("work_order.")) {
    return {
      subject: input.title,
      ctaLabel: "Open Work Order",
      body: input.body
    };
  }
  return {
    subject: input.title,
    ctaLabel: "Open in M.P.A.",
    body: input.body
  };
}
