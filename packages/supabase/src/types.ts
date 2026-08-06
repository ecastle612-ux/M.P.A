/**
 * Phase 3 foundation database types.
 * Replace by running `supabase gen types typescript` once the project is linked.
 */
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

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
          role:
            | "organization_admin"
            | "property_manager"
            | "leasing_agent"
            | "maintenance_technician"
            | "property_owner"
            | "tenant"
            | "vendor";
        };
        Insert: {
          capability_key: string;
          created_at?: string;
          created_by: string;
          effect: "allow" | "deny";
          id?: string;
          organization_id: string;
          role:
            | "organization_admin"
            | "property_manager"
            | "leasing_agent"
            | "maintenance_technician"
            | "property_owner"
            | "tenant"
            | "vendor";
        };
        Update: {
          capability_key?: string;
          created_at?: string;
          created_by?: string;
          effect?: "allow" | "deny";
          id?: string;
          organization_id?: string;
          role?:
            | "organization_admin"
            | "property_manager"
            | "leasing_agent"
            | "maintenance_technician"
            | "property_owner"
            | "tenant"
            | "vendor";
        };
        Relationships: [
          {
            foreignKeyName: "organization_permission_overrides_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      organization_invitations: {
        Row: {
          accepted_at: string | null;
          accepted_by: string | null;
          created_at: string;
          email: string;
          email_error: string | null;
          email_provider_id: string | null;
          email_sent_at: string | null;
          email_status: "pending" | "sent" | "failed" | "skipped";
          expires_at: string;
          id: string;
          invited_by: string;
          organization_id: string;
          roles: string[];
          status: "accepted" | "expired" | "pending" | "revoked";
          token: string;
          updated_at: string;
        };
        Insert: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
          email: string;
          email_error?: string | null;
          email_provider_id?: string | null;
          email_sent_at?: string | null;
          email_status?: "pending" | "sent" | "failed" | "skipped";
          expires_at?: string;
          id?: string;
          invited_by: string;
          organization_id: string;
          roles?: string[];
          status?: "accepted" | "expired" | "pending" | "revoked";
          token?: string;
          updated_at?: string;
        };
        Update: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
          email?: string;
          email_error?: string | null;
          email_provider_id?: string | null;
          email_sent_at?: string | null;
          email_status?: "pending" | "sent" | "failed" | "skipped";
          expires_at?: string;
          id?: string;
          invited_by?: string;
          organization_id?: string;
          roles?: string[];
          status?: "accepted" | "expired" | "pending" | "revoked";
          token?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
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
        Insert: {
          created_at?: string;
          id?: string;
          invited_by?: string | null;
          organization_id: string;
          roles?: string[];
          status?: "active" | "inactive";
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          invited_by?: string | null;
          organization_id?: string;
          roles?: string[];
          status?: "active" | "inactive";
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_memberships_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
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
        Insert: {
          created_at?: string;
          created_by: string;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      permission_capabilities: {
        Row: {
          created_at: string;
          description: string;
          key: string;
          namespace: string;
        };
        Insert: {
          created_at?: string;
          description: string;
          key: string;
          namespace: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          key?: string;
          namespace?: string;
        };
        Relationships: [];
      };
      role_permission_grants: {
        Row: {
          capability_key: string;
          created_at: string;
          id: string;
          role:
            | "organization_admin"
            | "property_manager"
            | "leasing_agent"
            | "maintenance_technician"
            | "property_owner"
            | "tenant"
            | "vendor";
        };
        Insert: {
          capability_key: string;
          created_at?: string;
          id?: string;
          role:
            | "organization_admin"
            | "property_manager"
            | "leasing_agent"
            | "maintenance_technician"
            | "property_owner"
            | "tenant"
            | "vendor";
        };
        Update: {
          capability_key?: string;
          created_at?: string;
          id?: string;
          role?:
            | "organization_admin"
            | "property_manager"
            | "leasing_agent"
            | "maintenance_technician"
            | "property_owner"
            | "tenant"
            | "vendor";
        };
        Relationships: [
          {
            foreignKeyName: "role_permission_grants_capability_key_fkey";
            columns: ["capability_key"];
            isOneToOne: false;
            referencedRelation: "permission_capabilities";
            referencedColumns: ["key"];
          }
        ];
      };
      user_preferences: {
        Row: {
          created_at: string;
          notification_preferences: Json;
          timezone: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          notification_preferences?: Json;
          timezone?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          notification_preferences?: Json;
          timezone?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
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
        Insert: {
          avatar_url?: string | null;
          contact_email?: string | null;
          created_at?: string;
          display_name?: string | null;
          phone?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          avatar_url?: string | null;
          contact_email?: string | null;
          created_at?: string;
          display_name?: string | null;
          phone?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      product_skus: {
        Row: {
          code: "mpa_property_manager" | "mpa_facility_operations" | "mpa_complete_platform";
          created_at: string;
          description: string;
          label: string;
        };
        Insert: {
          code: "mpa_property_manager" | "mpa_facility_operations" | "mpa_complete_platform";
          created_at?: string;
          description: string;
          label: string;
        };
        Update: {
          code?: "mpa_property_manager" | "mpa_facility_operations" | "mpa_complete_platform";
          created_at?: string;
          description?: string;
          label?: string;
        };
        Relationships: [];
      };
      organization_subscriptions: {
        Row: {
          assigned_by: string | null;
          created_at: string;
          id: string;
          organization_id: string;
          sku_code: "mpa_property_manager" | "mpa_facility_operations" | "mpa_complete_platform";
          status: "active" | "trialing" | "past_due" | "canceled";
          updated_at: string;
        };
        Insert: {
          assigned_by?: string | null;
          created_at?: string;
          id?: string;
          organization_id: string;
          sku_code: "mpa_property_manager" | "mpa_facility_operations" | "mpa_complete_platform";
          status?: "active" | "trialing" | "past_due" | "canceled";
          updated_at?: string;
        };
        Update: {
          assigned_by?: string | null;
          created_at?: string;
          id?: string;
          organization_id?: string;
          sku_code?: "mpa_property_manager" | "mpa_facility_operations" | "mpa_complete_platform";
          status?: "active" | "trialing" | "past_due" | "canceled";
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_subscriptions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      organization_setup_state: {
        Row: {
          checklist: Json;
          completed_at: string | null;
          organization_id: string;
          product_confirmed: boolean;
          updated_at: string;
        };
        Insert: {
          checklist?: Json;
          completed_at?: string | null;
          organization_id: string;
          product_confirmed?: boolean;
          updated_at?: string;
        };
        Update: {
          checklist?: Json;
          completed_at?: string | null;
          organization_id?: string;
          product_confirmed?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_setup_state_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      platform_operators: {
        Row: {
          created_at: string;
          granted_by: string | null;
          status: "active" | "inactive";
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          granted_by?: string | null;
          status?: "active" | "inactive";
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          granted_by?: string | null;
          status?: "active" | "inactive";
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
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
      is_platform_operator: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
