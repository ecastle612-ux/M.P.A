/** Remove trailing workflow/test numeric IDs from organization names. */
export function formatHumanOrganizationName(name: string): string {
  return name
    .replace(/\s+\d{10,}$/, "")
    .replace(/\s+Org\s+\d+$/i, "")
    .replace(/\s+Org$/i, "")
    .trim();
}

/** First name or friendly label for greetings — never returns database-style IDs. */
export function formatHumanGreetingName(
  displayName: string | null | undefined,
  email: string | null | undefined
): string | null {
  const trimmed = displayName?.trim();
  if (trimmed && !looksLikeInternalId(trimmed)) {
    const first = trimmed.split(/\s+/)[0];
    return first ? capitalize(first) : null;
  }

  const localPart = email?.split("@")[0]?.trim();
  if (localPart && !looksLikeInternalId(localPart)) {
    return null;
  }

  return null;
}

export function getTimeGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function looksLikeInternalId(value: string): boolean {
  if (/^\d+$/.test(value)) return true;
  if (/\d{10,}/.test(value)) return true;
  if (/^PMX Workflow Org/i.test(value)) return true;
  return false;
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}
