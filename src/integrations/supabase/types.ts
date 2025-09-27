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
      analytics_summary: {
        Row: {
          avg_processing_time_ms: number | null
          date: string | null
          id: string
          total_credits_used: number | null
          total_questions: number | null
          total_reports: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avg_processing_time_ms?: number | null
          date?: string | null
          id?: string
          total_credits_used?: number | null
          total_questions?: number | null
          total_reports?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avg_processing_time_ms?: number | null
          date?: string | null
          id?: string
          total_credits_used?: number | null
          total_questions?: number | null
          total_reports?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      data_sources: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          last_updated: string | null
          source_type: string | null
          title: string
          url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          last_updated?: string | null
          source_type?: string | null
          title: string
          url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          last_updated?: string | null
          source_type?: string | null
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          content_text: string | null
          created_at: string | null
          file_path: string
          file_size: number | null
          filename: string
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          content_text?: string | null
          created_at?: string | null
          file_path: string
          file_size?: number | null
          filename: string
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          content_text?: string | null
          created_at?: string | null
          file_path?: string
          file_size?: number | null
          filename?: string
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      research_reports: {
        Row: {
          citations: Json | null
          created_at: string | null
          id: string
          key_takeaways: Json | null
          processing_time_ms: number | null
          question: string
          sources: Json | null
          status: string | null
          summary: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          citations?: Json | null
          created_at?: string | null
          id?: string
          key_takeaways?: Json | null
          processing_time_ms?: number | null
          question: string
          sources?: Json | null
          status?: string | null
          summary?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          citations?: Json | null
          created_at?: string | null
          id?: string
          key_takeaways?: Json | null
          processing_time_ms?: number | null
          question?: string
          sources?: Json | null
          status?: string | null
          summary?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          action_type: string
          created_at: string | null
          credits_used: number | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          credits_used?: number | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          credits_used?: number | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
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
