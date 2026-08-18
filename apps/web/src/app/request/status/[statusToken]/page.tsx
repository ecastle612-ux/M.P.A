import { AuthChrome } from "../../../../components/auth/auth-chrome";
import { PublicRequestStatus } from "../../../../components/facility/public-request-status";

export default async function Page({ params }: { params: Promise<{ statusToken: string }> }) {
  const { statusToken } = await params;
  return (
    <AuthChrome>
      <div className="rounded-lg bg-white p-5 shadow-sm">
        <PublicRequestStatus statusToken={statusToken} />
      </div>
    </AuthChrome>
  );
}
