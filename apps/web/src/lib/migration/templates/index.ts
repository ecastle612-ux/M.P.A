import type { MigrationEntityType, MigrationSourceSoftware } from "../contracts";
import appfolio from "./appfolio.json";
import buildium from "./buildium.json";
import custom from "./custom.json";
import doorloop from "./doorloop.json";
import other from "./other.json";
import propertyware from "./propertyware.json";
import rentManager from "./rent_manager.json";
import rentvine from "./rentvine.json";
import yardi from "./yardi.json";

export type SoftwareTemplateEntity = {
  columnMap: Record<string, string[]>;
};

export type SoftwareTemplate = {
  sourceSoftware: MigrationSourceSoftware;
  label: string;
  entityTypes: Partial<Record<MigrationEntityType, SoftwareTemplateEntity>>;
};

const TEMPLATE_MAP: Record<MigrationSourceSoftware, SoftwareTemplate> = {
  custom: custom as SoftwareTemplate,
  appfolio: appfolio as SoftwareTemplate,
  buildium: buildium as SoftwareTemplate,
  doorloop: doorloop as SoftwareTemplate,
  rent_manager: rentManager as SoftwareTemplate,
  propertyware: propertyware as SoftwareTemplate,
  yardi: yardi as SoftwareTemplate,
  rentvine: rentvine as SoftwareTemplate,
  other: other as SoftwareTemplate
};

export function getSoftwareTemplate(sourceSoftware: MigrationSourceSoftware): SoftwareTemplate {
  return TEMPLATE_MAP[sourceSoftware] ?? TEMPLATE_MAP["custom"];
}

export function listSoftwareTemplates(): SoftwareTemplate[] {
  return Object.values(TEMPLATE_MAP);
}
