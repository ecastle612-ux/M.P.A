import { Ma3AuditLogPage } from "../../../components/admin/ma3-audit-page";
import { loadMa3AuditDirectory } from "../../../lib/admin/load-ma3-audit";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Page({
  searchParams
}: {
  searchParams: Promise<SearchParams> | SearchParams;
}) {
  const params = await Promise.resolve(searchParams);
  const directory = await loadMa3AuditDirectory(params);
  return <Ma3AuditLogPage directory={directory} />;
}
