import { Ma5CheckoutPage } from "../../../../components/admin/ma5-checkout-webhook-pages";
import { loadMa5CheckoutDirectory } from "../../../../lib/admin/load-ma5-checkout";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Page({
  searchParams
}: {
  searchParams: Promise<SearchParams> | SearchParams;
}) {
  const params = await Promise.resolve(searchParams);
  const directory = await loadMa5CheckoutDirectory(params);
  return <Ma5CheckoutPage directory={directory} />;
}
