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
      booking_approvals: {
        Row: {
          action_type: string | null
          approval_id: number
          booking_id: number | null
          created_at: string | null
          employee_id: number | null
          ip_address: string | null
          new_status: string | null
          notes: string | null
          old_status: string | null
        }
        Insert: {
          action_type?: string | null
          approval_id?: number
          booking_id?: number | null
          created_at?: string | null
          employee_id?: number | null
          ip_address?: string | null
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
        }
        Update: {
          action_type?: string | null
          approval_id?: number
          booking_id?: number | null
          created_at?: string | null
          employee_id?: number | null
          ip_address?: string | null
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_approvals_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_approvals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      booking_boarding_stop: {
        Row: {
          booking_id: number | null
          booking_stop_id: number
          created_at: string | null
          ready_time: string | null
          stop_id: number | null
        }
        Insert: {
          booking_id?: number | null
          booking_stop_id?: number
          created_at?: string | null
          ready_time?: string | null
          stop_id?: number | null
        }
        Update: {
          booking_id?: number | null
          booking_stop_id?: number
          created_at?: string | null
          ready_time?: string | null
          stop_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_boarding_stop_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_boarding_stop_stop_id_fkey"
            columns: ["stop_id"]
            isOneToOne: false
            referencedRelation: "route_stops"
            referencedColumns: ["stop_id"]
          },
        ]
      }
      booking_cancellations: {
        Row: {
          booking_id: number | null
          cancel_policy_id: number | null
          cancellation_fee: number | null
          cancellation_id: number
          cancelled_at: string | null
          cancelled_by_user_id: number | null
          created_at: string | null
          hours_before_departure: number | null
          original_total: number | null
          reason: string | null
          refund_amount: number | null
          refund_percentage: number | null
          refund_status: string | null
          rule_id: number | null
        }
        Insert: {
          booking_id?: number | null
          cancel_policy_id?: number | null
          cancellation_fee?: number | null
          cancellation_id?: number
          cancelled_at?: string | null
          cancelled_by_user_id?: number | null
          created_at?: string | null
          hours_before_departure?: number | null
          original_total?: number | null
          reason?: string | null
          refund_amount?: number | null
          refund_percentage?: number | null
          refund_status?: string | null
          rule_id?: number | null
        }
        Update: {
          booking_id?: number | null
          cancel_policy_id?: number | null
          cancellation_fee?: number | null
          cancellation_id?: number
          cancelled_at?: string | null
          cancelled_by_user_id?: number | null
          created_at?: string | null
          hours_before_departure?: number | null
          original_total?: number | null
          reason?: string | null
          refund_amount?: number | null
          refund_percentage?: number | null
          refund_status?: string | null
          rule_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_cancellations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_cancellations_cancel_policy_id_fkey"
            columns: ["cancel_policy_id"]
            isOneToOne: false
            referencedRelation: "cancel_policies"
            referencedColumns: ["cancel_policy_id"]
          },
          {
            foreignKeyName: "booking_cancellations_cancelled_by_user_id_fkey"
            columns: ["cancelled_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "booking_cancellations_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "cancel_policy_rules"
            referencedColumns: ["rule_id"]
          },
        ]
      }
      booking_ledger: {
        Row: {
          amount: number | null
          booking_id: number | null
          created_at: string | null
          currency: string | null
          entry_type: Database["public"]["Enums"]["ledger_entry_type"] | null
          ledger_id: number
          note: string | null
          partner_id: number | null
        }
        Insert: {
          amount?: number | null
          booking_id?: number | null
          created_at?: string | null
          currency?: string | null
          entry_type?: Database["public"]["Enums"]["ledger_entry_type"] | null
          ledger_id?: number
          note?: string | null
          partner_id?: number | null
        }
        Update: {
          amount?: number | null
          booking_id?: number | null
          created_at?: string | null
          currency?: string | null
          entry_type?: Database["public"]["Enums"]["ledger_entry_type"] | null
          ledger_id?: number
          note?: string | null
          partner_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_ledger_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_ledger_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["partner_id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_date: string | null
          booking_id: number
          booking_status: Database["public"]["Enums"]["booking_status"] | null
          cancel_policy_id: number | null
          cancel_reason: string | null
          cancel_timestamp: string | null
          expires_at: string | null
          gateway_transaction_id: string | null
          partner_revenue: number | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          payment_timestamp: string | null
          platform_commission: number | null
          refund_amount: number | null
          refund_timestamp: string | null
          total_price: number
          trip_id: number | null
          user_id: number | null
        }
        Insert: {
          booking_date?: string | null
          booking_id?: number
          booking_status?: Database["public"]["Enums"]["booking_status"] | null
          cancel_policy_id?: number | null
          cancel_reason?: string | null
          cancel_timestamp?: string | null
          expires_at?: string | null
          gateway_transaction_id?: string | null
          partner_revenue?: number | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          payment_timestamp?: string | null
          platform_commission?: number | null
          refund_amount?: number | null
          refund_timestamp?: string | null
          total_price: number
          trip_id?: number | null
          user_id?: number | null
        }
        Update: {
          booking_date?: string | null
          booking_id?: number
          booking_status?: Database["public"]["Enums"]["booking_status"] | null
          cancel_policy_id?: number | null
          cancel_reason?: string | null
          cancel_timestamp?: string | null
          expires_at?: string | null
          gateway_transaction_id?: string | null
          partner_revenue?: number | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          payment_timestamp?: string | null
          platform_commission?: number | null
          refund_amount?: number | null
          refund_timestamp?: string | null
          total_price?: number
          trip_id?: number | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_cancel_policy_id_fkey"
            columns: ["cancel_policy_id"]
            isOneToOne: false
            referencedRelation: "cancel_policies"
            referencedColumns: ["cancel_policy_id"]
          },
          {
            foreignKeyName: "bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          branch_id: number
          branch_name: string
          city: string | null
          created_at: string | null
          partner_id: number | null
          phone: string | null
          status: string | null
        }
        Insert: {
          address?: string | null
          branch_id?: number
          branch_name: string
          city?: string | null
          created_at?: string | null
          partner_id?: number | null
          phone?: string | null
          status?: string | null
        }
        Update: {
          address?: string | null
          branch_id?: number
          branch_name?: string
          city?: string | null
          created_at?: string | null
          partner_id?: number | null
          phone?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["partner_id"]
          },
        ]
      }
      bus_classes: {
        Row: {
          bus_class_id: number
          class_name: string
          description: string | null
          price_adjustment_factor: number | null
        }
        Insert: {
          bus_class_id?: number
          class_name: string
          description?: string | null
          price_adjustment_factor?: number | null
        }
        Update: {
          bus_class_id?: number
          class_name?: string
          description?: string | null
          price_adjustment_factor?: number | null
        }
        Relationships: []
      }
      buses: {
        Row: {
          bus_class_id: number | null
          bus_id: number
          bus_type: Database["public"]["Enums"]["bus_type"] | null
          capacity: number | null
          created_at: string | null
          license_plate: string
          model: string | null
          owner_user_id: number | null
          partner_id: number | null
          status: Database["public"]["Enums"]["bus_status"] | null
        }
        Insert: {
          bus_class_id?: number | null
          bus_id?: number
          bus_type?: Database["public"]["Enums"]["bus_type"] | null
          capacity?: number | null
          created_at?: string | null
          license_plate: string
          model?: string | null
          owner_user_id?: number | null
          partner_id?: number | null
          status?: Database["public"]["Enums"]["bus_status"] | null
        }
        Update: {
          bus_class_id?: number | null
          bus_id?: number
          bus_type?: Database["public"]["Enums"]["bus_type"] | null
          capacity?: number | null
          created_at?: string | null
          license_plate?: string
          model?: string | null
          owner_user_id?: number | null
          partner_id?: number | null
          status?: Database["public"]["Enums"]["bus_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "buses_bus_class_id_fkey"
            columns: ["bus_class_id"]
            isOneToOne: false
            referencedRelation: "bus_classes"
            referencedColumns: ["bus_class_id"]
          },
          {
            foreignKeyName: "buses_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "buses_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["partner_id"]
          },
        ]
      }
      cancel_policies: {
        Row: {
          cancel_policy_id: number
          created_at: string | null
          days_before_trip: number | null
          description: string | null
          is_active: boolean | null
          is_default: boolean | null
          partner_id: number | null
          policy_name: string
          priority: number | null
          refund_percentage: number | null
          updated_at: string | null
        }
        Insert: {
          cancel_policy_id?: number
          created_at?: string | null
          days_before_trip?: number | null
          description?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          partner_id?: number | null
          policy_name: string
          priority?: number | null
          refund_percentage?: number | null
          updated_at?: string | null
        }
        Update: {
          cancel_policy_id?: number
          created_at?: string | null
          days_before_trip?: number | null
          description?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          partner_id?: number | null
          policy_name?: string
          priority?: number | null
          refund_percentage?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cancel_policies_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["partner_id"]
          },
        ]
      }
      cancel_policy_rules: {
        Row: {
          cancel_policy_id: number | null
          cancellation_fee: number | null
          created_at: string | null
          display_order: number | null
          is_active: boolean | null
          max_hours_before_departure: number | null
          min_hours_before_departure: number | null
          refund_percentage: number | null
          rule_id: number
        }
        Insert: {
          cancel_policy_id?: number | null
          cancellation_fee?: number | null
          created_at?: string | null
          display_order?: number | null
          is_active?: boolean | null
          max_hours_before_departure?: number | null
          min_hours_before_departure?: number | null
          refund_percentage?: number | null
          rule_id?: number
        }
        Update: {
          cancel_policy_id?: number | null
          cancellation_fee?: number | null
          created_at?: string | null
          display_order?: number | null
          is_active?: boolean | null
          max_hours_before_departure?: number | null
          min_hours_before_departure?: number | null
          refund_percentage?: number | null
          rule_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "cancel_policy_rules_cancel_policy_id_fkey"
            columns: ["cancel_policy_id"]
            isOneToOne: false
            referencedRelation: "cancel_policies"
            referencedColumns: ["cancel_policy_id"]
          },
        ]
      }
      commissions: {
        Row: {
          booking_amount: number | null
          booking_id: number | null
          calculated_by: number | null
          commission_amount: number | null
          commission_id: number
          commission_percentage: number | null
          created_at: string | null
          notes: string | null
          partner_id: number | null
          partner_revenue: number | null
          payment_date: string | null
          status: string | null
          trip_id: number | null
        }
        Insert: {
          booking_amount?: number | null
          booking_id?: number | null
          calculated_by?: number | null
          commission_amount?: number | null
          commission_id?: number
          commission_percentage?: number | null
          created_at?: string | null
          notes?: string | null
          partner_id?: number | null
          partner_revenue?: number | null
          payment_date?: string | null
          status?: string | null
          trip_id?: number | null
        }
        Update: {
          booking_amount?: number | null
          booking_id?: number | null
          calculated_by?: number | null
          commission_amount?: number | null
          commission_id?: number
          commission_percentage?: number | null
          created_at?: string | null
          notes?: string | null
          partner_id?: number | null
          partner_revenue?: number | null
          payment_date?: string | null
          status?: string | null
          trip_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "commissions_calculated_by_fkey"
            columns: ["calculated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "commissions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "commissions_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["trip_id"]
          },
        ]
      }
      conversations: {
        Row: {
          id: string
          last_activity_at: string | null
          started_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          last_activity_at?: string | null
          started_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          last_activity_at?: string | null
          started_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      daily_commissions: {
        Row: {
          commission_date: string
          created_at: string | null
          id: number
          total_bookings: number | null
          total_commission: number | null
          total_revenue: number | null
        }
        Insert: {
          commission_date: string
          created_at?: string | null
          id?: number
          total_bookings?: number | null
          total_commission?: number | null
          total_revenue?: number | null
        }
        Update: {
          commission_date?: string
          created_at?: string | null
          id?: number
          total_bookings?: number | null
          total_commission?: number | null
          total_revenue?: number | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          document_id: number
          document_number: string | null
          document_type: Database["public"]["Enums"]["document_type"] | null
          document_url: string | null
          expiry_date: string | null
          partner_id: number | null
          rejection_reason: string | null
          review_date: string | null
          reviewed_by: number | null
          upload_date: string | null
          user_id: number | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Insert: {
          document_id?: number
          document_number?: string | null
          document_type?: Database["public"]["Enums"]["document_type"] | null
          document_url?: string | null
          expiry_date?: string | null
          partner_id?: number | null
          rejection_reason?: string | null
          review_date?: string | null
          reviewed_by?: number | null
          upload_date?: string | null
          user_id?: number | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Update: {
          document_id?: number
          document_number?: string | null
          document_type?: Database["public"]["Enums"]["document_type"] | null
          document_url?: string | null
          expiry_date?: string | null
          partner_id?: number | null
          rejection_reason?: string | null
          review_date?: string | null
          reviewed_by?: number | null
          upload_date?: string | null
          user_id?: number | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      drivers: {
        Row: {
          created_at: string | null
          driver_id: number
          full_name: string
          license_expiry: string | null
          license_number: string | null
          partner_id: number | null
          phone_number: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          driver_id?: number
          full_name: string
          license_expiry?: string | null
          license_number?: string | null
          partner_id?: number | null
          phone_number?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          driver_id?: number
          full_name?: string
          license_expiry?: string | null
          license_number?: string | null
          partner_id?: number | null
          phone_number?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["partner_id"]
          },
        ]
      }
      employees: {
        Row: {
          branch_id: number | null
          created_at: string | null
          employee_id: number
          partner_id: number | null
          role_in_company: string | null
          status: string | null
          user_id: number | null
        }
        Insert: {
          branch_id?: number | null
          created_at?: string | null
          employee_id?: number
          partner_id?: number | null
          role_in_company?: string | null
          status?: string | null
          user_id?: number | null
        }
        Update: {
          branch_id?: number | null
          created_at?: string | null
          employee_id?: number
          partner_id?: number | null
          role_in_company?: string | null
          status?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "employees_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string | null
          display_order: number | null
          faq_id: number
          is_active: boolean | null
          question: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          faq_id?: number
          is_active?: boolean | null
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          faq_id?: number
          is_active?: boolean | null
          question?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          is_read: boolean | null
          message: string
          notification_id: number
          related_booking_id: number | null
          sent_at: string | null
          type: Database["public"]["Enums"]["notification_type"] | null
          user_id: number | null
        }
        Insert: {
          is_read?: boolean | null
          message: string
          notification_id?: number
          related_booking_id?: number | null
          sent_at?: string | null
          type?: Database["public"]["Enums"]["notification_type"] | null
          user_id?: number | null
        }
        Update: {
          is_read?: boolean | null
          message?: string
          notification_id?: number
          related_booking_id?: number | null
          sent_at?: string | null
          type?: Database["public"]["Enums"]["notification_type"] | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_booking_id_fkey"
            columns: ["related_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      partner_applications: {
        Row: {
          application_id: number
          auth_user_id: string | null
          commercial_register_url: string | null
          company_address: string | null
          company_city: string
          company_email: string | null
          company_name: string
          company_phone: string | null
          created_at: string
          description: string | null
          fleet_size: number | null
          owner_email: string
          owner_id_number: string | null
          owner_name: string
          owner_phone: string
          partner_id: number | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tax_certificate_url: string | null
          updated_at: string
        }
        Insert: {
          application_id?: number
          auth_user_id?: string | null
          commercial_register_url?: string | null
          company_address?: string | null
          company_city: string
          company_email?: string | null
          company_name: string
          company_phone?: string | null
          created_at?: string
          description?: string | null
          fleet_size?: number | null
          owner_email: string
          owner_id_number?: string | null
          owner_name: string
          owner_phone: string
          partner_id?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tax_certificate_url?: string | null
          updated_at?: string
        }
        Update: {
          application_id?: number
          auth_user_id?: string | null
          commercial_register_url?: string | null
          company_address?: string | null
          company_city?: string
          company_email?: string | null
          company_name?: string
          company_phone?: string | null
          created_at?: string
          description?: string | null
          fleet_size?: number | null
          owner_email?: string
          owner_id_number?: string | null
          owner_name?: string
          owner_phone?: string
          partner_id?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tax_certificate_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_applications_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["partner_id"]
          },
        ]
      }
      partner_invoice_items: {
        Row: {
          booking_amount: number | null
          booking_id: number | null
          commission_amount: number | null
          invoice_id: number | null
          item_id: number
        }
        Insert: {
          booking_amount?: number | null
          booking_id?: number | null
          commission_amount?: number | null
          invoice_id?: number | null
          item_id?: number
        }
        Update: {
          booking_amount?: number | null
          booking_id?: number | null
          commission_amount?: number | null
          invoice_id?: number | null
          item_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "partner_invoice_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "partner_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "partner_invoices"
            referencedColumns: ["invoice_id"]
          },
        ]
      }
      partner_invoices: {
        Row: {
          created_at: string | null
          due_date: string | null
          invoice_date: string | null
          invoice_id: number
          invoice_number: string | null
          paid_date: string | null
          partner_id: number | null
          partner_net: number | null
          period_end: string | null
          period_start: string | null
          platform_commission: number | null
          status: string | null
          total_amount: number | null
        }
        Insert: {
          created_at?: string | null
          due_date?: string | null
          invoice_date?: string | null
          invoice_id?: number
          invoice_number?: string | null
          paid_date?: string | null
          partner_id?: number | null
          partner_net?: number | null
          period_end?: string | null
          period_start?: string | null
          platform_commission?: number | null
          status?: string | null
          total_amount?: number | null
        }
        Update: {
          created_at?: string | null
          due_date?: string | null
          invoice_date?: string | null
          invoice_id?: number
          invoice_number?: string | null
          paid_date?: string | null
          partner_id?: number | null
          partner_net?: number | null
          period_end?: string | null
          period_start?: string | null
          platform_commission?: number | null
          status?: string | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_invoices_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["partner_id"]
          },
        ]
      }
      partner_payments: {
        Row: {
          invoice_id: number | null
          partner_id: number | null
          payment_amount: number | null
          payment_date: string | null
          payment_id: number
          payment_method: string | null
          reference_number: string | null
          status: string | null
        }
        Insert: {
          invoice_id?: number | null
          partner_id?: number | null
          payment_amount?: number | null
          payment_date?: string | null
          payment_id?: number
          payment_method?: string | null
          reference_number?: string | null
          status?: string | null
        }
        Update: {
          invoice_id?: number | null
          partner_id?: number | null
          payment_amount?: number | null
          payment_date?: string | null
          payment_id?: number
          payment_method?: string | null
          reference_number?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "partner_invoices"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "partner_payments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["partner_id"]
          },
        ]
      }
      partners: {
        Row: {
          address: string | null
          application_documents_url: string | null
          commission_percentage: number | null
          company_name: string
          contact_person: string | null
          created_at: string | null
          partner_id: number
          status: Database["public"]["Enums"]["partner_status"] | null
        }
        Insert: {
          address?: string | null
          application_documents_url?: string | null
          commission_percentage?: number | null
          company_name: string
          contact_person?: string | null
          created_at?: string | null
          partner_id?: number
          status?: Database["public"]["Enums"]["partner_status"] | null
        }
        Update: {
          address?: string | null
          application_documents_url?: string | null
          commission_percentage?: number | null
          company_name?: string
          contact_person?: string | null
          created_at?: string | null
          partner_id?: number
          status?: Database["public"]["Enums"]["partner_status"] | null
        }
        Relationships: []
      }
      passengers: {
        Row: {
          birth_date: string | null
          booking_id: number | null
          cancellation_id: number | null
          cancelled_at: string | null
          created_at: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          id_image: string | null
          id_number: string | null
          passenger_id: number
          passenger_status: string | null
          phone_number: string | null
          seat_id: number | null
          trip_id: number | null
        }
        Insert: {
          birth_date?: string | null
          booking_id?: number | null
          cancellation_id?: number | null
          cancelled_at?: string | null
          created_at?: string | null
          full_name: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id_image?: string | null
          id_number?: string | null
          passenger_id?: number
          passenger_status?: string | null
          phone_number?: string | null
          seat_id?: number | null
          trip_id?: number | null
        }
        Update: {
          birth_date?: string | null
          booking_id?: number | null
          cancellation_id?: number | null
          cancelled_at?: string | null
          created_at?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id_image?: string | null
          id_number?: string | null
          passenger_id?: number
          passenger_status?: string | null
          phone_number?: string | null
          seat_id?: number | null
          trip_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "passengers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "passengers_seat_id_fkey"
            columns: ["seat_id"]
            isOneToOne: false
            referencedRelation: "seats"
            referencedColumns: ["seat_id"]
          },
          {
            foreignKeyName: "passengers_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["trip_id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          booking_id: number | null
          created_at: string | null
          currency: string | null
          gateway_name: string | null
          gateway_ref: string | null
          payment_id: number
          payment_method: string | null
          raw_response: Json | null
          status: string | null
          user_id: number | null
        }
        Insert: {
          amount: number
          booking_id?: number | null
          created_at?: string | null
          currency?: string | null
          gateway_name?: string | null
          gateway_ref?: string | null
          payment_id?: number
          payment_method?: string | null
          raw_response?: Json | null
          status?: string | null
          user_id?: number | null
        }
        Update: {
          amount?: number
          booking_id?: number | null
          created_at?: string | null
          currency?: string | null
          gateway_name?: string | null
          gateway_ref?: string | null
          payment_id?: number
          payment_method?: string | null
          raw_response?: Json | null
          status?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "payment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ratings: {
        Row: {
          comment: string | null
          driver_id: number | null
          partner_id: number | null
          rating_date: string | null
          rating_id: number
          stars: number | null
          trip_id: number | null
          user_id: number | null
        }
        Insert: {
          comment?: string | null
          driver_id?: number | null
          partner_id?: number | null
          rating_date?: string | null
          rating_id?: number
          stars?: number | null
          trip_id?: number | null
          user_id?: number | null
        }
        Update: {
          comment?: string | null
          driver_id?: number | null
          partner_id?: number | null
          rating_date?: string | null
          rating_id?: number
          stars?: number | null
          trip_id?: number | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ratings_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "ratings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "ratings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      refund_transactions: {
        Row: {
          account_holder_name: string | null
          bank_account: string | null
          bank_name: string | null
          booking_id: number | null
          completed_at: string | null
          completed_by: number | null
          created_at: string | null
          customer_notes: string | null
          initiated_by: number | null
          internal_notes: string | null
          kareemi_number: string | null
          net_refund: number | null
          notes: string | null
          original_payment_method: string | null
          original_transaction_id: string | null
          processed_by: number | null
          processing_started_at: string | null
          refund_amount: number | null
          refund_fee: number | null
          refund_id: number
          refund_method: string | null
          refund_reference: string | null
          refund_status: string | null
        }
        Insert: {
          account_holder_name?: string | null
          bank_account?: string | null
          bank_name?: string | null
          booking_id?: number | null
          completed_at?: string | null
          completed_by?: number | null
          created_at?: string | null
          customer_notes?: string | null
          initiated_by?: number | null
          internal_notes?: string | null
          kareemi_number?: string | null
          net_refund?: number | null
          notes?: string | null
          original_payment_method?: string | null
          original_transaction_id?: string | null
          processed_by?: number | null
          processing_started_at?: string | null
          refund_amount?: number | null
          refund_fee?: number | null
          refund_id?: number
          refund_method?: string | null
          refund_reference?: string | null
          refund_status?: string | null
        }
        Update: {
          account_holder_name?: string | null
          bank_account?: string | null
          bank_name?: string | null
          booking_id?: number | null
          completed_at?: string | null
          completed_by?: number | null
          created_at?: string | null
          customer_notes?: string | null
          initiated_by?: number | null
          internal_notes?: string | null
          kareemi_number?: string | null
          net_refund?: number | null
          notes?: string | null
          original_payment_method?: string | null
          original_transaction_id?: string | null
          processed_by?: number | null
          processing_started_at?: string | null
          refund_amount?: number | null
          refund_fee?: number | null
          refund_id?: number
          refund_method?: string | null
          refund_reference?: string | null
          refund_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refund_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "refund_transactions_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "refund_transactions_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "refund_transactions_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      refunds: {
        Row: {
          bank_account: string | null
          booking_id: number | null
          completed_at: string | null
          created_at: string | null
          processed_at: string | null
          refund_amount: number
          refund_id: number
          refund_method: string | null
          status: string | null
          stc_pay_number: string | null
          transaction_id: string | null
          user_id: number | null
        }
        Insert: {
          bank_account?: string | null
          booking_id?: number | null
          completed_at?: string | null
          created_at?: string | null
          processed_at?: string | null
          refund_amount: number
          refund_id?: number
          refund_method?: string | null
          status?: string | null
          stc_pay_number?: string | null
          transaction_id?: string | null
          user_id?: number | null
        }
        Update: {
          bank_account?: string | null
          booking_id?: number | null
          completed_at?: string | null
          created_at?: string | null
          processed_at?: string | null
          refund_amount?: number
          refund_id?: number
          refund_method?: string | null
          status?: string | null
          stc_pay_number?: string | null
          transaction_id?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "refunds_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "refunds_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      route_stops: {
        Row: {
          created_at: string | null
          preparation_time: string | null
          route_id: number | null
          stop_id: number
          stop_location: string | null
          stop_name: string
          stop_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          preparation_time?: string | null
          route_id?: number | null
          stop_id?: number
          stop_location?: string | null
          stop_name: string
          stop_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          preparation_time?: string | null
          route_id?: number | null
          stop_id?: number
          stop_location?: string | null
          stop_name?: string
          stop_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["route_id"]
          },
        ]
      }
      routes: {
        Row: {
          created_at: string | null
          destination_city: string
          distance_km: number | null
          estimated_duration_hours: number | null
          origin_city: string
          partner_id: number | null
          route_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          destination_city: string
          distance_km?: number | null
          estimated_duration_hours?: number | null
          origin_city: string
          partner_id?: number | null
          route_id?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          destination_city?: string
          distance_km?: number | null
          estimated_duration_hours?: number | null
          origin_city?: string
          partner_id?: number | null
          route_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["partner_id"]
          },
        ]
      }
      seats: {
        Row: {
          bus_id: number | null
          is_available: boolean | null
          price_adjustment_factor: number | null
          seat_id: number
          seat_number: string
        }
        Insert: {
          bus_id?: number | null
          is_available?: boolean | null
          price_adjustment_factor?: number | null
          seat_id?: number
          seat_number: string
        }
        Update: {
          bus_id?: number | null
          is_available?: boolean | null
          price_adjustment_factor?: number | null
          seat_id?: number
          seat_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "seats_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["bus_id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          attachment_url: string | null
          created_at: string | null
          description: string | null
          issue_type: string | null
          priority: string | null
          status: string | null
          ticket_id: number
          title: string
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string | null
          description?: string | null
          issue_type?: string | null
          priority?: string | null
          status?: string | null
          ticket_id?: number
          title: string
          updated_at?: string | null
          user_id?: number | null
        }
        Update: {
          attachment_url?: string | null
          created_at?: string | null
          description?: string | null
          issue_type?: string | null
          priority?: string | null
          status?: string | null
          ticket_id?: number
          title?: string
          updated_at?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      trips: {
        Row: {
          arrival_time: string | null
          base_price: number
          bus_id: number | null
          created_at: string | null
          departure_time: string
          driver_id: number | null
          partner_id: number | null
          route_id: number | null
          status: Database["public"]["Enums"]["trip_status"] | null
          trip_id: number
          updated_at: string | null
        }
        Insert: {
          arrival_time?: string | null
          base_price: number
          bus_id?: number | null
          created_at?: string | null
          departure_time: string
          driver_id?: number | null
          partner_id?: number | null
          route_id?: number | null
          status?: Database["public"]["Enums"]["trip_status"] | null
          trip_id?: number
          updated_at?: string | null
        }
        Update: {
          arrival_time?: string | null
          base_price?: number
          bus_id?: number | null
          created_at?: string | null
          departure_time?: string
          driver_id?: number | null
          partner_id?: number | null
          route_id?: number | null
          status?: Database["public"]["Enums"]["trip_status"] | null
          trip_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["bus_id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "trips_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["route_id"]
          },
        ]
      }
      user_device_tokens: {
        Row: {
          created_at: string | null
          device_type: string | null
          fcm_token: string | null
          id: number
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          created_at?: string | null
          device_type?: string | null
          fcm_token?: string | null
          id?: number
          updated_at?: string | null
          user_id?: number | null
        }
        Update: {
          created_at?: string | null
          device_type?: string | null
          fcm_token?: string | null
          id?: number
          updated_at?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_device_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          partner_id: number | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          partner_id?: number | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          partner_id?: number | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["partner_id"]
          },
        ]
      }
      users: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"] | null
          auth_id: string | null
          created_at: string | null
          email: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          partner_id: number | null
          password_hash: string | null
          phone_number: string | null
          rejection_reason: string | null
          updated_at: string | null
          user_id: number
          user_type: Database["public"]["Enums"]["user_type"] | null
          verification_code: number | null
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"] | null
          auth_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          partner_id?: number | null
          password_hash?: string | null
          phone_number?: string | null
          rejection_reason?: string | null
          updated_at?: string | null
          user_id?: number
          user_type?: Database["public"]["Enums"]["user_type"] | null
          verification_code?: number | null
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"] | null
          auth_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          partner_id?: number | null
          password_hash?: string | null
          phone_number?: string | null
          rejection_reason?: string | null
          updated_at?: string | null
          user_id?: number
          user_type?: Database["public"]["Enums"]["user_type"] | null
          verification_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "users_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["partner_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_partner_id: { Args: { _user_id: string }; Returns: number }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      account_status: "active" | "inactive" | "suspended" | "pending"
      app_role: "admin" | "partner" | "employee"
      booking_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "expired"
      bus_status: "active" | "maintenance" | "inactive" | "retired"
      bus_type: "standard" | "vip" | "sleeper" | "double_decker"
      document_type:
        | "id_card"
        | "license"
        | "registration"
        | "insurance"
        | "other"
      gender_type: "male" | "female"
      ledger_entry_type: "booking" | "refund" | "commission" | "adjustment"
      notification_type: "booking" | "payment" | "trip" | "system" | "promotion"
      partner_status: "pending" | "approved" | "rejected" | "suspended"
      payment_method: "cash" | "card" | "wallet" | "bank_transfer" | "stc_pay"
      payment_status:
        | "pending"
        | "paid"
        | "failed"
        | "refunded"
        | "partially_refunded"
      trip_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "delayed"
      user_type: "customer" | "partner" | "admin" | "driver" | "employee"
      verification_status: "pending" | "approved" | "rejected"
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
      account_status: ["active", "inactive", "suspended", "pending"],
      app_role: ["admin", "partner", "employee"],
      booking_status: [
        "pending",
        "confirmed",
        "cancelled",
        "completed",
        "expired",
      ],
      bus_status: ["active", "maintenance", "inactive", "retired"],
      bus_type: ["standard", "vip", "sleeper", "double_decker"],
      document_type: [
        "id_card",
        "license",
        "registration",
        "insurance",
        "other",
      ],
      gender_type: ["male", "female"],
      ledger_entry_type: ["booking", "refund", "commission", "adjustment"],
      notification_type: ["booking", "payment", "trip", "system", "promotion"],
      partner_status: ["pending", "approved", "rejected", "suspended"],
      payment_method: ["cash", "card", "wallet", "bank_transfer", "stc_pay"],
      payment_status: [
        "pending",
        "paid",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      trip_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
        "delayed",
      ],
      user_type: ["customer", "partner", "admin", "driver", "employee"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
