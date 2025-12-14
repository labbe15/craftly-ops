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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          address: string | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          org_id: string
          phone: string | null
          tags: string | null
          type: "professional" | "individual" | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          org_id: string
          phone?: string | null
          tags?: string | null
          type?: "professional" | "individual" | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          org_id?: string
          phone?: string | null
          tags?: string | null
          type?: "professional" | "individual" | null
          updated_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          client_id: string | null
          created_at: string | null
          end_at: string | null
          id: string
          invoice_id: string | null
          notes: string | null
          org_id: string
          quote_id: string | null
          start_at: string
          title: string
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          end_at?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          org_id: string
          quote_id?: string | null
          start_at: string
          title: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          end_at?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          org_id?: string
          quote_id?: string | null
          start_at?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          created_at: string | null
          id: string
          kind: string | null
          org_id: string
          related_id: string | null
          related_type: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          kind?: string | null
          org_id: string
          related_id?: string | null
          related_type?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          kind?: string | null
          org_id?: string
          related_id?: string | null
          related_type?: string | null
          url?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          line_total_ht: number
          qty: number
          unit: string | null
          unit_price_ht: number
          vat_rate: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          line_total_ht?: number
          qty?: number
          unit?: string | null
          unit_price_ht?: number
          vat_rate?: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          line_total_ht?: number
          qty?: number
          unit?: string | null
          unit_price_ht?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string | null
          created_at: string | null
          currency: string | null
          due_date: string | null
          id: string
          number: string
          org_id: string
          paid_at: string | null
          quote_id: string | null
          sent_at: string | null
          status: string | null
          totals_ht: number | null
          totals_ttc: number | null
          totals_vat: number | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          number: string
          org_id: string
          paid_at?: string | null
          quote_id?: string | null
          sent_at?: string | null
          status?: string | null
          totals_ht?: number | null
          totals_ttc?: number | null
          totals_vat?: number | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          number?: string
          org_id?: string
          paid_at?: string | null
          quote_id?: string | null
          sent_at?: string | null
          status?: string | null
          totals_ht?: number | null
          totals_ttc?: number | null
          totals_vat?: number | null
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
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          buying_price_ht: number | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          org_id: string
          unit: string | null
          unit_price_ht: number
          updated_at: string | null
          vat_rate: number
        }
        Insert: {
          buying_price_ht?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          org_id: string
          unit?: string | null
          unit_price_ht?: number
          updated_at?: string | null
          vat_rate?: number
        }
        Update: {
          buying_price_ht?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          org_id?: string
          unit?: string | null
          unit_price_ht?: number
          updated_at?: string | null
          vat_rate?: number
        }
        Relationships: []
      }
      mail_log: {
        Row: {
          created_at: string | null
          id: string
          org_id: string
          provider_message_id: string | null
          related_id: string | null
          related_type: string | null
          sent_at: string | null
          status: string | null
          subject: string
          template_key: string | null
          to_email: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          org_id: string
          provider_message_id?: string | null
          related_id?: string | null
          related_type?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          template_key?: string | null
          to_email: string
        }
        Update: {
          created_at?: string | null
          id?: string
          org_id?: string
          provider_message_id?: string | null
          related_id?: string | null
          related_type?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          template_key?: string | null
          to_email?: string
        }
        Relationships: []
      }
      org_settings: {
        Row: {
          address: string | null
          brand_primary: string | null
          brand_secondary: string | null
          company_name: string | null
          created_at: string | null
          default_vat_rate: number | null
          email_from_address: string | null
          email_sender_name: string | null
          font: string | null
          footer_text: string | null
          header_bg_url: string | null
          id: string
          invoice_overdue_days: number | null
          invoice_prefix: string | null
          org_id: string
          payment_terms_days: number | null
          phone: string | null
          quote_followup_days: number | null
          quote_prefix: string | null
          smtp_host: string | null
          smtp_port: number | null
          smtp_user: string | null
          smtp_password: string | null
          updated_at: string | null
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          brand_primary?: string | null
          brand_secondary?: string | null
          company_name?: string | null
          created_at?: string | null
          default_vat_rate?: number | null
          email_from_address?: string | null
          email_sender_name?: string | null
          font?: string | null
          footer_text?: string | null
          header_bg_url?: string | null
          id?: string
          invoice_overdue_days?: number | null
          invoice_prefix?: string | null
          org_id: string
          payment_terms_days?: number | null
          phone?: string | null
          quote_followup_days?: number | null
          quote_prefix?: string | null
          smtp_host?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          smtp_password?: string | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          brand_primary?: string | null
          brand_secondary?: string | null
          company_name?: string | null
          created_at?: string | null
          default_vat_rate?: number | null
          email_from_address?: string | null
          email_sender_name?: string | null
          font?: string | null
          footer_text?: string | null
          header_bg_url?: string | null
          id?: string
          invoice_overdue_days?: number | null
          invoice_prefix?: string | null
          org_id?: string
          payment_terms_days?: number | null
          phone?: string | null
          quote_followup_days?: number | null
          quote_prefix?: string | null
          smtp_host?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          smtp_password?: string | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          invoice_id: string
          method: string | null
          note: string | null
          paid_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          invoice_id: string
          method?: string | null
          note?: string | null
          paid_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          invoice_id?: string
          method?: string | null
          note?: string | null
          paid_at?: string | null
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
      quote_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          item_id: string | null
          line_total_ht: number
          qty: number
          quote_id: string
          unit: string | null
          unit_price_ht: number
          vat_rate: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          item_id?: string | null
          line_total_ht?: number
          qty?: number
          quote_id: string
          unit?: string | null
          unit_price_ht?: number
          vat_rate?: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          item_id?: string | null
          line_total_ht?: number
          qty?: number
          quote_id?: string
          unit?: string | null
          unit_price_ht?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          accepted_at: string | null
          client_id: string | null
          created_at: string | null
          currency: string | null
          expires_at: string | null
          id: string
          notes: string | null
          number: string
          org_id: string
          refused_at: string | null
          sent_at: string | null
          status: string | null
          terms_text: string | null
          totals_ht: number | null
          totals_ttc: number | null
          totals_vat: number | null
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          number: string
          org_id: string
          refused_at?: string | null
          sent_at?: string | null
          status?: string | null
          terms_text?: string | null
          totals_ht?: number | null
          totals_ttc?: number | null
          totals_vat?: number | null
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          number?: string
          org_id?: string
          refused_at?: string | null
          sent_at?: string | null
          status?: string | null
          terms_text?: string | null
          totals_ht?: number | null
          totals_ttc?: number | null
          totals_vat?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
