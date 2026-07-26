/**
 * UX-012 Slice B — Component maturity registry ([26] maturity model).
 * States: Draft → Experimental → Beta → Production → Deprecated
 */

export type ComponentMaturity =
  | "Draft"
  | "Experimental"
  | "Beta"
  | "Production"
  | "Deprecated";

export type MaturityEntry = {
  id: string;
  name: string;
  maturity: ComponentMaturity;
  /** Slice that last advanced this family */
  slice: "A" | "B" | "C" | "D" | "E" | "pre";
  notes?: string;
};

/**
 * Inventory for shared primitives touched or shipped under UX-012 Slice B.
 * Production = tokenized + basic a11y + used (or ready) on product surfaces.
 * Beta = API stable-ish; limited adoption / a11y incomplete.
 */
export const COMPONENT_MATURITY: MaturityEntry[] = [
  { id: "button", name: "Button", maturity: "Production", slice: "B", notes: "loading + Spinner" },
  { id: "input", name: "Input", maturity: "Production", slice: "B", notes: "error state" },
  { id: "textarea", name: "Textarea", maturity: "Production", slice: "B", notes: "error state" },
  { id: "select", name: "Select", maturity: "Production", slice: "B", notes: "error state" },
  { id: "checkbox", name: "Checkbox", maturity: "Production", slice: "B", notes: "optional label" },
  { id: "radio", name: "Radio / RadioGroup", maturity: "Beta", slice: "B" },
  { id: "switch", name: "Switch", maturity: "Production", slice: "B" },
  { id: "form-field", name: "FormField", maturity: "Production", slice: "B", notes: "login adoption" },
  { id: "link", name: "Link", maturity: "Beta", slice: "B" },
  { id: "icon", name: "Icon", maturity: "Beta", slice: "B" },
  { id: "badge", name: "Badge", maturity: "Production", slice: "B" },
  { id: "tag", name: "Tag", maturity: "Beta", slice: "B" },
  { id: "avatar", name: "Avatar", maturity: "Production", slice: "B" },
  { id: "tabs", name: "Tabs", maturity: "Production", slice: "B" },
  { id: "combobox", name: "Combobox / Menu recipes", maturity: "Beta", slice: "B" },
  { id: "tooltip", name: "Tooltip", maturity: "Production", slice: "B" },
  { id: "modal", name: "Modal", maturity: "Production", slice: "B", notes: "focus trap + z-token" },
  { id: "drawer", name: "Drawer", maturity: "Production", slice: "B", notes: "focus trap + z-token" },
  { id: "sheet", name: "Sheet", maturity: "Production", slice: "B", notes: "Drawer alias" },
  { id: "toast", name: "Toast", maturity: "Production", slice: "B", notes: "z-token" },
  { id: "banner", name: "Banner", maturity: "Beta", slice: "B" },
  { id: "skeleton", name: "Skeleton", maturity: "Production", slice: "B" },
  { id: "spinner", name: "Spinner", maturity: "Production", slice: "B" },
  { id: "progress", name: "Progress", maturity: "Production", slice: "B" },
  { id: "card", name: "Card", maturity: "Production", slice: "B", notes: "space tokens" },
  {
    id: "table",
    name: "Table",
    maturity: "Production",
    slice: "B",
    notes: "density + TableEmpty"
  },
  {
    id: "nav-item",
    name: "NavItem / NavList",
    maturity: "Production",
    slice: "B",
    notes: "nav pill pattern"
  },
  { id: "empty-state", name: "EmptyState", maturity: "Production", slice: "B" },
  { id: "page-header", name: "PageHeader", maturity: "Production", slice: "B" },
  { id: "form-section", name: "FormSection", maturity: "Production", slice: "B" }
];

export function getComponentMaturity(id: string): MaturityEntry | undefined {
  return COMPONENT_MATURITY.find((entry) => entry.id === id);
}

export function componentsAtOrAbove(min: ComponentMaturity): MaturityEntry[] {
  const order: ComponentMaturity[] = [
    "Draft",
    "Experimental",
    "Beta",
    "Production",
    "Deprecated"
  ];
  const minIndex = order.indexOf(min);
  return COMPONENT_MATURITY.filter((entry) => {
    if (entry.maturity === "Deprecated") return min === "Deprecated";
    return order.indexOf(entry.maturity) >= minIndex;
  });
}
