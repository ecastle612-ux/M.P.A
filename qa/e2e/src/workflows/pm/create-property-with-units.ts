import type { Page } from "@playwright/test";
import { PropertiesPage } from "../../pages/properties.page";
import { qaOrgName } from "../../utils/env";

export async function createPropertySmoke(page: Page) {
  const properties = new PropertiesPage(page);
  await properties.openCreate();
  const name = qaOrgName("property");
  await properties.fillMinimalProperty(name);
  await properties.submit();
  return name;
}
