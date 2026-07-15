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
          role: "property_manager" | "property_owner" | "tenant" | "vendor";
        };
        Insert: {
          capability_key: string;
          created_at?: string;
          created_by: string;
          effect: "allow" | "deny";
          id?: string;
          organization_id: string;
          role: "property_manager" | "property_owner" | "tenant" | "vendor";
        };
        Update: {
          capability_key?: string;
          created_at?: string;
          created_by?: string;
          effect?: "allow" | "deny";
          id?: string;
          organization_id?: string;
          role?: "property_manager" | "property_owner" | "tenant" | "vendor";
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
      maintenance_activity_events: {
        Row: {
          actor_user_id: string | null;
          created_at: string;
          details: Json;
          event_type: string;
          id: string;
          organization_id: string;
          summary: string;
          work_order_id: string;
        };
        Insert: {
          actor_user_id?: string | null;
          created_at?: string;
          details?: Json;
          event_type: string;
          id?: string;
          organization_id: string;
          summary: string;
          work_order_id: string;
        };
        Update: {
          actor_user_id?: string | null;
          created_at?: string;
          details?: Json;
          event_type?: string;
          id?: string;
          organization_id?: string;
          summary?: string;
          work_order_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "maintenance_activity_events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "maintenance_activity_work_order_fk";
            columns: ["work_order_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "maintenance_work_orders";
            referencedColumns: ["id", "organization_id"];
          }
        ];
      };
      maintenance_work_orders: {
        Row: {
          archived_at: string | null;
          archived_by: string | null;
          assigned_to_user_id: string | null;
          category: string;
          completed_at: string | null;
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          document_placeholder: string | null;
          due_date: string | null;
          current_vendor_assignment_id: string | null;
          id: string;
          internal_notes: string | null;
          metadata: Json;
          organization_id: string;
          photo_placeholder: string | null;
          preventive_maintenance_placeholder: string | null;
          priority: string;
          property_id: string;
          recurring_maintenance_placeholder: string | null;
          status: string;
          tenant_id: string | null;
          tenant_notes: string | null;
          title: string;
          unit_id: string | null;
          updated_at: string;
          updated_by: string | null;
          vendor_id: string | null;
          work_order_number: string;
        };
        Insert: {
          archived_at?: string | null;
          archived_by?: string | null;
          assigned_to_user_id?: string | null;
          category?: string;
          completed_at?: string | null;
          created_at?: string;
          created_by: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          document_placeholder?: string | null;
          due_date?: string | null;
          current_vendor_assignment_id?: string | null;
          id?: string;
          internal_notes?: string | null;
          metadata?: Json;
          organization_id: string;
          photo_placeholder?: string | null;
          preventive_maintenance_placeholder?: string | null;
          priority?: string;
          property_id: string;
          recurring_maintenance_placeholder?: string | null;
          status?: string;
          tenant_id?: string | null;
          tenant_notes?: string | null;
          title: string;
          unit_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          vendor_id?: string | null;
          work_order_number: string;
        };
        Update: {
          archived_at?: string | null;
          archived_by?: string | null;
          assigned_to_user_id?: string | null;
          category?: string;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          document_placeholder?: string | null;
          due_date?: string | null;
          current_vendor_assignment_id?: string | null;
          id?: string;
          internal_notes?: string | null;
          metadata?: Json;
          organization_id?: string;
          photo_placeholder?: string | null;
          preventive_maintenance_placeholder?: string | null;
          priority?: string;
          property_id?: string;
          recurring_maintenance_placeholder?: string | null;
          status?: string;
          tenant_id?: string | null;
          tenant_notes?: string | null;
          title?: string;
          unit_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          vendor_id?: string | null;
          work_order_number?: string;
        };
        Relationships: [
          {
            foreignKeyName: "maintenance_work_orders_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "maintenance_work_orders_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "maintenance_work_orders_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "maintenance_work_orders_unit_id_fkey";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id"];
          }
        ];
      };
      maintenance_vendor_assignments: {
        Row: {
          accepted_at: string | null;
          arrived_at: string | null;
          assigned_at: string;
          assignment_status: string;
          cancellation_reason: string | null;
          cancelled_at: string | null;
          completed_at: string | null;
          completion_notes: string | null;
          created_at: string;
          created_by: string;
          id: string;
          is_current: boolean;
          organization_id: string;
          updated_at: string;
          updated_by: string | null;
          vendor_id: string;
          work_order_id: string;
        };
        Insert: {
          accepted_at?: string | null;
          arrived_at?: string | null;
          assigned_at?: string;
          assignment_status?: string;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          completed_at?: string | null;
          completion_notes?: string | null;
          created_at?: string;
          created_by: string;
          id?: string;
          is_current?: boolean;
          organization_id: string;
          updated_at?: string;
          updated_by?: string | null;
          vendor_id: string;
          work_order_id: string;
        };
        Update: {
          accepted_at?: string | null;
          arrived_at?: string | null;
          assigned_at?: string;
          assignment_status?: string;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          completed_at?: string | null;
          completion_notes?: string | null;
          created_at?: string;
          created_by?: string;
          id?: string;
          is_current?: boolean;
          organization_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          vendor_id?: string;
          work_order_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "maintenance_vendor_assignments_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "maintenance_vendor_assignments_vendor_fk";
            columns: ["vendor_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "vendors";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "maintenance_vendor_assignments_work_order_fk";
            columns: ["work_order_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "maintenance_work_orders";
            referencedColumns: ["id", "organization_id"];
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
          metadata: Json;
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
        Insert: {
          address_line_1: string;
          address_line_2?: string | null;
          archived_at?: string | null;
          archived_by?: string | null;
          city: string;
          code?: string | null;
          country_code: string;
          cover_image_url?: string | null;
          created_at?: string;
          created_by: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          metadata?: Json;
          name: string;
          organization_id: string;
          owner_contact_email?: string | null;
          owner_contact_name?: string | null;
          owner_contact_phone?: string | null;
          ownership_entity_name?: string | null;
          postal_code: string;
          property_type: "apartment" | "commercial" | "condo" | "hoa" | "multi_family" | "residential" | "townhome";
          state_region: string;
          status?: "active" | "archived" | "draft" | "inactive";
          timezone?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          address_line_1?: string;
          address_line_2?: string | null;
          archived_at?: string | null;
          archived_by?: string | null;
          city?: string;
          code?: string | null;
          country_code?: string;
          cover_image_url?: string | null;
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          metadata?: Json;
          name?: string;
          organization_id?: string;
          owner_contact_email?: string | null;
          owner_contact_name?: string | null;
          owner_contact_phone?: string | null;
          ownership_entity_name?: string | null;
          postal_code?: string;
          property_type?: "apartment" | "commercial" | "condo" | "hoa" | "multi_family" | "residential" | "townhome";
          state_region?: string;
          status?: "active" | "archived" | "draft" | "inactive";
          timezone?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "properties_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
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
          role: "property_manager" | "property_owner" | "tenant" | "vendor";
        };
        Insert: {
          capability_key: string;
          created_at?: string;
          id?: string;
          role: "property_manager" | "property_owner" | "tenant" | "vendor";
        };
        Update: {
          capability_key?: string;
          created_at?: string;
          id?: string;
          role?: "property_manager" | "property_owner" | "tenant" | "vendor";
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
      tenants: {
        Row: {
          archived_at: string | null;
          archived_by: string | null;
          avatar_url: string | null;
          created_at: string;
          created_by: string;
          date_of_birth: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          documents_placeholder: string | null;
          email: string;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          first_name: string;
          id: string;
          last_name: string;
          metadata: Json;
          move_in_date: string | null;
          move_out_date: string | null;
          notes: string | null;
          organization_id: string;
          phone: string | null;
          property_id: string | null;
          preferred_name: string | null;
          status: "active" | "archived" | "inactive";
          unit_id: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          archived_at?: string | null;
          archived_by?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          created_by: string;
          date_of_birth?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          documents_placeholder?: string | null;
          email: string;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          first_name: string;
          id?: string;
          last_name: string;
          metadata?: Json;
          move_in_date?: string | null;
          move_out_date?: string | null;
          notes?: string | null;
          organization_id: string;
          phone?: string | null;
          property_id?: string | null;
          preferred_name?: string | null;
          status?: "active" | "archived" | "inactive";
          unit_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          archived_at?: string | null;
          archived_by?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          created_by?: string;
          date_of_birth?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          documents_placeholder?: string | null;
          email?: string;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          first_name?: string;
          id?: string;
          last_name?: string;
          metadata?: Json;
          move_in_date?: string | null;
          move_out_date?: string | null;
          notes?: string | null;
          organization_id?: string;
          phone?: string | null;
          property_id?: string | null;
          preferred_name?: string | null;
          status?: "active" | "archived" | "inactive";
          unit_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tenants_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tenants_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tenants_unit_id_fkey";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id"];
          }
        ];
      };
      vendor_contacts: {
        Row: {
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          deleted_by: string | null;
          email: string | null;
          id: string;
          is_primary: boolean;
          name: string;
          notes: string | null;
          organization_id: string;
          phone: string | null;
          role_title: string | null;
          updated_at: string;
          updated_by: string | null;
          vendor_id: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          email?: string | null;
          id?: string;
          is_primary?: boolean;
          name: string;
          notes?: string | null;
          organization_id: string;
          phone?: string | null;
          role_title?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          vendor_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          email?: string | null;
          id?: string;
          is_primary?: boolean;
          name?: string;
          notes?: string | null;
          organization_id?: string;
          phone?: string | null;
          role_title?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          vendor_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vendor_contacts_vendor_fk";
            columns: ["vendor_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "vendors";
            referencedColumns: ["id", "organization_id"];
          }
        ];
      };
      vendor_service_areas: {
        Row: {
          city: string | null;
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          deleted_by: string | null;
          id: string;
          label: string;
          notes: string | null;
          organization_id: string;
          postal_code: string | null;
          state_region: string | null;
          updated_at: string;
          updated_by: string | null;
          vendor_id: string;
        };
        Insert: {
          city?: string | null;
          created_at?: string;
          created_by: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          label: string;
          notes?: string | null;
          organization_id: string;
          postal_code?: string | null;
          state_region?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          vendor_id: string;
        };
        Update: {
          city?: string | null;
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          label?: string;
          notes?: string | null;
          organization_id?: string;
          postal_code?: string | null;
          state_region?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          vendor_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vendor_service_areas_vendor_fk";
            columns: ["vendor_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "vendors";
            referencedColumns: ["id", "organization_id"];
          }
        ];
      };
      vendors: {
        Row: {
          address_line_1: string | null;
          address_line_2: string | null;
          after_hours_availability: string | null;
          archived_at: string | null;
          archived_by: string | null;
          business_name: string;
          city: string | null;
          country_code: string;
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          deleted_by: string | null;
          email: string | null;
          emergency_availability: string | null;
          id: string;
          insurance_expiration: string | null;
          internal_notes: string | null;
          license_number: string | null;
          metadata: Json;
          organization_id: string;
          phone: string | null;
          postal_code: string | null;
          preferred_vendor: boolean;
          primary_contact_name: string | null;
          rating: number | null;
          services: string[];
          state_region: string | null;
          status: string;
          tax_id_placeholder: string | null;
          updated_at: string;
          updated_by: string | null;
          website: string | null;
        };
        Insert: {
          address_line_1?: string | null;
          address_line_2?: string | null;
          after_hours_availability?: string | null;
          archived_at?: string | null;
          archived_by?: string | null;
          business_name: string;
          city?: string | null;
          country_code?: string;
          created_at?: string;
          created_by: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          email?: string | null;
          emergency_availability?: string | null;
          id?: string;
          insurance_expiration?: string | null;
          internal_notes?: string | null;
          license_number?: string | null;
          metadata?: Json;
          organization_id: string;
          phone?: string | null;
          postal_code?: string | null;
          preferred_vendor?: boolean;
          primary_contact_name?: string | null;
          rating?: number | null;
          services?: string[];
          state_region?: string | null;
          status?: string;
          tax_id_placeholder?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          website?: string | null;
        };
        Update: {
          address_line_1?: string | null;
          address_line_2?: string | null;
          after_hours_availability?: string | null;
          archived_at?: string | null;
          archived_by?: string | null;
          business_name?: string;
          city?: string | null;
          country_code?: string;
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          email?: string | null;
          emergency_availability?: string | null;
          id?: string;
          insurance_expiration?: string | null;
          internal_notes?: string | null;
          license_number?: string | null;
          metadata?: Json;
          organization_id?: string;
          phone?: string | null;
          postal_code?: string | null;
          preferred_vendor?: boolean;
          primary_contact_name?: string | null;
          rating?: number | null;
          services?: string[];
          state_region?: string | null;
          status?: string;
          tax_id_placeholder?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "vendors_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      leases: {
        Row: {
          activated_at: string | null;
          archived_at: string | null;
          archived_by: string | null;
          co_tenant_placeholder: string | null;
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          deleted_by: string | null;
          end_date: string;
          expired_at: string | null;
          id: string;
          internal_notes: string | null;
          late_fee_placeholder: string | null;
          lease_number: string;
          lease_type: string;
          metadata: Json;
          move_in_date: string | null;
          move_out_date: string | null;
          notice_period_days: number | null;
          organization_id: string;
          primary_tenant_id: string;
          property_id: string;
          renewal_option: boolean;
          renewal_status: string;
          rent_amount: number;
          security_deposit: number;
          signed_at: string | null;
          start_date: string;
          status: string;
          terminated_at: string | null;
          unit_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          activated_at?: string | null;
          archived_at?: string | null;
          archived_by?: string | null;
          co_tenant_placeholder?: string | null;
          created_at?: string;
          created_by: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          end_date: string;
          expired_at?: string | null;
          id?: string;
          internal_notes?: string | null;
          late_fee_placeholder?: string | null;
          lease_number: string;
          lease_type?: string;
          metadata?: Json;
          move_in_date?: string | null;
          move_out_date?: string | null;
          notice_period_days?: number | null;
          organization_id: string;
          primary_tenant_id: string;
          property_id: string;
          renewal_option?: boolean;
          renewal_status?: string;
          rent_amount: number;
          security_deposit?: number;
          signed_at?: string | null;
          start_date: string;
          status?: string;
          terminated_at?: string | null;
          unit_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          activated_at?: string | null;
          archived_at?: string | null;
          archived_by?: string | null;
          co_tenant_placeholder?: string | null;
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          end_date?: string;
          expired_at?: string | null;
          id?: string;
          internal_notes?: string | null;
          late_fee_placeholder?: string | null;
          lease_number?: string;
          lease_type?: string;
          metadata?: Json;
          move_in_date?: string | null;
          move_out_date?: string | null;
          notice_period_days?: number | null;
          organization_id?: string;
          primary_tenant_id?: string;
          property_id?: string;
          renewal_option?: boolean;
          renewal_status?: string;
          rent_amount?: number;
          security_deposit?: number;
          signed_at?: string | null;
          start_date?: string;
          status?: string;
          terminated_at?: string | null;
          unit_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "leases_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leases_unit_id_fkey";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leases_primary_tenant_id_fkey";
            columns: ["primary_tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      lease_documents: {
        Row: {
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          deleted_by: string | null;
          document_type: string;
          file_url_placeholder: string | null;
          id: string;
          lease_id: string;
          metadata: Json;
          notes: string | null;
          ocr_ready: boolean;
          organization_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          document_type: string;
          file_url_placeholder?: string | null;
          id?: string;
          lease_id: string;
          metadata?: Json;
          notes?: string | null;
          ocr_ready?: boolean;
          organization_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          document_type?: string;
          file_url_placeholder?: string | null;
          id?: string;
          lease_id?: string;
          metadata?: Json;
          notes?: string | null;
          ocr_ready?: boolean;
          organization_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lease_documents_lease_id_fkey";
            columns: ["lease_id"];
            isOneToOne: false;
            referencedRelation: "leases";
            referencedColumns: ["id"];
          }
        ];
      };
      lease_events: {
        Row: {
          created_at: string;
          created_by: string;
          event_type: string;
          id: string;
          lease_id: string;
          organization_id: string;
          payload: Json;
          summary: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          event_type: string;
          id?: string;
          lease_id: string;
          organization_id: string;
          payload?: Json;
          summary: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          event_type?: string;
          id?: string;
          lease_id?: string;
          organization_id?: string;
          payload?: Json;
          summary?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lease_events_lease_id_fkey";
            columns: ["lease_id"];
            isOneToOne: false;
            referencedRelation: "leases";
            referencedColumns: ["id"];
          }
        ];
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
          metadata: Json;
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
        Insert: {
          archived_at?: string | null;
          archived_by?: string | null;
          bathrooms?: number | null;
          bedrooms?: number | null;
          created_at?: string;
          created_by: string;
          currency_code?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          deposit_amount?: number | null;
          floor?: string | null;
          id?: string;
          metadata?: Json;
          occupancy_status?: "notice" | "occupied" | "offline" | "vacant_not_ready" | "vacant_ready";
          organization_id: string;
          property_id: string;
          rent_amount?: number | null;
          square_feet?: number | null;
          status?: "active" | "archived" | "inactive";
          unit_label?: string | null;
          unit_number: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          archived_at?: string | null;
          archived_by?: string | null;
          bathrooms?: number | null;
          bedrooms?: number | null;
          created_at?: string;
          created_by?: string;
          currency_code?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          deposit_amount?: number | null;
          floor?: string | null;
          id?: string;
          metadata?: Json;
          occupancy_status?: "notice" | "occupied" | "offline" | "vacant_not_ready" | "vacant_ready";
          organization_id?: string;
          property_id?: string;
          rent_amount?: number | null;
          square_feet?: number | null;
          status?: "active" | "archived" | "inactive";
          unit_label?: string | null;
          unit_number?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "units_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "units_property_fk";
            columns: ["property_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id", "organization_id"];
          }
        ];
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
