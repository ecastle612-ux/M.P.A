import { AdminSimplePage } from "../../../../../components/admin/master-admin-pages";

export default function Page() {
  return (
    <AdminSimplePage
      title="Operators"
      description="Master Admin operator access. Bootstrap via app_metadata.platform_operator or platform_operators table."
      status="aligned"
    />
  );
}
