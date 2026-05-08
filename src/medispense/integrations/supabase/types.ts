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
      audit_logs: {
        Row: {
          action_type: string
          created_at: string
          description: string | null
          entity_type: string
          field_changed: string | null
          id: string
          new_value: string | null
          old_value: string | null
          patient_code: string | null
          patient_id: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          action_type: string
          created_at?: string
          description?: string | null
          entity_type: string
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          patient_code?: string | null
          patient_id?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string | null
          entity_type?: string
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          patient_code?: string | null
          patient_id?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      cardiovascular_controls: {
        Row: {
          cardiovascular_risk: string
          control_date: string
          created_at: string
          created_by: string
          event_type: string
          id: string
          manual_override: boolean | null
          manual_override_reason: string | null
          next_control_date: string
          next_control_professional: string
          notes: string | null
          patient_id: string
          professional: string
        }
        Insert: {
          cardiovascular_risk: string
          control_date?: string
          created_at?: string
          created_by: string
          event_type?: string
          id?: string
          manual_override?: boolean | null
          manual_override_reason?: string | null
          next_control_date: string
          next_control_professional: string
          notes?: string | null
          patient_id: string
          professional: string
        }
        Update: {
          cardiovascular_risk?: string
          control_date?: string
          created_at?: string
          created_by?: string
          event_type?: string
          id?: string
          manual_override?: boolean | null
          manual_override_reason?: string | null
          next_control_date?: string
          next_control_professional?: string
          notes?: string | null
          patient_id?: string
          professional?: string
        }
        Relationships: [
          {
            foreignKeyName: "cardiovascular_controls_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      education_pages: {
        Row: {
          content: string | null
          created_at: string
          created_by: string
          id: string
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by: string
          id?: string
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string
          id?: string
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      medications: {
        Row: {
          active_ingredient: string
          category: string | null
          created_at: string
          dose_unit: string
          dose_value: number
          id: string
          is_active: boolean
          name: string
          presentation: string
          restrictions: string | null
          updated_at: string
        }
        Insert: {
          active_ingredient: string
          category?: string | null
          created_at?: string
          dose_unit: string
          dose_value: number
          id?: string
          is_active?: boolean
          name: string
          presentation: string
          restrictions?: string | null
          updated_at?: string
        }
        Update: {
          active_ingredient?: string
          category?: string | null
          created_at?: string
          dose_unit?: string
          dose_value?: number
          id?: string
          is_active?: boolean
          name?: string
          presentation?: string
          restrictions?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      patient_notifications: {
        Row: {
          created_at: string
          email: string | null
          id: string
          patient_id: string
          push_enabled: boolean | null
          push_subscription: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          patient_id: string
          push_enabled?: boolean | null
          push_subscription?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          patient_id?: string
          push_enabled?: boolean | null
          push_subscription?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_notifications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          age: number | null
          cardiovascular_risk: string | null
          created_at: string
          created_by: string
          cv_followup_status: string | null
          date_of_birth: string | null
          diagnoses: string[] | null
          education_tools: string[] | null
          email: string | null
          full_name: string
          has_diabetic_retinopathy: boolean | null
          id: string
          is_cardiovascular_program: boolean | null
          last_cv_control_date: string | null
          last_cv_control_notes: string | null
          last_cv_control_professional: string | null
          last_ecg_date: string | null
          last_fundoscopy_date: string | null
          last_lab_review_date: string | null
          manual_override_next_control: boolean | null
          manual_override_reason: string | null
          next_cv_control_date: string | null
          next_cv_control_professional: string | null
          patient_code: string
          phone: string | null
          show_exam_dates_to_patient: boolean | null
          show_exam_reminder: boolean | null
          updated_at: string
        }
        Insert: {
          age?: number | null
          cardiovascular_risk?: string | null
          created_at?: string
          created_by: string
          cv_followup_status?: string | null
          date_of_birth?: string | null
          diagnoses?: string[] | null
          education_tools?: string[] | null
          email?: string | null
          full_name: string
          has_diabetic_retinopathy?: boolean | null
          id?: string
          is_cardiovascular_program?: boolean | null
          last_cv_control_date?: string | null
          last_cv_control_notes?: string | null
          last_cv_control_professional?: string | null
          last_ecg_date?: string | null
          last_fundoscopy_date?: string | null
          last_lab_review_date?: string | null
          manual_override_next_control?: boolean | null
          manual_override_reason?: string | null
          next_cv_control_date?: string | null
          next_cv_control_professional?: string | null
          patient_code: string
          phone?: string | null
          show_exam_dates_to_patient?: boolean | null
          show_exam_reminder?: boolean | null
          updated_at?: string
        }
        Update: {
          age?: number | null
          cardiovascular_risk?: string | null
          created_at?: string
          created_by?: string
          cv_followup_status?: string | null
          date_of_birth?: string | null
          diagnoses?: string[] | null
          education_tools?: string[] | null
          email?: string | null
          full_name?: string
          has_diabetic_retinopathy?: boolean | null
          id?: string
          is_cardiovascular_program?: boolean | null
          last_cv_control_date?: string | null
          last_cv_control_notes?: string | null
          last_cv_control_professional?: string | null
          last_ecg_date?: string | null
          last_fundoscopy_date?: string | null
          last_lab_review_date?: string | null
          manual_override_next_control?: boolean | null
          manual_override_reason?: string | null
          next_cv_control_date?: string | null
          next_cv_control_professional?: string | null
          patient_code?: string
          phone?: string | null
          show_exam_dates_to_patient?: boolean | null
          show_exam_reminder?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      prescription_items: {
        Row: {
          ai_description: string | null
          created_at: string
          duration_days: number | null
          fractionation: string | null
          frequency: string
          id: string
          is_annulled: boolean
          is_sos: boolean
          medication_id: string | null
          medication_name: string
          prescribed_dose: number
          prescribed_unit: string
          prescription_id: string
          schedule: Json | null
          sos_reason: string | null
        }
        Insert: {
          ai_description?: string | null
          created_at?: string
          duration_days?: number | null
          fractionation?: string | null
          frequency: string
          id?: string
          is_annulled?: boolean
          is_sos?: boolean
          medication_id?: string | null
          medication_name: string
          prescribed_dose: number
          prescribed_unit: string
          prescription_id: string
          schedule?: Json | null
          sos_reason?: string | null
        }
        Update: {
          ai_description?: string | null
          created_at?: string
          duration_days?: number | null
          fractionation?: string | null
          frequency?: string
          id?: string
          is_annulled?: boolean
          is_sos?: boolean
          medication_id?: string | null
          medication_name?: string
          prescribed_dose?: number
          prescribed_unit?: string
          prescription_id?: string
          schedule?: Json | null
          sos_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescription_items_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_items_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string
          expiry_date: string
          id: string
          issue_date: string
          notes: string | null
          patient_id: string
          prescribed_by: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expiry_date: string
          id?: string
          issue_date?: string
          notes?: string | null
          patient_id: string
          prescribed_by: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expiry_date?: string
          id?: string
          issue_date?: string
          notes?: string | null
          patient_id?: string
          prescribed_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          specialty: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          specialty?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          specialty?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      app_role: "admin" | "nurse"
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
      app_role: ["admin", "nurse"],
    },
  },
} as const
