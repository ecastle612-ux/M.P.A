import type { Metadata } from "next";
import { LegalDocumentPage } from "../../../components/marketing/legal-document-page";
import { TERMS_INTRO, TERMS_SECTIONS } from "../../../lib/legal/public-legal-copy";
import { createAuthServerClient } from "../../../lib/auth/server";

export const metadata: Metadata = {
  title: "Terms of Use — My Property Assistant",
  description: "Terms for using My Property Assistant (M.P.A.), including SaaS subscription billing."
};

export default async function TermsOfUsePage() {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <LegalDocumentPage
      isAuthenticated={Boolean(user)}
      title="Terms of Use"
      intro={TERMS_INTRO}
      sections={TERMS_SECTIONS}
    />
  );
}
