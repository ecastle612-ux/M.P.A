/** docs/152 M2D Owner-approved Development unit map. SQL `finance_m2d_*` is authoritative. */

export const DOCS_152_M2D_VERSION = "docs_152_m2d_owner_unit_map";
export const DOCS_152_M2D_MIGRATION = "20260816054252";
export const MPA_DEVELOPMENT_ORG_ID = "f8232926-149d-46b3-829f-c84b55378718";
export const CAMERON_OPTION_B_UNIT_ID = "2649465e-1894-4c19-b699-457c8570a7f3";

export const M2D_EXPECTED_MONEY = {
  charges: 12,
  gross: 18240,
  paid: 8960,
  payments: 8,
  outstanding: 9280
} as const;

export const M2D_PROPERTIES = {
  mapleCourt: "737977ae-1f08-4e4e-8368-545e91f05fac",
  harborView: "d22cb503-eebf-436f-906d-503fe61207a4",
  summit: "5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a"
} as const;

export type M2dApprovedRow = {
  resident: string;
  chargeId: string;
  leaseId: string;
  tenantId: string;
  propertyId: string;
  currentUnitId: string;
  newUnitId: string;
  newUnitNumber: string;
};

export const M2D_APPROVED_MAP: readonly M2dApprovedRow[] = [
  {
    resident: "Reese Kim",
    chargeId: "de460536-d3c9-45c6-bfcd-4f14c42f3991",
    leaseId: "0c4f5b19-7d0b-41e2-ae23-bb692273a4f0",
    tenantId: "c88f5430-3dfb-4712-8731-47f43f315950",
    propertyId: M2D_PROPERTIES.mapleCourt,
    currentUnitId: "03dc55de-6395-41cf-b187-e36e18e2d307",
    newUnitId: "a8259856-39aa-42f4-9db3-43870243f790",
    newUnitNumber: "002"
  },
  {
    resident: "Riley Foster",
    chargeId: "888c5d4b-d3e1-4e30-9d7b-397baa6f8e7e",
    leaseId: "e0596f95-99ca-48c8-be94-16b19eb329b4",
    tenantId: "fc9b6cec-3f1f-4f17-9d31-ca07061899ac",
    propertyId: M2D_PROPERTIES.harborView,
    currentUnitId: "9e345d47-1d11-4d5c-b4ff-164cfaf81eb0",
    newUnitId: "6c1cb9e3-fb36-474a-b600-ba13f7258dc2",
    newUnitNumber: "001"
  },
  {
    resident: "Jordan Chen",
    chargeId: "c38053b1-621f-49bb-a2fb-33d621279ff5",
    leaseId: "dcf2faa2-16bc-4bad-83da-5b05d84aba90",
    tenantId: "b17e92f9-52ee-4a15-bb58-2a2da488decd",
    propertyId: M2D_PROPERTIES.harborView,
    currentUnitId: "a8259856-39aa-42f4-9db3-43870243f790",
    newUnitId: "03dc55de-6395-41cf-b187-e36e18e2d307",
    newUnitNumber: "002"
  },
  {
    resident: "Hayden Ibrahim",
    chargeId: "daa44657-291b-4e76-a7c5-a1a312ad647a",
    leaseId: "78af7e29-629b-478a-bd3f-e249b8ba865e",
    tenantId: "7ffbf72c-0c65-4c6c-aa32-e21fd8de8d7a",
    propertyId: M2D_PROPERTIES.harborView,
    currentUnitId: "61ddf528-832d-4730-b788-249344f4c9fb",
    newUnitId: "e24d173b-bd7b-4b20-97f2-cc83d146d34e",
    newUnitNumber: "004"
  },
  {
    resident: "Dakota Martin",
    chargeId: "5fada492-d95f-492c-b612-8126fcf63cc9",
    leaseId: "085aff65-15dc-4753-b560-5eec2b1fd10e",
    tenantId: "3153d61e-5784-4fe8-b962-c70a4149e7be",
    propertyId: M2D_PROPERTIES.summit,
    currentUnitId: "e24d173b-bd7b-4b20-97f2-cc83d146d34e",
    newUnitId: "261524d5-c2d6-4d4b-9149-8b86ac3b5633",
    newUnitNumber: "003"
  },
  {
    resident: "Taylor Diaz",
    chargeId: "6405eeca-afba-42e7-a077-ceccec85b6bd",
    leaseId: "35e5bda1-a404-4823-9b16-aa84c92a35c5",
    tenantId: "ce8d6c0b-5128-44e9-bb8e-b5dc0772c68c",
    propertyId: M2D_PROPERTIES.summit,
    currentUnitId: "93033440-87eb-4919-93b8-c8b4b09b6f69",
    newUnitId: "a87fb591-d655-4a85-9b65-e9788337417f",
    newUnitNumber: "004"
  },
  {
    resident: "Parker Johnson",
    chargeId: "ca4288cb-ebe9-4a8d-b7e3-5a8ba6f96fdc",
    leaseId: "ff4e7e91-b26d-407a-a94e-e7b71c4c8fad",
    tenantId: "51b047bb-3d55-4516-ad82-399c027dda03",
    propertyId: M2D_PROPERTIES.summit,
    currentUnitId: "6c1cb9e3-fb36-474a-b600-ba13f7258dc2",
    newUnitId: "d2c1a9ed-a555-437b-90c5-032a0e2da3de",
    newUnitNumber: "005"
  },
  {
    resident: "Casey Garcia",
    chargeId: "d4fadeac-adf8-4ba0-a84a-76c9a9b41633",
    leaseId: "e348d409-be75-465e-bdba-8d1168a0de74",
    tenantId: "281486d5-cfed-4ce9-bba4-4667401fd559",
    propertyId: M2D_PROPERTIES.summit,
    currentUnitId: "8f02b5b5-1935-4a84-8d28-237dcbabd38e",
    newUnitId: "ef390c04-4586-430c-96fe-25b3df117f04",
    newUnitNumber: "006"
  }
];

export function assertM2dMapIntegrity(rows: readonly M2dApprovedRow[] = M2D_APPROVED_MAP): void {
  if (rows.length !== 8) {
    throw new Error(`m2d_map_count:${rows.length}`);
  }
  const newUnits = new Set(rows.map((row) => row.newUnitId));
  if (newUnits.size !== 8) {
    throw new Error("m2d_duplicate_target_unit");
  }
  if (rows.some((row) => row.newUnitId === CAMERON_OPTION_B_UNIT_ID)) {
    throw new Error("m2d_cameron_option_b_collision");
  }
  if (rows.some((row) => row.currentUnitId === row.newUnitId)) {
    throw new Error("m2d_identity_noop_row");
  }
}
