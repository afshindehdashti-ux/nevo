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
      project_inquiries: {
        Row: {
          application: string | null
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
