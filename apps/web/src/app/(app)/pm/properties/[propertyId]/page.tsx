import { Breadcrumbs } from "../../../../../components/shell/breadcrumbs";
import { PropertyFinancialPanel } from "../../../../../components/finance/property-financial-panel";

type Params = { params: Promise<{ propertyId: string }> };

export default async function PropertyMoneyPage({ params }: Params) {
  const { propertyId } = await params;
  return (
    <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs
        items={[
          { href: "/launcher", label: "Launcher" },
          { href: "/pm/mission-control", label: "Property Manager" },
          { href: "/pm/properties", label: "Properties" },
          { label: "Money" }
        ]}
      />
      <PropertyFinancialPanel propertyId={propertyId} />
    </main>
  );
}
