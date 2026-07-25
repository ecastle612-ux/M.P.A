import { BrandedLoadingScreen } from "../../components/branding/branded-loading-screen";

/** Auth chrome is always dark → dark-mode logo. */
export default function AuthLoading() {
  return <BrandedLoadingScreen tone="dark-surface" message="Preparing a secure sign-in…" />;
}
