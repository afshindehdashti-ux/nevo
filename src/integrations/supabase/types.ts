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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          address: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_branch: string | null
          bank_iban: string | null
          bank_name: string | null
          bank_swift: string | null
          city: string | null
          country: string | null
          created_at: string
          default_terms: string | null
          email: string | null
          id: string
          is_active: boolean
          legal_name: string
          logo_url: string | null
          phone: string | null
          team_members: Json
          trade_license: string | null
          updated_at: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          bank_swift?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          default_terms?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          legal_name: string
          logo_url?: string | null
          phone?: string | null
          team_members?: Json
          trade_license?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          bank_swift?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          default_terms?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          legal_name?: string
          logo_url?: string | null
          phone?: string | null
          team_members?: Json
          trade_license?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          contact_person: string | null
          country: string | null
          created_at: string
          created_by: string | null
          currency: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          updated_at: string
          updated_by: string | null
          vat_number: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          updated_at?: string
          updated_by?: string | null
          vat_number?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          updated_at?: string
          updated_by?: string | null
          vat_number?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      document_settings: {
        Row: {
          commission_prefix: string
          created_at: string
          default_currency: string
          default_incoterms: string
          default_payment_terms: string
          default_vat_percent: number
          delivery_note_prefix: string
          footer_text: string | null
          id: string
          invoice_prefix: string
          packing_list_prefix: string
          proforma_prefix: string
          purchase_order_prefix: string
          quotation_prefix: string
          signature_name: string | null
          signature_title: string | null
          updated_at: string
        }
        Insert: {
          commission_prefix?: string
          created_at?: string
          default_currency?: string
          default_incoterms?: string
          default_payment_terms?: string
          default_vat_percent?: number
          delivery_note_prefix?: string
          footer_text?: string | null
          id?: string
          invoice_prefix?: string
          packing_list_prefix?: string
          proforma_prefix?: string
          purchase_order_prefix?: string
          quotation_prefix?: string
          signature_name?: string | null
          signature_title?: string | null
          updated_at?: string
        }
        Update: {
          commission_prefix?: string
          created_at?: string
          default_currency?: string
          default_incoterms?: string
          default_payment_terms?: string
          default_vat_percent?: number
          delivery_note_prefix?: string
          footer_text?: string | null
          id?: string
          invoice_prefix?: string
          packing_list_prefix?: string
          proforma_prefix?: string
          purchase_order_prefix?: string
          quotation_prefix?: string
          signature_name?: string | null
          signature_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      download_events: {
        Row: {
          category: string | null
          created_at: string
          document_id: string
          document_title: string | null
          duration_ms: number | null
          error_message: string | null
          filename: string | null
          id: number
          ip: string | null
          source_page: string | null
          status: string
          user_agent: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          document_id: string
          document_title?: string | null
          duration_ms?: number | null
          error_message?: string | null
          filename?: string | null
          id?: number
          ip?: string | null
          source_page?: string | null
          status?: string
          user_agent?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          document_id?: string
          document_title?: string | null
          duration_ms?: number | null
          error_message?: string | null
          filename?: string | null
          id?: number
          ip?: string | null
          source_page?: string | null
          status?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      header_logo_events: {
        Row: {
          client_ts: string | null
          correlation_id: string | null
          created_at: string
          device_width: number | null
          dpr: number | null
          event_type: string
          id: number
          ip: string | null
          natural_height: number | null
          natural_width: number | null
          next_src: string | null
          online: boolean | null
          release: string | null
          route: string | null
          sample_rate: number | null
          schema: string | null
          schema_version: number | null
          src: string | null
          stage: string | null
          ua: string | null
          url: string | null
          variant: string | null
        }
        Insert: {
          client_ts?: string | null
          correlation_id?: string | null
          created_at?: string
          device_width?: number | null
          dpr?: number | null
          event_type: string
          id?: number
          ip?: string | null
          natural_height?: number | null
          natural_width?: number | null
          next_src?: string | null
          online?: boolean | null
          release?: string | null
          route?: string | null
          sample_rate?: number | null
          schema?: string | null
          schema_version?: number | null
          src?: string | null
          stage?: string | null
          ua?: string | null
          url?: string | null
          variant?: string | null
        }
        Update: {
          client_ts?: string | null
          correlation_id?: string | null
          created_at?: string
          device_width?: number | null
          dpr?: number | null
          event_type?: string
          id?: number
          ip?: string | null
          natural_height?: number | null
          natural_width?: number | null
          next_src?: string | null
          online?: boolean | null
          release?: string | null
          route?: string | null
          sample_rate?: number | null
          schema?: string | null
          schema_version?: number | null
          src?: string | null
          stage?: string | null
          ua?: string | null
          url?: string | null
          variant?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          currency: string
          default_commission_pct: number
          description: string | null
          hs_code: string | null
          id: string
          is_active: boolean
          name: string
          sku: string | null
          supplier_id: string | null
          unit: string
          unit_price: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          default_commission_pct?: number
          description?: string | null
          hs_code?: string | null
          id?: string
          is_active?: boolean
          name: string
          sku?: string | null
          supplier_id?: string | null
          unit?: string
          unit_price?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          default_commission_pct?: number
          description?: string | null
          hs_code?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sku?: string | null
          supplier_id?: string | null
          unit?: string
          unit_price?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          job_title: string | null
          last_login_at: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_active?: boolean
          job_title?: string | null
          last_login_at?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          job_title?: string | null
          last_login_at?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_inquiries: {
        Row: {
          application: string | null
          approved_at: string | null
          approved_by: string | null
          calculator_state: Json | null
          company: string | null
          country: string | null
          created_at: string
          email: string
          id: string
          ip: string | null
          message: string | null
          name: string
          phone: string | null
          source_page: string | null
          status: string
          user_agent: string | null
        }
        Insert: {
          application?: string | null
          approved_at?: string | null
          approved_by?: string | null
          calculator_state?: Json | null
          company?: string | null
          country?: string | null
          created_at?: string
          email: string
          id?: string
          ip?: string | null
          message?: string | null
          name: string
          phone?: string | null
          source_page?: string | null
          status?: string
          user_agent?: string | null
        }
        Update: {
          application?: string | null
          approved_at?: string | null
          approved_by?: string | null
          calculator_state?: Json | null
          company?: string | null
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          ip?: string | null
          message?: string | null
          name?: string
          phone?: string | null
          source_page?: string | null
          status?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      solutions_inspection: {
        Row: {
          coverage_state: string | null
          google_canonical: string | null
          id: string
          indexing_state: string | null
          inspected_at: string
          last_error: string | null
          locale: string
          mobile_verdict: string | null
          path: string
          rich_detail: Json
          rich_verdict: string | null
          url: string
          verdict: string | null
        }
        Insert: {
          coverage_state?: string | null
          google_canonical?: string | null
          id?: string
          indexing_state?: string | null
          inspected_at?: string
          last_error?: string | null
          locale: string
          mobile_verdict?: string | null
          path: string
          rich_detail?: Json
          rich_verdict?: string | null
          url: string
          verdict?: string | null
        }
        Update: {
          coverage_state?: string | null
          google_canonical?: string | null
          id?: string
          indexing_state?: string | null
          inspected_at?: string
          last_error?: string | null
          locale?: string
          mobile_verdict?: string | null
          path?: string
          rich_detail?: Json
          rich_verdict?: string | null
          url?: string
          verdict?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          city: string | null
          contact_person: string | null
          country: string | null
          created_at: string
          created_by: string | null
          currency: string
          default_commission_pct: number
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          updated_at: string
          updated_by: string | null
          vat_number: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          default_commission_pct?: number
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          updated_at?: string
          updated_by?: string | null
          vat_number?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          default_commission_pct?: number
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          updated_at?: string
          updated_by?: string | null
          vat_number?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_approval: {
        Args: { _entity_id: string; _entity_type: string; _metadata?: Json }
        Returns: string
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "super_admin"
        | "management"
        | "sales"
        | "operations"
        | "finance"
        | "read_only"
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
    Enums: {
      app_role: [
        "admin",
        "moderator",
        "user",
        "super_admin",
        "management",
        "sales",
        "operations",
        "finance",
        "read_only",
      ],
    },
  },
} as const
