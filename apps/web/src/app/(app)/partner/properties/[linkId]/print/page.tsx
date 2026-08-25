import { PartnerPropertyQrPrintPage } from "../../../../../../components/partners/partner-property-qr-print-page";

export default async function Page({ params }: { params: Promise<{ linkId: string }> }) {
  const { linkId } = await params;
  return <PartnerPropertyQrPrintPage linkId={linkId} />;
}
