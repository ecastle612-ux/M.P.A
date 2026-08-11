import { Ma3UsersPage } from "../../../../components/admin/ma3-users-page";
import { loadMa3UsersDirectory } from "../../../../lib/admin/load-ma3-users";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Page({
  searchParams
}: {
  searchParams: Promise<SearchParams> | SearchParams;
}) {
  const params = await Promise.resolve(searchParams);
  const directory = await loadMa3UsersDirectory(params);
  return <Ma3UsersPage directory={directory} />;
}
