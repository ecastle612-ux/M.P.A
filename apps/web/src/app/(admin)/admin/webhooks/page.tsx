import { Ma5WebhooksPage } from "../../../../components/admin/ma5-checkout-webhook-pages";
import { loadMa5WebhookDirectory } from "../../../../lib/admin/load-ma5-webhooks";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Page({
  searchParams
}: {
  searchParams: Promise<SearchParams> | SearchParams;
}) {
  const params = await Promise.resolve(searchParams);
  const directory = await loadMa5WebhookDirectory(params);
  return <Ma5WebhooksPage directory={directory} />;
}
