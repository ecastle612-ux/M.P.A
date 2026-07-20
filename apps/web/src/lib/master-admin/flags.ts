function present(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

export type MasterAdminFlagSnapshot = {
  public: {
    NEXT_PUBLIC_DESIGN_PARTNER_MODE: string | null;
    NEXT_PUBLIC_MPA_ENV: string | null;
  };
  providerEnvPresent: Record<string, boolean>;
};

export function getMasterAdminFlagSnapshot(): MasterAdminFlagSnapshot {
  return {
    public: {
      NEXT_PUBLIC_DESIGN_PARTNER_MODE: process.env["NEXT_PUBLIC_DESIGN_PARTNER_MODE"]?.trim() || null,
      NEXT_PUBLIC_MPA_ENV: process.env["NEXT_PUBLIC_MPA_ENV"]?.trim() || null
    },
    providerEnvPresent: {
      STRIPE_SECRET_KEY: present(process.env["STRIPE_SECRET_KEY"]),
      CHECKR_API_KEY: present(process.env["CHECKR_API_KEY"]),
      DROPBOX_SIGN_API_KEY: present(process.env["DROPBOX_SIGN_API_KEY"]),
      ONESIGNAL_REST_API_KEY: present(process.env["ONESIGNAL_REST_API_KEY"]),
      RESEND_API_KEY: present(process.env["RESEND_API_KEY"]),
      TWILIO_AUTH_TOKEN: present(process.env["TWILIO_AUTH_TOKEN"]),
      OPENAI_API_KEY: present(process.env["OPENAI_API_KEY"]),
      SUPABASE_SERVICE_ROLE_KEY: present(process.env["SUPABASE_SERVICE_ROLE_KEY"])
    }
  };
}
