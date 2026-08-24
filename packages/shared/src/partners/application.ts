import { isPartnerType, type PartnerType } from "./config";

const MAX_TEXT = {
  companyName: 160,
  contactName: 120,
  email: 254,
  phone: 40,
  website: 200,
  city: 80,
  state: 40,
  serviceArea: 240,
  companyServiceType: 160,
  servicesOffered: 800,
  customersServed: 80,
  mpaAccountEmail: 254,
  notes: 2000
} as const;

function trim(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function optionalTrim(value: unknown, max: number): string | null {
  const next = trim(value, max);
  return next ? next : null;
}

export type PartnerApplicationInput = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string | null;
  city: string;
  state: string;
  serviceArea: string;
  companyServiceType: string;
  servicesOffered: string;
  customersServed: string | null;
  mpaAccountEmail: string | null;
  interestedPartnerType: PartnerType;
  notes: string | null;
};

export function parsePartnerApplicationInput(
  payload: unknown
): { ok: true; data: PartnerApplicationInput } | { ok: false; error: string } {
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "Invalid application." };
  }
  const body = payload as Record<string, unknown>;
  if (typeof body["company_fax"] === "string" && body["company_fax"].trim()) {
    return { ok: false, error: "spam" };
  }
  const companyName = trim(body["companyName"], MAX_TEXT.companyName);
  const contactName = trim(body["contactName"], MAX_TEXT.contactName);
  const email = trim(body["email"], MAX_TEXT.email).toLowerCase();
  const phone = trim(body["phone"], MAX_TEXT.phone);
  const city = trim(body["city"], MAX_TEXT.city);
  const state = trim(body["state"], MAX_TEXT.state);
  const serviceArea = trim(body["serviceArea"], MAX_TEXT.serviceArea);
  const companyServiceType = trim(body["companyServiceType"], MAX_TEXT.companyServiceType);
  const servicesOffered = trim(body["servicesOffered"], MAX_TEXT.servicesOffered);
  const interested = body["interestedPartnerType"];
  if (!companyName || !contactName || !email || !phone || !city || !state || !serviceArea) {
    return { ok: false, error: "Company, contact, email, phone, city, state, and service area are required." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (!companyServiceType || !servicesOffered) {
    return { ok: false, error: "Tell us what kind of company you are and which services you offer." };
  }
  if (!isPartnerType(interested)) {
    return { ok: false, error: "Select a partner type." };
  }
  const mpaAccountEmail = optionalTrim(body["mpaAccountEmail"], MAX_TEXT.mpaAccountEmail);
  if (mpaAccountEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mpaAccountEmail)) {
    return { ok: false, error: "Current M.P.A. account email is not valid." };
  }
  return {
    ok: true,
    data: {
      companyName,
      contactName,
      email,
      phone,
      website: optionalTrim(body["website"], MAX_TEXT.website),
      city,
      state,
      serviceArea,
      companyServiceType,
      servicesOffered,
      customersServed: optionalTrim(body["customersServed"], MAX_TEXT.customersServed),
      mpaAccountEmail,
      interestedPartnerType: interested,
      notes: optionalTrim(body["notes"], MAX_TEXT.notes)
    }
  };
}

export const PARTNER_ANALYTICS_EVENTS = {
  page_viewed: "partner.page_viewed",
  application_started: "partner.application_started",
  application_submitted: "partner.application_submitted",
  referral_link_visited: "partner.referral_link_visited",
  referred_signup_initiated: "partner.referred_signup_initiated",
  referred_organization_converted: "partner.referred_organization_converted"
} as const;
