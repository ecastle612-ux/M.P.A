/**
 * Phase 4 foundation generated type placeholder.
 * Run:
 *   supabase gen types typescript --local > supabase/types/database.generated.ts
 * after linking Supabase CLI.
 */
export type Database = {
  public: {
    Tables: {
      organization_permission_overrides: {
        Row: {
          capability_key: string;
          created_at: string;
          created_by: string;
          effect: "allow" | "deny";
          id: string;
          organization_id: string;
          role: "property_manager" | "property_owner" | "tenant" | "vendor";
        };
      };
      organization_invitations: {
        Row: {
          accepted_at: string | null;
          accepted_by: string | null;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string;
          organization_id: string;
          roles: string[];
          status: "accepted" | "expired" | "pending" | "revoked";
          token: string;
          updated_at: string;
        };
      };
      organization_memberships: {
        Row: {
          created_at: string;
          id: string;
          invited_by: string | null;
          organization_id: string;
          roles: string[];
          status: "active" | "inactive";
          updated_at: string;
          user_id: string;
        };
      };
      organizations: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
        };
      };
      properties: {
        Row: {
          address_line_1: string;
          address_line_2: string | null;
          archived_at: string | null;
          archived_by: string | null;
          city: string;
          code: string | null;
          country_code: string;
          cover_image_url: string | null;
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          id: string;
          latitude: number | null;
          longitude: number | null;
          metadata: unknown;
          name: string;
          organization_id: string;
          owner_contact_email: string | null;
          owner_contact_name: string | null;
          owner_contact_phone: string | null;
          ownership_entity_name: string | null;
          postal_code: string;
          property_type: "apartment" | "commercial" | "condo" | "hoa" | "multi_family" | "residential" | "townhome";
          state_region: string;
          status: "active" | "archived" | "draft" | "inactive";
          timezone: string | null;
          updated_at: string;
          updated_by: string | null;
        };
      };
      permission_capabilities: {
        Row: {
          created_at: string;
          description: string;
          key: string;
          namespace: string;
        };
      };
      role_permission_grants: {
        Row: {
          capability_key: string;
          created_at: string;
          id: string;
          role: "property_manager" | "property_owner" | "tenant" | "vendor";
        };
      };
      user_preferences: {
        Row: {
          created_at: string;
          notification_preferences: unknown;
          timezone: string;
          updated_at: string;
          user_id: string;
        };
      };
      user_profiles: {
        Row: {
          avatar_url: string | null;
          contact_email: string | null;
          created_at: string;
          display_name: string | null;
          phone: string | null;
          updated_at: string;
          user_id: string;
        };
      };
      units: {
        Row: {
          archived_at: string | null;
          archived_by: string | null;
          bathrooms: number | null;
          bedrooms: number | null;
          created_at: string;
          created_by: string;
          currency_code: string;
          deleted_at: string | null;
          deleted_by: string | null;
          deposit_amount: number | null;
          floor: string | null;
          id: string;
          metadata: unknown;
          occupancy_status: "notice" | "occupied" | "offline" | "vacant_not_ready" | "vacant_ready";
          organization_id: string;
          property_id: string;
          rent_amount: number | null;
          square_feet: number | null;
          status: "active" | "archived" | "inactive";
          unit_label: string | null;
          unit_number: string;
          updated_at: string;
          updated_by: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      has_org_capability: {
        Args: { target_org_id: string; required_capability: string };
        Returns: boolean;
      };
      is_org_manager: {
        Args: { target_org_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
