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
      ai_assistant_conversations: {
        Row: {
          created_at: string
          id: string
          inquiry_id: string | null
          last_message_at: string
          lead_captured: boolean
          message_count: number
          metadata: Json
          session_id: string
          user_id: string | null
          visitor_country: string | null
          visitor_ip: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          inquiry_id?: string | null
          last_message_at?: string
          lead_captured?: boolean
          message_count?: number
          metadata?: Json
          session_id: string
          user_id?: string | null
          visitor_country?: string | null
          visitor_ip?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          inquiry_id?: string | null
          last_message_at?: string
          lead_captured?: boolean
          message_count?: number
          metadata?: Json
          session_id?: string
          user_id?: string | null
          visitor_country?: string | null
          visitor_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_assistant_conversations_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "project_inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_requests: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_notes: string | null
          details: Json
          entity_id: string
          entity_type: string
          id: string
          reason: string | null
          requested_at: string
          requested_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          details?: Json
          entity_id: string
          entity_type: string
          id?: string
          reason?: string | null
          requested_at?: string
          requested_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          details?: Json
          entity_id?: string
          entity_type?: string
          id?: string
          reason?: string | null
          requested_at?: string
          requested_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      communication_reads: {
        Row: {
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "communications"
            referencedColumns: ["id"]
          },
        ]
      }
      communications: {
        Row: {
          attachments: Json
          body: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string
          created_by: string | null
          direction: Database["public"]["Enums"]["communication_direction"]
          entity_id: string
          entity_type: string
          follow_up_at: string | null
          follow_up_done: boolean
          id: string
          kind: Database["public"]["Enums"]["communication_kind"]
          metadata: Json
          occurred_at: string
          parent_id: string | null
          subject: string | null
          thread_id: string | null
          updated_at: string
          updated_by: string | null
          user_id: string | null
        }
        Insert: {
          attachments?: Json
          body?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          direction?: Database["public"]["Enums"]["communication_direction"]
          entity_id: string
          entity_type: string
          follow_up_at?: string | null
          follow_up_done?: boolean
          id?: string
          kind?: Database["public"]["Enums"]["communication_kind"]
          metadata?: Json
          occurred_at?: string
          parent_id?: string | null
          subject?: string | null
          thread_id?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Update: {
          attachments?: Json
          body?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          direction?: Database["public"]["Enums"]["communication_direction"]
          entity_id?: string
          entity_type?: string
          follow_up_at?: string | null
          follow_up_done?: boolean
          id?: string
          kind?: Database["public"]["Enums"]["communication_kind"]
          metadata?: Json
          occurred_at?: string
          parent_id?: string | null
          subject?: string | null
          thread_id?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communications_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "communications"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          address: string | null
          approval_commission_threshold: number
          approval_discount_pct_threshold: number
          approval_invoice_threshold: number
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
          approval_commission_threshold?: number
          approval_discount_pct_threshold?: number
          approval_invoice_threshold?: number
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
          approval_commission_threshold?: number
          approval_discount_pct_threshold?: number
          approval_invoice_threshold?: number
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
      contacts: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string | null
          email: string | null
          full_name: string
          id: string
          is_primary: boolean
          notes: string | null
          partner_id: string | null
          phone: string | null
          supplier_id: string | null
          title: string | null
          updated_at: string
          updated_by: string | null
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_primary?: boolean
          notes?: string | null
          partner_id?: string | null
          phone?: string | null
          supplier_id?: string | null
          title?: string | null
          updated_at?: string
          updated_by?: string | null
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_primary?: boolean
          notes?: string | null
          partner_id?: string | null
          phone?: string | null
          supplier_id?: string | null
          title?: string | null
          updated_at?: string
          updated_by?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_users: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_users_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          ai_summary: string | null
          ai_summary_at: string | null
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
          partner_id: string | null
          payment_terms: string | null
          phone: string | null
          updated_at: string
          updated_by: string | null
          vat_number: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          ai_summary?: string | null
          ai_summary_at?: string | null
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
          partner_id?: string | null
          payment_terms?: string | null
          phone?: string | null
          updated_at?: string
          updated_by?: string | null
          vat_number?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          ai_summary?: string | null
          ai_summary_at?: string | null
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
          partner_id?: string | null
          payment_terms?: string | null
          phone?: string | null
          updated_at?: string
          updated_by?: string | null
          vat_number?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      doc_intel_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          document_id: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          document_id: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          document_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doc_intel_audit_logs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "doc_intel_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      doc_intel_documents: {
        Row: {
          ai_confidence: number | null
          ai_reasoning: string | null
          approved_at: string | null
          approved_by: string | null
          category: string | null
          confidentiality_level: string | null
          created_at: string
          customer_id: string | null
          destination: string | null
          detected_company: string | null
          detected_country: string | null
          detected_products: Json | null
          detected_standards: Json | null
          document_type: string | null
          file_size: number | null
          file_url: string | null
          folder_path: string | null
          id: string
          intended_destination: string | null
          language: string | null
          mime_type: string | null
          original_filename: string
          partner_id: string | null
          portal_visibility: string | null
          project_id: string | null
          routed_bucket: string | null
          routed_path: string | null
          status: string
          storage_bucket: string
          storage_path: string
          stored_filename: string | null
          summary: string | null
          title: string | null
          updated_at: string
          uploaded_by: string | null
          user_note: string | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_reasoning?: string | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          confidentiality_level?: string | null
          created_at?: string
          customer_id?: string | null
          destination?: string | null
          detected_company?: string | null
          detected_country?: string | null
          detected_products?: Json | null
          detected_standards?: Json | null
          document_type?: string | null
          file_size?: number | null
          file_url?: string | null
          folder_path?: string | null
          id?: string
          intended_destination?: string | null
          language?: string | null
          mime_type?: string | null
          original_filename: string
          partner_id?: string | null
          portal_visibility?: string | null
          project_id?: string | null
          routed_bucket?: string | null
          routed_path?: string | null
          status?: string
          storage_bucket?: string
          storage_path: string
          stored_filename?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string
          uploaded_by?: string | null
          user_note?: string | null
        }
        Update: {
          ai_confidence?: number | null
          ai_reasoning?: string | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          confidentiality_level?: string | null
          created_at?: string
          customer_id?: string | null
          destination?: string | null
          detected_company?: string | null
          detected_country?: string | null
          detected_products?: Json | null
          detected_standards?: Json | null
          document_type?: string | null
          file_size?: number | null
          file_url?: string | null
          folder_path?: string | null
          id?: string
          intended_destination?: string | null
          language?: string | null
          mime_type?: string | null
          original_filename?: string
          partner_id?: string | null
          portal_visibility?: string | null
          project_id?: string | null
          routed_bucket?: string | null
          routed_path?: string | null
          status?: string
          storage_bucket?: string
          storage_path?: string
          stored_filename?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string
          uploaded_by?: string | null
          user_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doc_intel_documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doc_intel_documents_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doc_intel_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      doc_intel_extractions: {
        Row: {
          created_at: string
          document_id: string
          extracted_json: Json | null
          id: string
          model_name: string | null
          raw_text: string | null
        }
        Insert: {
          created_at?: string
          document_id: string
          extracted_json?: Json | null
          id?: string
          model_name?: string | null
          raw_text?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string
          extracted_json?: Json | null
          id?: string
          model_name?: string | null
          raw_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doc_intel_extractions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "doc_intel_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      doc_intel_routing_rules: {
        Row: {
          action_add_tags: string[]
          action_block_public: boolean
          action_min_confidence: number | null
          action_require_approval: boolean
          action_set_confidentiality: string | null
          action_set_destination: string | null
          action_set_folder_path: string | null
          action_set_visibility: string | null
          created_at: string
          created_by: string | null
          description: string | null
          enabled: boolean
          id: string
          match_categories: string[]
          match_confidentiality: string[]
          match_doc_type_ilike: string | null
          match_filename_ilike: string | null
          match_keywords: string[]
          match_visibility: string[]
          name: string
          priority: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          action_add_tags?: string[]
          action_block_public?: boolean
          action_min_confidence?: number | null
          action_require_approval?: boolean
          action_set_confidentiality?: string | null
          action_set_destination?: string | null
          action_set_folder_path?: string | null
          action_set_visibility?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          enabled?: boolean
          id?: string
          match_categories?: string[]
          match_confidentiality?: string[]
          match_doc_type_ilike?: string | null
          match_filename_ilike?: string | null
          match_keywords?: string[]
          match_visibility?: string[]
          name: string
          priority?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          action_add_tags?: string[]
          action_block_public?: boolean
          action_min_confidence?: number | null
          action_require_approval?: boolean
          action_set_confidentiality?: string | null
          action_set_destination?: string | null
          action_set_folder_path?: string | null
          action_set_visibility?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          enabled?: boolean
          id?: string
          match_categories?: string[]
          match_confidentiality?: string[]
          match_doc_type_ilike?: string | null
          match_filename_ilike?: string | null
          match_keywords?: string[]
          match_visibility?: string[]
          name?: string
          priority?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      doc_intel_tags: {
        Row: {
          created_at: string
          document_id: string
          id: string
          tag: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          tag: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "doc_intel_tags_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "doc_intel_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      doc_intel_versions: {
        Row: {
          change_note: string | null
          created_at: string
          created_by: string | null
          document_id: string
          file_url: string | null
          filename: string | null
          id: string
          storage_bucket: string | null
          storage_path: string | null
          version_number: number
        }
        Insert: {
          change_note?: string | null
          created_at?: string
          created_by?: string | null
          document_id: string
          file_url?: string | null
          filename?: string | null
          id?: string
          storage_bucket?: string | null
          storage_path?: string | null
          version_number: number
        }
        Update: {
          change_note?: string | null
          created_at?: string
          created_by?: string | null
          document_id?: string
          file_url?: string | null
          filename?: string | null
          id?: string
          storage_bucket?: string | null
          storage_path?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "doc_intel_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "doc_intel_documents"
            referencedColumns: ["id"]
          },
        ]
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
      documents: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["document_entity"]
          file_name: string
          file_path: string
          id: string
          kind: Database["public"]["Enums"]["document_kind"]
          mime_type: string | null
          size_bytes: number | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["document_entity"]
          file_name: string
          file_path: string
          id?: string
          kind?: Database["public"]["Enums"]["document_kind"]
          mime_type?: string | null
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["document_entity"]
          file_name?: string
          file_path?: string
          id?: string
          kind?: Database["public"]["Enums"]["document_kind"]
          mime_type?: string | null
          size_bytes?: number | null
          uploaded_by?: string | null
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
      import_job_rows: {
        Row: {
          created_at: string
          created_record_id: string | null
          error_message: string | null
          id: string
          import_job_id: string
          mapped_data: Json | null
          raw_data: Json
          row_number: number
          status: Database["public"]["Enums"]["import_row_status"]
        }
        Insert: {
          created_at?: string
          created_record_id?: string | null
          error_message?: string | null
          id?: string
          import_job_id: string
          mapped_data?: Json | null
          raw_data: Json
          row_number: number
          status?: Database["public"]["Enums"]["import_row_status"]
        }
        Update: {
          created_at?: string
          created_record_id?: string | null
          error_message?: string | null
          id?: string
          import_job_id?: string
          mapped_data?: Json | null
          raw_data?: Json
          row_number?: number
          status?: Database["public"]["Enums"]["import_row_status"]
        }
        Relationships: [
          {
            foreignKeyName: "import_job_rows_import_job_id_fkey"
            columns: ["import_job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          error_summary: string | null
          failed_rows: number
          file_name: string
          file_path: string | null
          id: string
          import_type: string
          mapping: Json
          mode: string
          skipped_rows: number
          started_at: string | null
          status: Database["public"]["Enums"]["import_job_status"]
          success_rows: number
          total_rows: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          error_summary?: string | null
          failed_rows?: number
          file_name: string
          file_path?: string | null
          id?: string
          import_type: string
          mapping?: Json
          mode?: string
          skipped_rows?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["import_job_status"]
          success_rows?: number
          total_rows?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          error_summary?: string | null
          failed_rows?: number
          file_name?: string
          file_path?: string | null
          id?: string
          import_type?: string
          mapping?: Json
          mode?: string
          skipped_rows?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["import_job_status"]
          success_rows?: number
          total_rows?: number
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          discount_pct: number
          id: string
          invoice_id: string
          line_total: number
          position: number
          product_id: string | null
          quantity: number
          unit: string
          unit_price: number
          updated_at: string
          vat_pct: number
        }
        Insert: {
          created_at?: string
          description: string
          discount_pct?: number
          id?: string
          invoice_id: string
          line_total?: number
          position?: number
          product_id?: string | null
          quantity?: number
          unit?: string
          unit_price?: number
          updated_at?: string
          vat_pct?: number
        }
        Update: {
          created_at?: string
          description?: string
          discount_pct?: number
          id?: string
          invoice_id?: string
          line_total?: number
          position?: number
          product_id?: string | null
          quantity?: number
          unit?: string
          unit_price?: number
          updated_at?: string
          vat_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          balance: number
          created_at: string
          created_by: string | null
          currency: string
          customer_id: string
          due_date: string | null
          id: string
          invoice_number: string | null
          issue_date: string
          notes: string | null
          order_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          total: number
          type: Database["public"]["Enums"]["invoice_type"]
          updated_at: string
          updated_by: string | null
          vat_amount: number
        }
        Insert: {
          amount_paid?: number
          balance?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string
          notes?: string | null
          order_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total?: number
          type?: Database["public"]["Enums"]["invoice_type"]
          updated_at?: string
          updated_by?: string | null
          vat_amount?: number
        }
        Update: {
          amount_paid?: number
          balance?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string
          notes?: string | null
          order_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total?: number
          type?: Database["public"]["Enums"]["invoice_type"]
          updated_at?: string
          updated_by?: string | null
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company: string | null
          country: string | null
          created_at: string
          created_by: string | null
          currency: string
          customer_id: string | null
          email: string | null
          estimated_value: number | null
          id: string
          industry: string | null
          lost_reason: string | null
          name: string
          next_follow_up: string | null
          notes: string | null
          owner_id: string | null
          partner_id: string | null
          phone: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          updated_by: string | null
          whatsapp: string | null
          won_at: string | null
        }
        Insert: {
          company?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          email?: string | null
          estimated_value?: number | null
          id?: string
          industry?: string | null
          lost_reason?: string | null
          name: string
          next_follow_up?: string | null
          notes?: string | null
          owner_id?: string | null
          partner_id?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          updated_by?: string | null
          whatsapp?: string | null
          won_at?: string | null
        }
        Update: {
          company?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          email?: string | null
          estimated_value?: number | null
          id?: string
          industry?: string | null
          lost_reason?: string | null
          name?: string
          next_follow_up?: string | null
          notes?: string | null
          owner_id?: string | null
          partner_id?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          updated_by?: string | null
          whatsapp?: string | null
          won_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      mailbox_connections: {
        Row: {
          created_at: string
          created_by: string | null
          gmail_email: string | null
          id: string
          imap_host: string | null
          imap_password: string | null
          imap_port: number | null
          imap_tls: boolean
          imap_username: string | null
          is_active: boolean
          last_test_at: string | null
          last_test_error: string | null
          last_test_ok: boolean | null
          notes: string | null
          provider: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          gmail_email?: string | null
          id?: string
          imap_host?: string | null
          imap_password?: string | null
          imap_port?: number | null
          imap_tls?: boolean
          imap_username?: string | null
          is_active?: boolean
          last_test_at?: string | null
          last_test_error?: string | null
          last_test_ok?: boolean | null
          notes?: string | null
          provider: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          gmail_email?: string | null
          id?: string
          imap_host?: string | null
          imap_password?: string | null
          imap_port?: number | null
          imap_tls?: boolean
          imap_username?: string | null
          is_active?: boolean
          last_test_at?: string | null
          last_test_error?: string | null
          last_test_ok?: boolean | null
          notes?: string | null
          provider?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          actual_close_date: string | null
          amount: number | null
          created_at: string
          created_by: string | null
          currency: string
          customer_id: string | null
          expected_close_date: string | null
          id: string
          lead_id: string | null
          loss_reason: string | null
          name: string
          notes: string | null
          owner_id: string | null
          partner_id: string | null
          probability: number
          stage: Database["public"]["Enums"]["opportunity_stage"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          actual_close_date?: string | null
          amount?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          loss_reason?: string | null
          name: string
          notes?: string | null
          owner_id?: string | null
          partner_id?: string | null
          probability?: number
          stage?: Database["public"]["Enums"]["opportunity_stage"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          actual_close_date?: string | null
          amount?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          loss_reason?: string | null
          name?: string
          notes?: string | null
          owner_id?: string | null
          partner_id?: string | null
          probability?: number
          stage?: Database["public"]["Enums"]["opportunity_stage"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          description: string
          discount_pct: number
          id: string
          line_total: number
          order_id: string
          position: number
          product_id: string | null
          quantity: number
          unit: string
          unit_price: number
          updated_at: string
          vat_pct: number
        }
        Insert: {
          created_at?: string
          description: string
          discount_pct?: number
          id?: string
          line_total?: number
          order_id: string
          position?: number
          product_id?: string | null
          quantity?: number
          unit?: string
          unit_price?: number
          updated_at?: string
          vat_pct?: number
        }
        Update: {
          created_at?: string
          description?: string
          discount_pct?: number
          id?: string
          line_total?: number
          order_id?: string
          position?: number
          product_id?: string | null
          quantity?: number
          unit?: string
          unit_price?: number
          updated_at?: string
          vat_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["order_status"] | null
          id: string
          note: string | null
          order_id: string
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: string
          note?: string | null
          order_id: string
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: string
          note?: string | null
          order_id?: string
          to_status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          customer_id: string
          id: string
          incoterm: string | null
          notes: string | null
          order_date: string
          order_number: string | null
          requested_delivery: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at: string
          updated_by: string | null
          vat_amount: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id: string
          id?: string
          incoterm?: string | null
          notes?: string | null
          order_date?: string
          order_number?: string | null
          requested_delivery?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          updated_by?: string | null
          vat_amount?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string
          id?: string
          incoterm?: string | null
          notes?: string | null
          order_date?: string
          order_number?: string | null
          requested_delivery?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          updated_by?: string | null
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_commissions: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          currency: string
          customer_id: string | null
          earned_at: string
          id: string
          invoice_id: string | null
          notes: string | null
          order_id: string | null
          paid_at: string | null
          partner_id: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          earned_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          order_id?: string | null
          paid_at?: string | null
          partner_id: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          earned_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          order_id?: string | null
          paid_at?: string | null
          partner_id?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_commissions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_commissions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_commissions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_users: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          partner_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          partner_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          partner_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_users_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          company_name: string
          contact_email: string | null
          country: string | null
          created_at: string
          id: string
          partner_type: string | null
          updated_at: string
        }
        Insert: {
          company_name: string
          contact_email?: string | null
          country?: string | null
          created_at?: string
          id?: string
          partner_type?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string
          contact_email?: string | null
          country?: string | null
          created_at?: string
          id?: string
          partner_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          currency: string
          id: string
          invoice_id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          received_at: string
          reference: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          invoice_id: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          received_at?: string
          reference?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          invoice_id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          received_at?: string
          reference?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
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
          must_change_password: boolean
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
          must_change_password?: boolean
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
          must_change_password?: boolean
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
          assigned_to: string | null
          budget_range: string | null
          calculator_state: Json | null
          company: string | null
          converted_customer_id: string | null
          converted_project_id: string | null
          country: string | null
          created_at: string
          email: string
          id: string
          internal_notes: string | null
          internal_score: number | null
          ip: string | null
          message: string | null
          name: string
          next_action_date: string | null
          partner_id: string | null
          phone: string | null
          priority: string
          project_type: string | null
          source_page: string | null
          status: string
          timeline: string | null
          updated_at: string
          updated_by: string | null
          user_agent: string | null
        }
        Insert: {
          application?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          budget_range?: string | null
          calculator_state?: Json | null
          company?: string | null
          converted_customer_id?: string | null
          converted_project_id?: string | null
          country?: string | null
          created_at?: string
          email: string
          id?: string
          internal_notes?: string | null
          internal_score?: number | null
          ip?: string | null
          message?: string | null
          name: string
          next_action_date?: string | null
          partner_id?: string | null
          phone?: string | null
          priority?: string
          project_type?: string | null
          source_page?: string | null
          status?: string
          timeline?: string | null
          updated_at?: string
          updated_by?: string | null
          user_agent?: string | null
        }
        Update: {
          application?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          budget_range?: string | null
          calculator_state?: Json | null
          company?: string | null
          converted_customer_id?: string | null
          converted_project_id?: string | null
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          internal_notes?: string | null
          internal_score?: number | null
          ip?: string | null
          message?: string | null
          name?: string
          next_action_date?: string | null
          partner_id?: string | null
          phone?: string | null
          priority?: string
          project_type?: string | null
          source_page?: string | null
          status?: string
          timeline?: string | null
          updated_at?: string
          updated_by?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_inquiries_converted_customer_id_fkey"
            columns: ["converted_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_inquiries_converted_project_id_fkey"
            columns: ["converted_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_inquiries_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          ai_summary: string | null
          ai_summary_at: string | null
          country: string | null
          created_at: string
          customer_id: string | null
          id: string
          project_name: string
          project_type: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          ai_summary_at?: string | null
          country?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          project_name: string
          project_type?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          ai_summary_at?: string | null
          country?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          project_name?: string
          project_type?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_items: {
        Row: {
          created_at: string
          description: string
          discount_pct: number
          id: string
          line_total: number
          position: number
          product_id: string | null
          quantity: number
          quotation_id: string
          unit: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          discount_pct?: number
          id?: string
          line_total?: number
          position?: number
          product_id?: string | null
          quantity?: number
          quotation_id: string
          unit?: string | null
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          discount_pct?: number
          id?: string
          line_total?: number
          position?: number
          product_id?: string | null
          quantity?: number
          quotation_id?: string
          unit?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          accepted_at: string | null
          approved_at: string | null
          approved_by: string | null
          converted_invoice_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          customer_id: string | null
          id: string
          inquiry_id: string | null
          internal_notes: string | null
          issue_date: string
          notes: string | null
          project_id: string | null
          quotation_number: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["quotation_status"]
          subtotal: number
          terms: string | null
          total: number
          updated_at: string
          updated_by: string | null
          valid_until: string | null
          vat_amount: number
          vat_rate: number
        }
        Insert: {
          accepted_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          converted_invoice_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          id?: string
          inquiry_id?: string | null
          internal_notes?: string | null
          issue_date?: string
          notes?: string | null
          project_id?: string | null
          quotation_number?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["quotation_status"]
          subtotal?: number
          terms?: string | null
          total?: number
          updated_at?: string
          updated_by?: string | null
          valid_until?: string | null
          vat_amount?: number
          vat_rate?: number
        }
        Update: {
          accepted_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          converted_invoice_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          id?: string
          inquiry_id?: string | null
          internal_notes?: string | null
          issue_date?: string
          notes?: string | null
          project_id?: string | null
          quotation_number?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["quotation_status"]
          subtotal?: number
          terms?: string | null
          total?: number
          updated_at?: string
          updated_by?: string | null
          valid_until?: string | null
          vat_amount?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotations_converted_invoice_id_fkey"
            columns: ["converted_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "project_inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_items: {
        Row: {
          created_at: string
          description: string
          id: string
          order_item_id: string | null
          quantity: number
          shipment_id: string
          unit: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          order_item_id?: string | null
          quantity?: number
          shipment_id: string
          unit?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          order_item_id?: string | null
          quantity?: number
          shipment_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_items_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_items_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          bl_number: string | null
          carrier: string | null
          container_no: string | null
          created_at: string
          created_by: string | null
          delivered_at: string | null
          id: string
          incoterm: string | null
          notes: string | null
          order_id: string
          shipment_number: string | null
          shipped_at: string | null
          status: Database["public"]["Enums"]["shipment_status"]
          tracking_no: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          bl_number?: string | null
          carrier?: string | null
          container_no?: string | null
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          id?: string
          incoterm?: string | null
          notes?: string | null
          order_id: string
          shipment_number?: string | null
          shipped_at?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          tracking_no?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          bl_number?: string | null
          carrier?: string | null
          container_no?: string | null
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          id?: string
          incoterm?: string | null
          notes?: string | null
          order_id?: string
          shipment_number?: string | null
          shipped_at?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          tracking_no?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
      tasks: {
        Row: {
          approval_required: boolean
          approved_at: string | null
          approved_by: string | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          approval_required?: boolean
          approved_at?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          approval_required?: boolean
          approved_at?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
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
      decide_approval_request: {
        Args: { _decision: string; _id: string; _notes?: string }
        Returns: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_notes: string | null
          details: Json
          entity_id: string
          entity_type: string
          id: string
          reason: string | null
          requested_at: string
          requested_by: string | null
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "approval_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      ensure_approval_request: {
        Args: {
          _details: Json
          _entity_id: string
          _entity_type: string
          _reason: string
        }
        Returns: string
      }
      evaluate_quotation_discount_approval: {
        Args: { _quotation_id: string }
        Returns: undefined
      }
      get_approval_thresholds: {
        Args: never
        Returns: {
          commission: number
          discount_pct: number
          invoice: number
        }[]
      }
      has_admin_role: { Args: { required_role: string }; Returns: boolean }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_staff_role: { Args: { _user_id: string }; Returns: boolean }
      is_customer_user: {
        Args: { _customer_id: string; _user_id: string }
        Returns: boolean
      }
      is_partner_user: {
        Args: { _partner_id: string; _user_id: string }
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
      next_invoice_number: {
        Args: { _type: Database["public"]["Enums"]["invoice_type"] }
        Returns: string
      }
      next_quotation_number: { Args: never; Returns: string }
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
      communication_direction: "inbound" | "outbound" | "internal"
      communication_kind:
        | "note"
        | "email"
        | "call"
        | "meeting"
        | "whatsapp"
        | "file"
      document_entity: "order" | "invoice" | "shipment" | "customer"
      document_kind:
        | "proforma_pdf"
        | "commercial_pdf"
        | "packing_list"
        | "bill_of_lading"
        | "coa"
        | "contract"
        | "other"
      import_job_status:
        | "draft"
        | "validating"
        | "ready"
        | "running"
        | "completed"
        | "failed"
        | "cancelled"
      import_row_status: "pending" | "success" | "failed" | "skipped"
      invoice_status:
        | "draft"
        | "issued"
        | "partially_paid"
        | "paid"
        | "overdue"
        | "void"
      invoice_type: "proforma" | "commercial"
      lead_source:
        | "web"
        | "referral"
        | "partner"
        | "exhibition"
        | "direct"
        | "campaign"
        | "ai_assistant"
        | "other"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "proposal"
        | "negotiation"
        | "won"
        | "lost"
        | "archived"
      opportunity_stage:
        | "prospecting"
        | "qualification"
        | "proposal"
        | "negotiation"
        | "won"
        | "lost"
      order_status:
        | "draft"
        | "confirmed"
        | "in_production"
        | "ready_to_ship"
        | "shipped"
        | "delivered"
        | "cancelled"
      payment_method:
        | "bank_transfer"
        | "card"
        | "cash"
        | "letter_of_credit"
        | "other"
      quotation_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "sent"
        | "accepted"
        | "rejected"
        | "expired"
        | "converted"
        | "void"
      shipment_status: "preparing" | "in_transit" | "delivered" | "cancelled"
      task_priority: "low" | "normal" | "high" | "urgent"
      task_status: "open" | "in_progress" | "waiting" | "done" | "cancelled"
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
      communication_direction: ["inbound", "outbound", "internal"],
      communication_kind: [
        "note",
        "email",
        "call",
        "meeting",
        "whatsapp",
        "file",
      ],
      document_entity: ["order", "invoice", "shipment", "customer"],
      document_kind: [
        "proforma_pdf",
        "commercial_pdf",
        "packing_list",
        "bill_of_lading",
        "coa",
        "contract",
        "other",
      ],
      import_job_status: [
        "draft",
        "validating",
        "ready",
        "running",
        "completed",
        "failed",
        "cancelled",
      ],
      import_row_status: ["pending", "success", "failed", "skipped"],
      invoice_status: [
        "draft",
        "issued",
        "partially_paid",
        "paid",
        "overdue",
        "void",
      ],
      invoice_type: ["proforma", "commercial"],
      lead_source: [
        "web",
        "referral",
        "partner",
        "exhibition",
        "direct",
        "campaign",
        "ai_assistant",
        "other",
      ],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "proposal",
        "negotiation",
        "won",
        "lost",
        "archived",
      ],
      opportunity_stage: [
        "prospecting",
        "qualification",
        "proposal",
        "negotiation",
        "won",
        "lost",
      ],
      order_status: [
        "draft",
        "confirmed",
        "in_production",
        "ready_to_ship",
        "shipped",
        "delivered",
        "cancelled",
      ],
      payment_method: [
        "bank_transfer",
        "card",
        "cash",
        "letter_of_credit",
        "other",
      ],
      quotation_status: [
        "draft",
        "pending_approval",
        "approved",
        "sent",
        "accepted",
        "rejected",
        "expired",
        "converted",
        "void",
      ],
      shipment_status: ["preparing", "in_transit", "delivered", "cancelled"],
      task_priority: ["low", "normal", "high", "urgent"],
      task_status: ["open", "in_progress", "waiting", "done", "cancelled"],
    },
  },
} as const
