import { SigningProgressView } from "../../../../components/signature/signing-progress-view";

type PageProps = { params: Promise<{ token: string }> };

export default async function SigningProgressPage({ params }: PageProps) {
  const { token } = await params;
  return <SigningProgressView token={token} />;
}
