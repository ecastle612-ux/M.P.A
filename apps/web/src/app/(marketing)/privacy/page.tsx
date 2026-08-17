import type { Metadata } from "next";
import { LegalDocumentPage } from "../../../components/marketing/legal-document-page";
import { PRIVACY_POLICY_INTRO, PRIVACY_POLICY_SECTIONS } from "../../../lib/legal/public-legal-copy";
import { createAuthServerClient } from "../../../lib/auth/server";

export const metadata: Metadata = {
  title: "Privacy Policy — My Property Assistant",
  description:
    "How My Property Assistant (M.P.A.) handles account, organization, and SaaS billing information."
};

export default async function PrivacyPolicyPage() {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <LegalDocumentPage
      isAuthenticated={Boolean(user)}
      title="Privacy Policy"
      intro={PRIVACY_POLICY_INTRO}
      sections={PRIVACY_POLICY_SECTIONS}
    />
  );
}
