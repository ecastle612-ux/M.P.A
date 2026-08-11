import { Ma6PropertiesPage } from "../../../../../components/admin/ma6-operations-pages";
import { loadMa6OperationsSnapshot } from "../../../../../lib/admin/load-ma6-operations";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Page({
  searchParams
}: {
  searchParams: Promise<SearchParams> | SearchParams;
}) {
  const params = await Promise.resolve(searchParams);
  const snapshot = await loadMa6OperationsSnapshot(params, "properties");
  return <Ma6PropertiesPage snapshot={snapshot} />;
}
