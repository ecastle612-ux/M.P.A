export const PARTNER_RESERVED_SLUGS = new Set([
  "partners",
  "partner",
  "request",
  "admin",
  "login",
  "signup",
  "pricing",
  "checkout",
  "enterprise",
  "modules",
  "get-started",
  "demo",
  "api",
  "www",
  "static",
  "complimentary",
  "portal",
  "billing",
  "settings",
  "launcher",
  "setup",
  "unauthorized",
  "commerce",
  "webhook",
  "webhooks",
  "mpa",
  "my-property-assistant"
]);

export function normalizePartnerSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function slugFromCompanyName(companyName: string): string {
  return normalizePartnerSlug(companyName);
}

export function isReservedPartnerSlug(slug: string): boolean {
  return PARTNER_RESERVED_SLUGS.has(slug);
}

export function validatePartnerSlug(value: unknown): { ok: true; slug: string } | { ok: false; error: string } {
  if (typeof value !== "string" || !value.trim()) {
    return { ok: false, error: "Public slug is required." };
  }
  const slug = normalizePartnerSlug(value);
  if (slug.length < 3) {
    return { ok: false, error: "Public slug must be at least 3 characters." };
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { ok: false, error: "Public slug may contain letters, numbers, and hyphens only." };
  }
  if (isReservedPartnerSlug(slug)) {
    return { ok: false, error: "That public slug is reserved." };
  }
  return { ok: true, slug };
}

export function parsePartnerRefParam(value: string | null | undefined): string | null {
  if (!value) return null;
  const slug = normalizePartnerSlug(value);
  if (slug.length < 3 || isReservedPartnerSlug(slug)) return null;
  return slug;
}

export function partnerReferralPath(slug: string): string {
  return `/get-started?ref=${encodeURIComponent(slug)}`;
}

export function partnerRequestPreviewPath(slug: string): string {
  return `/request/${encodeURIComponent(slug)}`;
}

export function proposePartnerSlug(companyName: string, taken: ReadonlySet<string>): string {
  const base = validatePartnerSlug(slugFromCompanyName(companyName));
  let candidate = base.ok ? base.slug : "partner-company";
  if (isReservedPartnerSlug(candidate) || candidate.length < 3) {
    candidate = "partner-company";
  }
  if (!taken.has(candidate) && !isReservedPartnerSlug(candidate)) {
    return candidate;
  }
  for (let index = 2; index < 1000; index += 1) {
    const next = `${candidate}-${index}`.slice(0, 48);
    const checked = validatePartnerSlug(next);
    if (checked.ok && !taken.has(checked.slug)) {
      return checked.slug;
    }
  }
  return `partner-${Math.random().toString(36).slice(2, 10)}`;
}
