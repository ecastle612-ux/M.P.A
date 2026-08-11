import { Ma4SubscriptionsPage } from "../../../../components/admin/ma4-commercial-pages";
import { loadMa4SubscriptionsDirectory } from "../../../../lib/admin/load-ma4-subscriptions";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Page({
  searchParams
}: {
  searchParams: Promise<SearchParams> | SearchParams;
}) {
  const params = await Promise.resolve(searchParams);
  const directory = await loadMa4SubscriptionsDirectory(params);
  return <Ma4SubscriptionsPage directory={directory} />;
}
