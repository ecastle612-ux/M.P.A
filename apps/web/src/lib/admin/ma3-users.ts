/**
 * MA-3 Users / Memberships — pure helpers (read-only).
 */

export type Ma3MembershipRow = {
  membershipId: string;
  userId: string;
  organizationId: string;
  organizationName: string;
  roles: string[];
  status: string;
  createdAt: string | null;
  updatedAt: string;
  displayName: string | null;
  email: string | null;
};

export type Ma3UserRow = {
  userId: string;
  displayName: string | null;
  email: string | null;
  organizationCount: number;
  roles: string[];
  membershipStatuses: string[];
  activeMembershipCount: number;
  createdAt: string | null;
  lastActivityAt: string | null;
  memberships: Ma3MembershipRow[];
};

export type Ma3UserFilters = {
  q?: string;
  organizationId?: string;
  role?: string;
  status?: string;
};

export function aggregateUsersFromMemberships(rows: Ma3MembershipRow[]): Ma3UserRow[] {
  const byUser = new Map<string, Ma3MembershipRow[]>();
  for (const row of rows) {
    const list = byUser.get(row.userId) ?? [];
    list.push(row);
    byUser.set(row.userId, list);
  }

  const users: Ma3UserRow[] = [];
  for (const [userId, memberships] of byUser) {
    const roles = [...new Set(memberships.flatMap((m) => m.roles))].filter(Boolean).sort();
    const statuses = [...new Set(memberships.map((m) => m.status))].sort();
    const activity = memberships
      .map((m) => m.updatedAt)
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a));
    const created = memberships
      .map((m) => m.createdAt)
      .filter((v): v is string => Boolean(v))
      .sort((a, b) => a.localeCompare(b));
    const first = memberships[0];
    users.push({
      userId,
      displayName: first?.displayName ?? null,
      email: first?.email ?? null,
      organizationCount: new Set(memberships.map((m) => m.organizationId)).size,
      roles,
      membershipStatuses: statuses,
      activeMembershipCount: memberships.filter((m) => m.status === "active").length,
      createdAt: created[0] ?? null,
      lastActivityAt: activity[0] ?? null,
      memberships: [...memberships].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    });
  }

  return users.sort((a, b) => (b.lastActivityAt ?? "").localeCompare(a.lastActivityAt ?? ""));
}

export function filterMemberships(
  rows: Ma3MembershipRow[],
  filters: Ma3UserFilters
): Ma3MembershipRow[] {
  const q = filters.q?.trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.organizationId && row.organizationId !== filters.organizationId) return false;
    if (filters.status && row.status !== filters.status) return false;
    if (filters.role) {
      const needle = filters.role.toLowerCase();
      if (!row.roles.some((r) => r.toLowerCase() === needle || r.toLowerCase().includes(needle))) {
        return false;
      }
    }
    if (q) {
      const hay = [
        row.userId,
        row.email ?? "",
        row.displayName ?? "",
        row.organizationId,
        row.organizationName,
        row.roles.join(" "),
        row.status
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function filterUsers(rows: Ma3UserRow[], filters: Ma3UserFilters): Ma3UserRow[] {
  const q = filters.q?.trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.organizationId) {
      if (!row.memberships.some((m) => m.organizationId === filters.organizationId)) return false;
    }
    if (filters.status) {
      if (!row.membershipStatuses.includes(filters.status)) return false;
    }
    if (filters.role) {
      const needle = filters.role.toLowerCase();
      if (!row.roles.some((r) => r.toLowerCase() === needle || r.toLowerCase().includes(needle))) {
        return false;
      }
    }
    if (q) {
      const hay = [
        row.userId,
        row.email ?? "",
        row.displayName ?? "",
        row.roles.join(" "),
        ...row.memberships.map((m) => `${m.organizationName} ${m.organizationId}`)
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function parseUserFilters(
  params: URLSearchParams | Record<string, string | string[] | undefined>
): Ma3UserFilters {
  const get = (key: string): string | undefined => {
    if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
    const raw = params[key];
    return Array.isArray(raw) ? raw[0] : raw;
  };
  const out: Ma3UserFilters = {};
  const q = get("q")?.trim();
  const organizationId = get("organizationId")?.trim();
  const role = get("role")?.trim();
  const status = get("status")?.trim();
  if (q) out.q = q;
  if (organizationId) out.organizationId = organizationId;
  if (role) out.role = role;
  if (status) out.status = status;
  return out;
}
