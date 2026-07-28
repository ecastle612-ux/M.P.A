import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import {
  issueContactVerification,
  resolveOrganizationIdForUser,
  isContactEmailVerified
} from "../../../../lib/auth/contact-verification";
import { clearMustVerifyContact } from "../../../../lib/auth/identity";

export async function POST() {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  if (await isContactEmailVerified(user.id)) {
    await clearMustVerifyContact(user.id);
    return NextResponse.json({ sent: false, alreadyVerified: true });
  }

  const organizationId = await resolveOrganizationIdForUser(user.id);
  if (!organizationId) {
    return NextResponse.json({ error: "No organization context for verification." }, { status: 400 });
  }

  const result = await issueContactVerification({
    authUserId: user.id,
    organizationId
  });

  return NextResponse.json({ sent: result.sent, email: result.email });
}
