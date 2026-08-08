import type { DemoProductId } from "../products";

export type DemoAttentionItem = {
  id: string;
  title: string;
  severity: "immediate" | "waiting" | "info";
  module: string;
  detail: string;
};

export type DemoProperty = {
  id: string;
  name: string;
  address: string;
  units: number;
  occupancyPct: number;
  openWorkOrders: number;
};

export type DemoResident = {
  id: string;
  name: string;
  unit: string;
  propertyId: string;
  leaseStatus: "active" | "notice" | "pending";
  balance: number;
};

export type DemoLease = {
  id: string;
  residentId: string;
  propertyId: string;
  unit: string;
  startDate: string;
  endDate: string;
  rent: number;
};

export type DemoWorkOrder = {
  id: string;
  title: string;
  propertyId: string;
  status: "open" | "in_progress" | "scheduled" | "done";
  priority: "urgent" | "normal" | "low";
  assignee: string;
};

export type DemoInvoice = {
  id: string;
  vendor: string;
  amount: number;
  status: "pending_approval" | "approved" | "paid";
  propertyId: string;
};

export type DemoDocument = {
  id: string;
  name: string;
  category: string;
  updatedAt: string;
};

export type DemoMessage = {
  id: string;
  from: string;
  subject: string;
  preview: string;
  at: string;
};

export type DemoSite = {
  id: string;
  name: string;
  city: string;
  locations: number;
  assets: number;
};

export type DemoAsset = {
  id: string;
  name: string;
  siteId: string;
  system: string;
  status: "operational" | "attention" | "down";
};

export type DemoPmSnapshot = {
  organizationName: string;
  properties: DemoProperty[];
  residents: DemoResident[];
  leases: DemoLease[];
  workOrders: DemoWorkOrder[];
  invoices: DemoInvoice[];
  documents: DemoDocument[];
  messages: DemoMessage[];
  attention: DemoAttentionItem[];
  assistantBrief: string;
};

export type DemoFoSnapshot = {
  organizationName: string;
  sites: DemoSite[];
  assets: DemoAsset[];
  correctiveWork: DemoWorkOrder[];
  preventiveTasks: Array<{ id: string; title: string; due: string; siteId: string }>;
  inventory: Array<{ id: string; sku: string; name: string; qty: number; location: string }>;
  inspections: Array<{ id: string; title: string; status: string; siteId: string }>;
  safetyItems: Array<{ id: string; title: string; severity: string }>;
  complianceItems: Array<{ id: string; title: string; due: string }>;
  attention: DemoAttentionItem[];
  assistantBrief: string;
};

export type DemoSnapshotBundle = {
  version: string;
  product: DemoProductId;
  watermark: string;
  pm: DemoPmSnapshot | null;
  fo: DemoFoSnapshot | null;
};
