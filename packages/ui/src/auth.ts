/**
 * M0-PERF Option B — auth-route UI entry.
 * Export only primitives needed by login / password recovery forms.
 * Do not re-export command palette, drawer, modal, or theme providers.
 */
export { cn } from "./lib/cn";
export { Button } from "./primitives/button";
export { Input } from "./primitives/input";
export {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from "./primitives/card";
export { FormField, destructiveConfirmLabel } from "./primitives/form-field";
export { Link } from "./primitives/link";
export { FormSection } from "./components/form-section";
