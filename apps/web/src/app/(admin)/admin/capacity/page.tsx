import { Ma4CapacityPage } from "../../../../components/admin/ma4-commercial-pages";
import { loadMa4CapacityDirectory } from "../../../../lib/admin/load-ma4-capacity";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Page({
  searchParams
}: {
  searchParams: Promise<SearchParams> | SearchParams;
}) {
  const params = await Promise.resolve(searchParams);
  const directory = await loadMa4CapacityDirectory(params);
  return <Ma4CapacityPage directory={directory} />;
}
