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
      facility_assets: {
        Row: {
          asset_code: string;
          asset_type: string;
          building_id: string | null;
          created_at: string;
          created_by: string;
          custom_type_label: string | null;
          deleted_at: string | null;
          expected_life_years: number | null;
          id: string;
          install_date: string | null;
          location_note: string | null;
          location_scope: string;
          manufacturer: string | null;
          metadata: Json;
          model: string | null;
          name: string;
          notes: string | null;
          organization_id: string;
          property_id: string;
          serial_number: string | null;
          status: string;
          unit_id: string | null;
          updated_at: string;
          updated_by: string | null;
          warranty_placeholder: string | null;
        };
        Insert: {
          asset_code: string;
          asset_type: string;
          building_id?: string | null;
          created_at?: string;
          created_by: string;
          custom_type_label?: string | null;
          deleted_at?: string | null;
          expected_life_years?: number | null;
          id?: string;
          install_date?: string | null;
          location_note?: string | null;
          location_scope?: string;
          manufacturer?: string | null;
          metadata?: Json;
          model?: string | null;
          name: string;
          notes?: string | null;
          organization_id: string;
          property_id: string;
          serial_number?: string | null;
          status?: string;
          unit_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          warranty_placeholder?: string | null;
        };
        Update: {
          asset_code?: string;
          asset_type?: string;
          building_id?: string | null;
          created_at?: string;
          created_by?: string;
          custom_type_label?: string | null;
          deleted_at?: string | null;
          expected_life_years?: number | null;
          id?: string;
          install_date?: string | null;
          location_note?: string | null;
          location_scope?: string;
          manufacturer?: string | null;
          metadata?: Json;
          model?: string | null;
          name?: string;
          notes?: string | null;
          organization_id?: string;
          property_id?: string;
          serial_number?: string | null;
          status?: string;
          unit_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          warranty_placeholder?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "facility_assets_property_fk";
            columns: ["property_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "facility_assets_unit_fk";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id"];
          }
        ];
      };
      facility_records: {
        Row: {
          asset_id: string | null;
          assigned_staff_user_id: string | null;
          building_id: string | null;
          completed_at: string;
          corrected_at: string | null;
          corrected_by: string | null;
          correction_of_id: string | null;
          correction_reason: string | null;
          created_at: string;
          created_by: string;
          document_ids: string[];
          id: string;
          invoice_placeholder: string | null;
          issue: string;
          legacy_vendor_id: string | null;
          lifecycle_status: string;
          metadata: Json;
          organization_id: string;
          photo_document_ids: string[];
          property_id: string;
          resolution: string;
          service_provider_display_name: string | null;
          service_provider_type: string;
          status: string;
          unit_id: string | null;
          updated_at: string;
          updated_by: string | null;
          warranty_placeholder: string | null;
          work_order_id: string;
        };
        Insert: {
          asset_id?: string | null;
          assigned_staff_user_id?: string | null;
          building_id?: string | null;
          completed_at: string;
          corrected_at?: string | null;
          corrected_by?: string | null;
          correction_of_id?: string | null;
          correction_reason?: string | null;
          created_at?: string;
          created_by: string;
          document_ids?: string[];
          id?: string;
          invoice_placeholder?: string | null;
          issue: string;
          legacy_vendor_id?: string | null;
          lifecycle_status?: string;
          metadata?: Json;
          organization_id: string;
          photo_document_ids?: string[];
          property_id: string;
          resolution?: string;
          service_provider_display_name?: string | null;
          service_provider_type?: string;
          status?: string;
          unit_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          warranty_placeholder?: string | null;
          work_order_id: string;
        };
        Update: {
          asset_id?: string | null;
          assigned_staff_user_id?: string | null;
          building_id?: string | null;
          completed_at?: string;
          corrected_at?: string | null;
          corrected_by?: string | null;
          correction_of_id?: string | null;
          correction_reason?: string | null;
          created_at?: string;
          created_by?: string;
          document_ids?: string[];
          id?: string;
          invoice_placeholder?: string | null;
          issue?: string;
          legacy_vendor_id?: string | null;
          lifecycle_status?: string;
          metadata?: Json;
          organization_id?: string;
          photo_document_ids?: string[];
          property_id?: string;
          resolution?: string;
          service_provider_display_name?: string | null;
          service_provider_type?: string;
          status?: string;
          unit_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          warranty_placeholder?: string | null;
          work_order_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "facility_records_asset_fk";
            columns: ["asset_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "facility_assets";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "facility_records_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "facility_records_property_fk";
            columns: ["property_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "facility_records_unit_fk";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "facility_records_work_order_fk";
            columns: ["work_order_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "maintenance_work_orders";
            referencedColumns: ["id", "organization_id"];
          }
        ];
      };
      facility_timeline_events: {
        Row: {
          actor_user_id: string | null;
          asset_id: string | null;
          building_id: string | null;
          created_at: string;
          document_ids: string[];
          event_type: string;
          facility_record_id: string | null;
          href: string | null;
          id: string;
          legacy_vendor_id: string | null;
          occurred_at: string;
          organization_id: string;
          payload: Json;
          performed_by_label: string | null;
          property_id: string;
          service_provider_display_name: string | null;
          source_entity_id: string;
          source_entity_type: string;
          summary: string;
          title: string;
          unit_id: string | null;
          work_order_id: string | null;
        };
        Insert: {
          actor_user_id?: string | null;
          asset_id?: string | null;
          building_id?: string | null;
          created_at?: string;
          document_ids?: string[];
          event_type: string;
          facility_record_id?: string | null;
          href?: string | null;
          id?: string;
          legacy_vendor_id?: string | null;
          occurred_at: string;
          organization_id: string;
          payload?: Json;
          performed_by_label?: string | null;
          property_id: string;
          service_provider_display_name?: string | null;
          source_entity_id: string;
          source_entity_type: string;
          summary: string;
          title: string;
          unit_id?: string | null;
          work_order_id?: string | null;
        };
        Update: {
          actor_user_id?: string | null;
          asset_id?: string | null;
          building_id?: string | null;
          created_at?: string;
          document_ids?: string[];
          event_type?: string;
          facility_record_id?: string | null;
          href?: string | null;
          id?: string;
          legacy_vendor_id?: string | null;
          occurred_at?: string;
          organization_id?: string;
          payload?: Json;
          performed_by_label?: string | null;
          property_id?: string;
          service_provider_display_name?: string | null;
          source_entity_id?: string;
          source_entity_type?: string;
          summary?: string;
          title?: string;
          unit_id?: string | null;
          work_order_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "facility_timeline_events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "facility_timeline_property_fk";
            columns: ["property_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "facility_timeline_facility_record_fk";
            columns: ["facility_record_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "facility_records";
            referencedColumns: ["id", "organization_id"];
          }
        ];
      };
      migration_activity: {
        Row: {
          created_at: string;
          created_by: string;
          event_type: string;
          id: string;
          job_id: string;
          organization_id: string;
          payload: Json;
          summary: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          event_type: string;
          id?: string;
          job_id: string;
          organization_id: string;
          payload?: Json;
          summary: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          event_type?: string;
          id?: string;
          job_id?: string;
          organization_id?: string;
          payload?: Json;
          summary?: string;
        };
        Relationships: [
          {
            foreignKeyName: "migration_activity_job_fk";
            columns: ["job_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "migration_jobs";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "migration_activity_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      migration_checkpoints: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          job_id: string;
          label: string;
          organization_id: string;
          snapshot: Json;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          id?: string;
          job_id: string;
          label: string;
          organization_id: string;
          snapshot?: Json;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          job_id?: string;
          label?: string;
          organization_id?: string;
          snapshot?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "migration_checkpoints_job_fk";
            columns: ["job_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "migration_jobs";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "migration_checkpoints_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      migration_import_files: {
        Row: {
          column_headers: Json;
          created_at: string;
          created_by: string;
          entity_type: string | null;
          file_type: string;
          id: string;
          job_id: string;
          metadata: Json;
          organization_id: string;
          original_filename: string;
          parse_status: string;
          row_count: number;
          storage_path: string | null;
        };
        Insert: {
          column_headers?: Json;
          created_at?: string;
          created_by: string;
          entity_type?: string | null;
          file_type: string;
          id?: string;
          job_id: string;
          metadata?: Json;
          organization_id: string;
          original_filename: string;
          parse_status?: string;
          row_count?: number;
          storage_path?: string | null;
        };
        Update: {
          column_headers?: Json;
          created_at?: string;
          created_by?: string;
          entity_type?: string | null;
          file_type?: string;
          id?: string;
          job_id?: string;
          metadata?: Json;
          organization_id?: string;
          original_filename?: string;
          parse_status?: string;
          row_count?: number;
          storage_path?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "migration_import_files_job_fk";
            columns: ["job_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "migration_jobs";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "migration_import_files_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      migration_jobs: {
        Row: {
          checkpoint_id: string | null;
          completed_at: string | null;
          completion_pct: number;
          created_at: string;
          created_by: string;
          current_step: string;
          deleted_at: string | null;
          deleted_by: string | null;
          id: string;
          job_number: string;
          metadata: Json;
          name: string;
          organization_id: string;
          progress_errors: number;
          progress_imported: number;
          progress_total: number;
          progress_warnings: number;
          rolled_back_at: string | null;
          source_software: string;
          started_at: string | null;
          status: string;
          summary: Json;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          checkpoint_id?: string | null;
          completed_at?: string | null;
          completion_pct?: number;
          created_at?: string;
          created_by: string;
          current_step?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          job_number: string;
          metadata?: Json;
          name: string;
          organization_id: string;
          progress_errors?: number;
          progress_imported?: number;
          progress_total?: number;
          progress_warnings?: number;
          rolled_back_at?: string | null;
          source_software?: string;
          started_at?: string | null;
          status?: string;
          summary?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          checkpoint_id?: string | null;
          completed_at?: string | null;
          completion_pct?: number;
          created_at?: string;
          created_by?: string;
          current_step?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          job_number?: string;
          metadata?: Json;
          name?: string;
          organization_id?: string;
          progress_errors?: number;
          progress_imported?: number;
          progress_total?: number;
          progress_warnings?: number;
          rolled_back_at?: string | null;
          source_software?: string;
          started_at?: string | null;
          status?: string;
          summary?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "migration_jobs_checkpoint_fk";
            columns: ["checkpoint_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "migration_checkpoints";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "migration_jobs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      migration_mapping_templates: {
        Row: {
          column_map: Json;
          created_at: string;
          entity_type: string;
          id: string;
          is_system: boolean;
          label: string;
          organization_id: string | null;
          source_software: string;
          updated_at: string;
        };
        Insert: {
          column_map?: Json;
          created_at?: string;
          entity_type: string;
          id?: string;
          is_system?: boolean;
          label: string;
          organization_id?: string | null;
          source_software: string;
          updated_at?: string;
        };
        Update: {
          column_map?: Json;
          created_at?: string;
          entity_type?: string;
          id?: string;
          is_system?: boolean;
          label?: string;
          organization_id?: string | null;
          source_software?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "migration_mapping_templates_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      migration_record_links: {
        Row: {
          created_at: string;
          entity_id: string;
          entity_type: string;
          id: string;
          import_file_id: string | null;
          job_id: string;
          organization_id: string;
          rolled_back_at: string | null;
          source_key: string | null;
          source_row_index: number | null;
        };
        Insert: {
          created_at?: string;
          entity_id: string;
          entity_type: string;
          id?: string;
          import_file_id?: string | null;
          job_id: string;
          organization_id: string;
          rolled_back_at?: string | null;
          source_key?: string | null;
          source_row_index?: number | null;
        };
        Update: {
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          import_file_id?: string | null;
          job_id?: string;
          organization_id?: string;
          rolled_back_at?: string | null;
          source_key?: string | null;
          source_row_index?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "migration_record_links_import_file_fk";
            columns: ["import_file_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "migration_import_files";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "migration_record_links_job_fk";
            columns: ["job_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "migration_jobs";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "migration_record_links_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      migration_review_items: {
        Row: {
          candidate_records: Json;
          created_at: string;
          description: string | null;
          id: string;
          item_type: string;
          job_id: string;
          organization_id: string;
          resolution: Json;
          resolved_at: string | null;
          resolved_by: string | null;
          source_row: Json;
          status: string;
          title: string;
        };
        Insert: {
          candidate_records?: Json;
          created_at?: string;
          description?: string | null;
          id?: string;
          item_type: string;
          job_id: string;
          organization_id: string;
          resolution?: Json;
          resolved_at?: string | null;
          resolved_by?: string | null;
          source_row?: Json;
          status?: string;
          title: string;
        };
        Update: {
          candidate_records?: Json;
          created_at?: string;
          description?: string | null;
          id?: string;
          item_type?: string;
          job_id?: string;
          organization_id?: string;
          resolution?: Json;
          resolved_at?: string | null;
          resolved_by?: string | null;
          source_row?: Json;
          status?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "migration_review_items_job_fk";
            columns: ["job_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "migration_jobs";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "migration_review_items_organization_id_fkey";
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
          avatar_media_asset_id: string | null;
          avatar_url: string | null;
          contact_email: string | null;
          created_at: string;
          display_name: string | null;
          phone: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          avatar_media_asset_id?: string | null;
          avatar_url?: string | null;
          contact_email?: string | null;
          created_at?: string;
          display_name?: string | null;
          phone?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          avatar_media_asset_id?: string | null;
          avatar_url?: string | null;
          contact_email?: string | null;
          created_at?: string;
          display_name?: string | null;
          phone?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_profiles_avatar_media_asset_id_fkey";
            columns: ["avatar_media_asset_id"];
            isOneToOne: false;
            referencedRelation: "media_assets";
            referencedColumns: ["id"];
          }
        ];
      };
      media_assets: {
        Row: {
          byte_size: number;
          content_hash: string | null;
          created_at: string;
          deleted_at: string | null;
          entity_id: string | null;
          entity_type: string | null;
          height: number | null;
          id: string;
          kind: string;
          metadata: Json;
          mime_type: string;
          organization_id: string | null;
          original_filename: string | null;
          owner_user_id: string;
          plane: "user" | "organization";
          replaced_asset_id: string | null;
          status: "pending_upload" | "processing" | "ready" | "failed" | "deleted";
          storage_bucket: string;
          storage_path: string;
          updated_at: string;
          version: number;
          width: number | null;
        };
        Insert: {
          byte_size?: number;
          content_hash?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          entity_id?: string | null;
          entity_type?: string | null;
          height?: number | null;
          id?: string;
          kind: string;
          metadata?: Json;
          mime_type: string;
          organization_id?: string | null;
          original_filename?: string | null;
          owner_user_id: string;
          plane: "user" | "organization";
          replaced_asset_id?: string | null;
          status?: "pending_upload" | "processing" | "ready" | "failed" | "deleted";
          storage_bucket?: string;
          storage_path: string;
          updated_at?: string;
          version?: number;
          width?: number | null;
        };
        Update: {
          byte_size?: number;
          content_hash?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          entity_id?: string | null;
          entity_type?: string | null;
          height?: number | null;
          id?: string;
          kind?: string;
          metadata?: Json;
          mime_type?: string;
          organization_id?: string | null;
          original_filename?: string | null;
          owner_user_id?: string;
          plane?: "user" | "organization";
          replaced_asset_id?: string | null;
          status?: "pending_upload" | "processing" | "ready" | "failed" | "deleted";
          storage_bucket?: string;
          storage_path?: string;
          updated_at?: string;
          version?: number;
          width?: number | null;
        };
        Relationships: [];
      };
      media_asset_variants: {
        Row: {
          byte_size: number;
          created_at: string;
          height: number | null;
          id: string;
          media_asset_id: string;
          mime_type: string;
          storage_path: string;
          variant: "thumb" | "small" | "medium" | "large" | "original";
          width: number | null;
        };
        Insert: {
          byte_size?: number;
          created_at?: string;
          height?: number | null;
          id?: string;
          media_asset_id: string;
          mime_type: string;
          storage_path: string;
          variant: "thumb" | "small" | "medium" | "large" | "original";
          width?: number | null;
        };
        Update: {
          byte_size?: number;
          created_at?: string;
          height?: number | null;
          id?: string;
          media_asset_id?: string;
          mime_type?: string;
          storage_path?: string;
          variant?: "thumb" | "small" | "medium" | "large" | "original";
          width?: number | null;
        };
        Relationships: [];
      };
      media_audit_events: {
        Row: {
          actor_user_id: string | null;
          created_at: string;
          details: Json;
          event_type: string;
          id: string;
          media_asset_id: string | null;
          organization_id: string | null;
        };
        Insert: {
          actor_user_id?: string | null;
          created_at?: string;
          details?: Json;
          event_type: string;
          id?: string;
          media_asset_id?: string | null;
          organization_id?: string | null;
        };
        Update: {
          actor_user_id?: string | null;
          created_at?: string;
          details?: Json;
          event_type?: string;
          id?: string;
          media_asset_id?: string | null;
          organization_id?: string | null;
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
          user_id: string | null;
          lifecycle_status:
            | "awaiting_move_in"
            | "awaiting_signature"
            | "active"
            | "notice_given"
            | "moving_out"
            | "former";
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
          user_id?: string | null;
          lifecycle_status?:
            | "awaiting_move_in"
            | "awaiting_signature"
            | "active"
            | "notice_given"
            | "moving_out"
            | "former";
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
          user_id?: string | null;
          phone?: string | null;
          property_id?: string | null;
          preferred_name?: string | null;
          status?: "active" | "archived" | "inactive";
          unit_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          lifecycle_status?:
            | "awaiting_move_in"
            | "awaiting_signature"
            | "active"
            | "notice_given"
            | "moving_out"
            | "former";
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
      resident_lifecycle_events: {
        Row: {
          id: string;
          organization_id: string;
          tenant_id: string;
          lease_id: string | null;
          event_type: string;
          summary: string;
          payload: Json;
          actor_user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          tenant_id: string;
          lease_id?: string | null;
          event_type: string;
          summary: string;
          payload?: Json;
          actor_user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          tenant_id?: string;
          lease_id?: string | null;
          event_type?: string;
          summary?: string;
          payload?: Json;
          actor_user_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "resident_lifecycle_events_tenant_fk";
            columns: ["tenant_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id", "organization_id"];
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
      applicants: {
        Row: {
          application_group_id: string;
          application_number: string;
          approved_at: string | null;
          archived_at: string | null;
          archived_by: string | null;
          assigned_pm_id: string | null;
          converted_at: string | null;
          created_at: string;
          created_by: string;
          date_of_birth: string | null;
          declined_at: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          email: string;
          first_name: string;
          id: string;
          internal_notes: string | null;
          is_primary: boolean;
          last_name: string;
          metadata: Json;
          organization_id: string;
          phone: string | null;
          planned_move_in_date: string | null;
          preferred_name: string | null;
          profile: Json;
          property_id: string | null;
          status: string;
          submitted_at: string | null;
          tenant_id: string | null;
          unit_id: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          application_group_id?: string;
          application_number: string;
          approved_at?: string | null;
          archived_at?: string | null;
          archived_by?: string | null;
          assigned_pm_id?: string | null;
          converted_at?: string | null;
          created_at?: string;
          created_by: string;
          date_of_birth?: string | null;
          declined_at?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          email: string;
          first_name: string;
          id?: string;
          internal_notes?: string | null;
          is_primary?: boolean;
          last_name: string;
          metadata?: Json;
          organization_id: string;
          phone?: string | null;
          planned_move_in_date?: string | null;
          preferred_name?: string | null;
          profile?: Json;
          property_id?: string | null;
          status?: string;
          submitted_at?: string | null;
          tenant_id?: string | null;
          unit_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          application_group_id?: string;
          application_number?: string;
          approved_at?: string | null;
          archived_at?: string | null;
          archived_by?: string | null;
          assigned_pm_id?: string | null;
          converted_at?: string | null;
          created_at?: string;
          created_by?: string;
          date_of_birth?: string | null;
          declined_at?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          email?: string;
          first_name?: string;
          id?: string;
          internal_notes?: string | null;
          is_primary?: boolean;
          last_name?: string;
          metadata?: Json;
          organization_id?: string;
          phone?: string | null;
          planned_move_in_date?: string | null;
          preferred_name?: string | null;
          profile?: Json;
          property_id?: string | null;
          status?: string;
          submitted_at?: string | null;
          tenant_id?: string | null;
          unit_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "applicants_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applicants_unit_id_fkey";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applicants_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applicants_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      applicant_events: {
        Row: {
          applicant_id: string;
          created_at: string;
          created_by: string;
          event_type: string;
          id: string;
          organization_id: string;
          payload: Json;
          summary: string;
        };
        Insert: {
          applicant_id: string;
          created_at?: string;
          created_by: string;
          event_type: string;
          id?: string;
          organization_id: string;
          payload?: Json;
          summary: string;
        };
        Update: {
          applicant_id?: string;
          created_at?: string;
          created_by?: string;
          event_type?: string;
          id?: string;
          organization_id?: string;
          payload?: Json;
          summary?: string;
        };
        Relationships: [];
      };
      applicant_notes: {
        Row: {
          applicant_id: string;
          body: string;
          created_at: string;
          created_by: string;
          id: string;
          organization_id: string;
        };
        Insert: {
          applicant_id: string;
          body: string;
          created_at?: string;
          created_by: string;
          id?: string;
          organization_id: string;
        };
        Update: {
          applicant_id?: string;
          body?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          organization_id?: string;
        };
        Relationships: [];
      };
      applicant_tasks: {
        Row: {
          applicant_id: string;
          assigned_to: string | null;
          completed_at: string | null;
          created_at: string;
          created_by: string;
          description: string | null;
          due_date: string | null;
          id: string;
          organization_id: string;
          status: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          applicant_id: string;
          assigned_to?: string | null;
          completed_at?: string | null;
          created_at?: string;
          created_by: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          organization_id: string;
          status?: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          applicant_id?: string;
          assigned_to?: string | null;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          organization_id?: string;
          status?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      vault_documents: {
        Row: {
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          deleted_by: string | null;
          document_type: string;
          entity_id: string;
          entity_type: string;
          file_url: string | null;
          id: string;
          metadata: Json;
          notes: string | null;
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
          entity_id: string;
          entity_type: string;
          file_url?: string | null;
          id?: string;
          metadata?: Json;
          notes?: string | null;
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
          entity_id?: string;
          entity_type?: string;
          file_url?: string | null;
          id?: string;
          metadata?: Json;
          notes?: string | null;
          organization_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      screening_cases: {
        Row: {
          applicant_id: string;
          case_number: string;
          created_at: string;
          created_by: string;
          external_reference: string | null;
          id: string;
          metadata: Json;
          organization_id: string;
          provider: string;
          result_summary: string | null;
          status: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          applicant_id: string;
          case_number: string;
          created_at?: string;
          created_by: string;
          external_reference?: string | null;
          id?: string;
          metadata?: Json;
          organization_id: string;
          provider?: string;
          result_summary?: string | null;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          applicant_id?: string;
          case_number?: string;
          created_at?: string;
          created_by?: string;
          external_reference?: string | null;
          id?: string;
          metadata?: Json;
          organization_id?: string;
          provider?: string;
          result_summary?: string | null;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      signature_requests: {
        Row: {
          applicant_id: string;
          created_at: string;
          created_by: string;
          external_reference: string | null;
          id: string;
          metadata: Json;
          organization_id: string;
          provider: string;
          request_number: string;
          request_type: string;
          signed_at: string | null;
          status: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          applicant_id: string;
          created_at?: string;
          created_by: string;
          external_reference?: string | null;
          id?: string;
          metadata?: Json;
          organization_id: string;
          provider?: string;
          request_number: string;
          request_type?: string;
          signed_at?: string | null;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          applicant_id?: string;
          created_at?: string;
          created_by?: string;
          external_reference?: string | null;
          id?: string;
          metadata?: Json;
          organization_id?: string;
          provider?: string;
          request_number?: string;
          request_type?: string;
          signed_at?: string | null;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "signature_requests_applicant_fk";
            columns: ["applicant_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "applicants";
            referencedColumns: ["id", "organization_id"];
          }
        ];
      };
      communication_messages: {
        Row: {
          body: string;
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          deleted_by: string | null;
          delivery_status: "delivered" | "read" | "sent";
          id: string;
          metadata: Json;
          organization_id: string;
          sender_id: string;
          thread_id: string;
          updated_at: string;
          updated_by: string | null;
          visibility: "internal" | "resident" | "vendor";
        };
        Insert: {
          body: string;
          created_at?: string;
          created_by: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          delivery_status?: "delivered" | "read" | "sent";
          id?: string;
          metadata?: Json;
          organization_id: string;
          sender_id: string;
          thread_id: string;
          updated_at?: string;
          updated_by?: string | null;
          visibility?: "internal" | "resident" | "vendor";
        };
        Update: {
          body?: string;
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          delivery_status?: "delivered" | "read" | "sent";
          id?: string;
          metadata?: Json;
          organization_id?: string;
          sender_id?: string;
          thread_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          visibility?: "internal" | "resident" | "vendor";
        };
        Relationships: [];
      };
      community_events: {
        Row: {
          archived_at: string | null;
          archived_by: string | null;
          body: string;
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          deleted_by: string | null;
          ends_at: string | null;
          event_type: "emergency" | "event" | "holiday" | "office_hours" | "package" | "pool";
          id: string;
          metadata: Json;
          organization_id: string;
          property_id: string | null;
          starts_at: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          archived_at?: string | null;
          archived_by?: string | null;
          body?: string;
          created_at?: string;
          created_by: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          ends_at?: string | null;
          event_type?: "emergency" | "event" | "holiday" | "office_hours" | "package" | "pool";
          id?: string;
          metadata?: Json;
          organization_id: string;
          property_id?: string | null;
          starts_at: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          archived_at?: string | null;
          archived_by?: string | null;
          body?: string;
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          ends_at?: string | null;
          event_type?: "emergency" | "event" | "holiday" | "office_hours" | "package" | "pool";
          id?: string;
          metadata?: Json;
          organization_id?: string;
          property_id?: string | null;
          starts_at?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      conversation_participants: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          last_read_at: string | null;
          metadata: Json;
          muted: boolean;
          organization_id: string;
          participant_role: "applicant" | "owner" | "pm" | "resident" | "staff" | "vendor";
          pinned: boolean;
          thread_id: string;
          updated_at: string;
          updated_by: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          id?: string;
          last_read_at?: string | null;
          metadata?: Json;
          muted?: boolean;
          organization_id: string;
          participant_role: "applicant" | "owner" | "pm" | "resident" | "staff" | "vendor";
          pinned?: boolean;
          thread_id: string;
          updated_at?: string;
          updated_by?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          last_read_at?: string | null;
          metadata?: Json;
          muted?: boolean;
          organization_id?: string;
          participant_role?: "applicant" | "owner" | "pm" | "resident" | "staff" | "vendor";
          pinned?: boolean;
          thread_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      conversation_threads: {
        Row: {
          archived_at: string | null;
          archived_by: string | null;
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          deleted_by: string | null;
          id: string;
          last_message_at: string | null;
          metadata: Json;
          organization_id: string;
          property_id: string | null;
          source_entity_id: string | null;
          source_entity_type:
            | "announcement_reply"
            | "applicant"
            | "financial"
            | "general"
            | "inspection"
            | "lease"
            | "maintenance"
            | "resident"
            | "vendor_assignment";
          status: "active" | "archived" | "read" | "resolved" | "unread";
          subject: string;
          thread_type:
            | "applicant_leasing"
            | "internal_staff"
            | "pm_owner"
            | "pm_vendor"
            | "resident_maintenance"
            | "resident_pm";
          unit_id: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          archived_at?: string | null;
          archived_by?: string | null;
          created_at?: string;
          created_by: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          last_message_at?: string | null;
          metadata?: Json;
          organization_id: string;
          property_id?: string | null;
          source_entity_id?: string | null;
          source_entity_type:
            | "announcement_reply"
            | "applicant"
            | "financial"
            | "general"
            | "inspection"
            | "lease"
            | "maintenance"
            | "resident"
            | "vendor_assignment";
          status?: "active" | "archived" | "read" | "resolved" | "unread";
          subject: string;
          thread_type:
            | "applicant_leasing"
            | "internal_staff"
            | "pm_owner"
            | "pm_vendor"
            | "resident_maintenance"
            | "resident_pm";
          unit_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          archived_at?: string | null;
          archived_by?: string | null;
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          last_message_at?: string | null;
          metadata?: Json;
          organization_id?: string;
          property_id?: string | null;
          source_entity_id?: string | null;
          source_entity_type?:
            | "announcement_reply"
            | "applicant"
            | "financial"
            | "general"
            | "inspection"
            | "lease"
            | "maintenance"
            | "resident"
            | "vendor_assignment";
          status?: "active" | "archived" | "read" | "resolved" | "unread";
          subject?: string;
          thread_type?:
            | "applicant_leasing"
            | "internal_staff"
            | "pm_owner"
            | "pm_vendor"
            | "resident_maintenance"
            | "resident_pm";
          unit_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      in_app_notifications: {
        Row: {
          body: string;
          category: "ai" | "announcement" | "applicant" | "financial" | "lease" | "maintenance" | "message";
          created_at: string;
          created_by: string | null;
          href: string | null;
          id: string;
          metadata: Json;
          organization_id: string;
          read_at: string | null;
          source_entity_id: string | null;
          source_entity_type: string | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          body: string;
          category: "ai" | "announcement" | "applicant" | "financial" | "lease" | "maintenance" | "message";
          created_at?: string;
          created_by?: string | null;
          href?: string | null;
          id?: string;
          metadata?: Json;
          organization_id: string;
          read_at?: string | null;
          source_entity_id?: string | null;
          source_entity_type?: string | null;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          body?: string;
          category?: "ai" | "announcement" | "applicant" | "financial" | "lease" | "maintenance" | "message";
          created_at?: string;
          created_by?: string | null;
          href?: string | null;
          id?: string;
          metadata?: Json;
          organization_id?: string;
          read_at?: string | null;
          source_entity_id?: string | null;
          source_entity_type?: string | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      message_read_receipts: {
        Row: {
          created_at: string;
          id: string;
          message_id: string;
          organization_id: string;
          read_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message_id: string;
          organization_id: string;
          read_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          message_id?: string;
          organization_id?: string;
          read_at?: string;
          user_id?: string;
        };
        Relationships: [];
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
