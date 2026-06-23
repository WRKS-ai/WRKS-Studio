// Generated from the live Supabase schema via the Supabase MCP
// `generate_typescript_types` tool. Re-run on every schema change.
//
//   Project: WRKS Studio  (dxpuwtorswquwxljpwcj)
//   Region:  us-east-1
//
// Edit only by re-generating, never by hand.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      approvals: {
        Row: {
          action: string
          business_profile_id: string
          created_at: string
          deliverable_id: string
          id: string
          reason: string | null
        }
        Insert: {
          action: string
          business_profile_id: string
          created_at?: string
          deliverable_id: string
          id?: string
          reason?: string | null
        }
        Update: {
          action?: string
          business_profile_id?: string
          created_at?: string
          deliverable_id?: string
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approvals_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "profile_activity"
            referencedColumns: ["business_profile_id"]
          },
          {
            foreignKeyName: "approvals_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          active_pillars: string[] | null
          ad_accounts: string[] | null
          agent_name: string | null
          audience_description: string | null
          audience_language_samples: string[] | null
          audience_objections: string[] | null
          audience_problem: string | null
          brand_name: string | null
          business_stage: string | null
          competitor_urls: string[] | null
          created_at: string
          crm: string | null
          differentiator: string | null
          domain: string | null
          email_platform: string | null
          existing_materials: string[] | null
          existing_site_url: string | null
          id: string
          industry: string | null
          industry_custom: string | null
          intake_summary: string | null
          offer_details: string | null
          offer_summary: string | null
          onboarding_completed_at: string | null
          palette: Json | null
          payment_processor: string | null
          personality_id: string | null
          price_points: string[] | null
          revenue_target: string | null
          scheduling_tool: string | null
          status: string
          success_metric: string | null
          updated_at: string
          user_id: string
          voice_guide: Json | null
          voice_id: string | null
          voice_origin: string | null
          years_running: number | null
        }
        Insert: {
          active_pillars?: string[] | null
          ad_accounts?: string[] | null
          agent_name?: string | null
          audience_description?: string | null
          audience_language_samples?: string[] | null
          audience_objections?: string[] | null
          audience_problem?: string | null
          brand_name?: string | null
          business_stage?: string | null
          competitor_urls?: string[] | null
          created_at?: string
          crm?: string | null
          differentiator?: string | null
          domain?: string | null
          email_platform?: string | null
          existing_materials?: string[] | null
          existing_site_url?: string | null
          id?: string
          industry?: string | null
          industry_custom?: string | null
          intake_summary?: string | null
          offer_details?: string | null
          offer_summary?: string | null
          onboarding_completed_at?: string | null
          palette?: Json | null
          payment_processor?: string | null
          personality_id?: string | null
          price_points?: string[] | null
          revenue_target?: string | null
          scheduling_tool?: string | null
          status?: string
          success_metric?: string | null
          updated_at?: string
          user_id: string
          voice_guide?: Json | null
          voice_id?: string | null
          voice_origin?: string | null
          years_running?: number | null
        }
        Update: {
          active_pillars?: string[] | null
          ad_accounts?: string[] | null
          agent_name?: string | null
          audience_description?: string | null
          audience_language_samples?: string[] | null
          audience_objections?: string[] | null
          audience_problem?: string | null
          brand_name?: string | null
          business_stage?: string | null
          competitor_urls?: string[] | null
          created_at?: string
          crm?: string | null
          differentiator?: string | null
          domain?: string | null
          email_platform?: string | null
          existing_materials?: string[] | null
          existing_site_url?: string | null
          id?: string
          industry?: string | null
          industry_custom?: string | null
          intake_summary?: string | null
          offer_details?: string | null
          offer_summary?: string | null
          onboarding_completed_at?: string | null
          palette?: Json | null
          payment_processor?: string | null
          personality_id?: string | null
          price_points?: string[] | null
          revenue_target?: string | null
          scheduling_tool?: string | null
          status?: string
          success_metric?: string | null
          updated_at?: string
          user_id?: string
          voice_guide?: Json | null
          voice_id?: string | null
          voice_origin?: string | null
          years_running?: number | null
        }
        Relationships: []
      }
      deliverables: {
        Row: {
          business_profile_id: string
          content: Json
          created_at: string
          framework: string | null
          id: string
          kind: string
          revision_of: string | null
          status: string
          updated_at: string
        }
        Insert: {
          business_profile_id: string
          content: Json
          created_at?: string
          framework?: string | null
          id?: string
          kind: string
          revision_of?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          business_profile_id?: string
          content?: Json
          created_at?: string
          framework?: string | null
          id?: string
          kind?: string
          revision_of?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "profile_activity"
            referencedColumns: ["business_profile_id"]
          },
          {
            foreignKeyName: "deliverables_revision_of_fkey"
            columns: ["revision_of"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
        ]
      }
      delta_playbook: {
        Row: {
          business_profile_id: string
          confidence: number
          created_at: string
          harmful_count: number
          helpful_count: number
          id: string
          kind: string
          last_used_at: string
          text: string
          updated_at: string
        }
        Insert: {
          business_profile_id: string
          confidence?: number
          created_at?: string
          harmful_count?: number
          helpful_count?: number
          id?: string
          kind: string
          last_used_at?: string
          text: string
          updated_at?: string
        }
        Update: {
          business_profile_id?: string
          confidence?: number
          created_at?: string
          harmful_count?: number
          helpful_count?: number
          id?: string
          kind?: string
          last_used_at?: string
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delta_playbook_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delta_playbook_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "profile_activity"
            referencedColumns: ["business_profile_id"]
          },
        ]
      }
      memory_entries: {
        Row: {
          business_profile_id: string
          content: Json
          created_at: string
          embedding: string | null
          id: string
          kind: string
          source: string
          weight: number
        }
        Insert: {
          business_profile_id: string
          content: Json
          created_at?: string
          embedding?: string | null
          id?: string
          kind: string
          source: string
          weight?: number
        }
        Update: {
          business_profile_id?: string
          content?: Json
          created_at?: string
          embedding?: string | null
          id?: string
          kind?: string
          source?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "memory_entries_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_entries_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "profile_activity"
            referencedColumns: ["business_profile_id"]
          },
        ]
      }
      voice_sessions: {
        Row: {
          business_profile_id: string
          elevenlabs_conv_id: string | null
          ended_at: string | null
          id: string
          meta: Json
          started_at: string
          surface: string
          transcript: Json
        }
        Insert: {
          business_profile_id: string
          elevenlabs_conv_id?: string | null
          ended_at?: string | null
          id?: string
          meta?: Json
          started_at?: string
          surface: string
          transcript?: Json
        }
        Update: {
          business_profile_id?: string
          elevenlabs_conv_id?: string | null
          ended_at?: string | null
          id?: string
          meta?: Json
          started_at?: string
          surface?: string
          transcript?: Json
        }
        Relationships: [
          {
            foreignKeyName: "voice_sessions_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_sessions_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "profile_activity"
            referencedColumns: ["business_profile_id"]
          },
        ]
      }
    }
    Views: {
      current_memory: {
        Row: {
          business_profile_id: string | null
          content: Json | null
          created_at: string | null
          kind: string | null
          weight: number | null
        }
        Relationships: [
          {
            foreignKeyName: "memory_entries_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_entries_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "profile_activity"
            referencedColumns: ["business_profile_id"]
          },
        ]
      }
      profile_activity: {
        Row: {
          approved_count: number | null
          business_profile_id: string | null
          last_approved_at: string | null
          staging_count: number | null
          user_id: string | null
        }
        Relationships: []
      }
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
