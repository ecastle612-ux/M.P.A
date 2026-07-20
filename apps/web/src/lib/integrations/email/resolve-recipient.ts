const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Minimal Supabase-like client surface — query builders are chainable and not worth modeling here. */
type LooseClient = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase builder chain
  from: (table: string) => any;
};

export function isValidEmailAddress(value: string | null | undefined): value is string {
  return Boolean(value && EMAIL_RE.test(value.trim()));
}

/**
 * Resolve a deliverable email for a user without calling Auth Admin APIs.
 * Prefers user_profiles.contact_email, then tenants.email linked to the user.
 */
export async function resolveUserEmailAddress(
  organizationId: string,
  userId: string,
  client: LooseClient
): Promise<{ email: string; name: string | null } | null> {
  const { data: profile } = await client
    .from("user_profiles")
    .select("contact_email, display_name")
    .eq("user_id", userId)
    .maybeSingle();

  const contactEmail =
    typeof profile?.contact_email === "string" ? String(profile.contact_email).trim() : "";
  const displayName =
    typeof profile?.display_name === "string" ? String(profile.display_name).trim() : null;

  if (isValidEmailAddress(contactEmail)) {
    return { email: contactEmail.toLowerCase(), name: displayName };
  }

  const { data: tenant } = await client
    .from("tenants")
    .select("email, first_name, last_name, preferred_name")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  const tenantEmail = typeof tenant?.email === "string" ? String(tenant.email).trim() : "";
  if (!isValidEmailAddress(tenantEmail)) return null;

  const preferred =
    typeof tenant.preferred_name === "string" && tenant.preferred_name.trim()
      ? String(tenant.preferred_name).trim()
      : null;
  const first = typeof tenant.first_name === "string" ? String(tenant.first_name) : "";
  const last = typeof tenant.last_name === "string" ? String(tenant.last_name) : "";
  const name = preferred || `${first} ${last}`.trim() || displayName;

  return { email: tenantEmail.toLowerCase(), name };
}
