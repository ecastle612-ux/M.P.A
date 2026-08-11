import { PlatformErrorsPage } from "../../../../components/admin/platform-errors-page";
import { loadPlatformErrorsList } from "../../../../lib/admin/load-platform-errors";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Page({
  searchParams
}: {
  searchParams: Promise<SearchParams> | SearchParams;
}) {
  const params = await Promise.resolve(searchParams);
  const result = await loadPlatformErrorsList(params);
  return <PlatformErrorsPage result={result} />;
}
