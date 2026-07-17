import { EmptyState } from "@mpa/ui";
import {
  getModuleEmptyStateProps,
  type ModuleEmptyStateKey
} from "../../lib/experience/empty-states";

export function ExperienceEmptyState({
  module,
  canCreate = true,
  canSecondary = true
}: {
  module: ModuleEmptyStateKey;
  canCreate?: boolean;
  canSecondary?: boolean;
}) {
  return <EmptyState {...getModuleEmptyStateProps(module, { canCreate, canSecondary })} />;
}
