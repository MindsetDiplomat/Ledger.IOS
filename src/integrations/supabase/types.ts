export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17";
  };
  public: {
    Tables: {
      access_codes: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          redeemed_at: string | null;
          redeemed_by: string | null;
        };
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          redeemed_at?: string | null;
          redeemed_by?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          redeemed_at?: string | null;
          redeemed_by?: string | null;
        };
        Relationships: [];
      };
      assessment_responses: {
        Row: {
          assessment_id: string;
          id: string;
          question_key: string;
          updated_at: string;
          user_id: string;
          value: Json;
        };
        Insert: {
          assessment_id: string;
          id?: string;
          question_key: string;
          updated_at?: string;
          user_id: string;
          value: Json;
        };
        Update: {
          assessment_id?: string;
          id?: string;
          question_key?: string;
          updated_at?: string;
          user_id?: string;
          value?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "assessment_responses_assessment_id_fkey";
            columns: ["assessment_id"];
            isOneToOne: false;
            referencedRelation: "assessments";
            referencedColumns: ["id"];
          },
        ];
      };
      assessments: {
        Row: {
          completed_at: string | null;
          current_index: number;
          id: string;
          started_at: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          current_index?: number;
          id?: string;
          started_at?: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          current_index?: number;
          id?: string;
          started_at?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      ledger_transactions: {
        Row: {
          id: string;
          user_id: string;
          description: string;
          amount: number;
          currency: string;
          occurred_on: string;
          category: string;
          kind: string;
          account: string | null;
          receipt_path: string | null;
          receipt_captured_at: string | null;
          is_refund: boolean;
          duplicate_status: string;
          duplicate_of_transaction_id: string | null;
          fx_rate: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          description: string;
          amount: number;
          currency?: string;
          occurred_on: string;
          category?: string;
          kind: string;
          account?: string | null;
          receipt_path?: string | null;
          receipt_captured_at?: string | null;
          is_refund?: boolean;
          duplicate_status?: string;
          duplicate_of_transaction_id?: string | null;
          fx_rate?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          description?: string;
          amount?: number;
          currency?: string;
          occurred_on?: string;
          category?: string;
          kind?: string;
          account?: string | null;
          receipt_path?: string | null;
          receipt_captured_at?: string | null;
          is_refund?: boolean;
          duplicate_status?: string;
          duplicate_of_transaction_id?: string | null;
          fx_rate?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ledger_transactions_duplicate_of_transaction_id_fkey";
            columns: ["duplicate_of_transaction_id"];
            isOneToOne: false;
            referencedRelation: "ledger_transactions";
            referencedColumns: ["id"];
          },
        ];
      };
      ledger_investments: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: string;
          value: number;
          currency: string;
          cost_basis: number | null;
          entry_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type?: string;
          value?: number;
          currency?: string;
          cost_basis?: number | null;
          entry_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: string;
          value?: number;
          currency?: string;
          cost_basis?: number | null;
          entry_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ledger_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          amount: number;
          currency: string;
          frequency: string;
          next_billing_date: string | null;
          category: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          amount: number;
          currency?: string;
          frequency?: string;
          next_billing_date?: string | null;
          category?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          amount?: number;
          currency?: string;
          frequency?: string;
          next_billing_date?: string | null;
          category?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ledger_financial_periods: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          start_date: string;
          end_date: string;
          color: string;
          category: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          start_date: string;
          end_date: string;
          color?: string;
          category?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          start_date?: string;
          end_date?: string;
          color?: string;
          category?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          company: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          industries: string[];
          monthly_revenue: string | null;
          phone: string | null;
          theme: string | null;
          updated_at: string;
        };
        Insert: {
          company?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          industries?: string[];
          monthly_revenue?: string | null;
          phone?: string | null;
          theme?: string | null;
          updated_at?: string;
        };
        Update: {
          company?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          industries?: string[];
          monthly_revenue?: string | null;
          phone?: string | null;
          theme?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          ai_output: Json;
          assessment_id: string;
          created_at: string;
          has_premium: boolean;
          id: string;
          leakage: Json;
          scores: Json;
          user_id: string;
        };
        Insert: {
          ai_output?: Json;
          assessment_id: string;
          created_at?: string;
          has_premium?: boolean;
          id?: string;
          leakage?: Json;
          scores?: Json;
          user_id: string;
        };
        Update: {
          ai_output?: Json;
          assessment_id?: string;
          created_at?: string;
          has_premium?: boolean;
          id?: string;
          leakage?: Json;
          scores?: Json;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_assessment_id_fkey";
            columns: ["assessment_id"];
            isOneToOne: true;
            referencedRelation: "assessments";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "user";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const;
