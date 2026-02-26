export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          client_id: string
          company_name: string
          contract_end: string | null
          contract_start: string | null
          created_at: string | null
          ghl_url: string | null
          id: string
          industry: string
          market: string
          monthly_value: number
          plan_tier: string
          primary_contact: string
          status: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          company_name: string
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string | null
          ghl_url?: string | null
          id?: string
          industry: string
          market: string
          monthly_value?: number
          plan_tier: string
          primary_contact: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          company_name?: string
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string | null
          ghl_url?: string | null
          id?: string
          industry?: string
          market?: string
          monthly_value?: number
          plan_tier?: string
          primary_contact?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      deliverables: {
        Row: {
          assigned_to: string
          client_approved: boolean | null
          client_id: string | null
          created_at: string | null
          deliverable_id: string
          delivery_date: string | null
          description: string | null
          due_date: string
          file_link: string | null
          id: string
          market: string
          name: string
          priority: string
          service_type: string
          status: string
          updated_at: string | null
        }
        Insert: {
          assigned_to: string
          client_approved?: boolean | null
          client_id?: string | null
          created_at?: string | null
          deliverable_id: string
          delivery_date?: string | null
          description?: string | null
          due_date: string
          file_link?: string | null
          id?: string
          market: string
          name: string
          priority?: string
          service_type: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string
          client_approved?: boolean | null
          client_id?: string | null
          created_at?: string | null
          deliverable_id?: string
          delivery_date?: string | null
          description?: string | null
          due_date?: string
          file_link?: string | null
          id?: string
          market?: string
          name?: string
          priority?: string
          service_type?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string | null
          currency: string
          id: string
          invoice_file_link: string | null
          invoice_id: string
          market: string
          month: string
          payment_date: string | null
          services_billed: string
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          client_id?: string | null
          created_at?: string | null
          currency: string
          id?: string
          invoice_file_link?: string | null
          invoice_id: string
          market: string
          month: string
          payment_date?: string | null
          services_billed: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          invoice_file_link?: string | null
          invoice_id?: string
          market?: string
          month?: string
          payment_date?: string | null
          services_billed?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_access: {
        Row: {
          access_token: string
          client_id: string | null
          contact_email: string
          contact_name: string
          created_at: string | null
          id: string
          is_active: boolean
          last_accessed_at: string | null
          updated_at: string | null
        }
        Insert: {
          access_token: string
          client_id?: string | null
          contact_email: string
          contact_name: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          last_accessed_at?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string
          client_id?: string | null
          contact_email?: string
          contact_name?: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          last_accessed_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_access_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string
          category: string
          client_id: string | null
          created_at: string | null
          deliverable_id: string | null
          due_date: string
          id: string
          name: string
          notes: string | null
          status: string
          task_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_to: string
          category: string
          client_id?: string | null
          created_at?: string | null
          deliverable_id?: string | null
          due_date: string
          id?: string
          name: string
          notes?: string | null
          status?: string
          task_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string
          category?: string
          client_id?: string | null
          created_at?: string | null
          deliverable_id?: string | null
          due_date?: string
          id?: string
          name?: string
          notes?: string | null
          status?: string
          task_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables_with_client"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      deliverables_with_client: {
        Row: {
          assigned_to: string | null
          client_approved: boolean | null
          client_id: string | null
          client_name: string | null
          created_at: string | null
          deliverable_id: string | null
          delivery_date: string | null
          description: string | null
          due_date: string | null
          file_link: string | null
          id: string | null
          market: string | null
          name: string | null
          priority: string | null
          service_type: string | null
          status: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices_with_client: {
        Row: {
          amount: number | null
          client_id: string | null
          client_name: string | null
          created_at: string | null
          currency: string | null
          id: string | null
          invoice_file_link: string | null
          invoice_id: string | null
          market: string | null
          month: string | null
          payment_date: string | null
          services_billed: string | null
          status: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks_with_relations: {
        Row: {
          assigned_to: string | null
          category: string | null
          client_id: string | null
          client_name: string | null
          created_at: string | null
          deliverable_id: string | null
          deliverable_name: string | null
          due_date: string | null
          id: string | null
          name: string | null
          notes: string | null
          status: string | null
          task_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables_with_client"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      generate_client_id: { Args: { p_market: string }; Returns: string }
      generate_deliverable_id: { Args: never; Returns: string }
      generate_invoice_id: { Args: never; Returns: string }
      generate_task_id: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
