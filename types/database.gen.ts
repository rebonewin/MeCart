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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          resource: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          id: string
          is_default: boolean
          label: string | null
          line1: string
          line2: string | null
          name: string
          phone: string
          state: string
          updated_at: string
          user_id: string
          zip: string
        }
        Insert: {
          city: string
          country: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          line1: string
          line2?: string | null
          name: string
          phone: string
          state: string
          updated_at?: string
          user_id: string
          zip: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          line1?: string
          line2?: string | null
          name?: string
          phone?: string
          state?: string
          updated_at?: string
          user_id?: string
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admins: {
        Row: {
          created_at: string
          deleted_at: string | null
          department: string | null
          id: string
          level: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          department?: string | null
          id?: string
          level?: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          department?: string | null
          id?: string
          level?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string
          id: string
          name: string
          path: string | null
          properties: Json
          referrer: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          path?: string | null
          properties?: Json
          referrer?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          path?: string | null
          properties?: Json
          referrer?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          admin_id: string | null
          browser: string | null
          created_at: string
          id: string
          ip_address: string | null
          new_value: string | null
          old_value: string | null
          os: string | null
          resource: string
          status: Database["public"]["Enums"]["audit_status"]
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          browser?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: string | null
          old_value?: string | null
          os?: string | null
          resource: string
          status?: Database["public"]["Enums"]["audit_status"]
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          browser?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: string | null
          old_value?: string | null
          os?: string | null
          resource?: string
          status?: Database["public"]["Enums"]["audit_status"]
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          cart_id: string
          color: string | null
          created_at: string
          id: string
          product_id: string
          quantity: number
          size: string | null
          unit_price: number
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          cart_id: string
          color?: string | null
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          size?: string | null
          unit_price?: number
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          cart_id?: string
          color?: string | null
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          size?: string | null
          unit_price?: number
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          status: Database["public"]["Enums"]["cart_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["cart_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["cart_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "carts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          position: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          position?: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          position?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      cms_pages: {
        Row: {
          content: Json
          cover_image: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          excerpt: string | null
          id: string
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["cms_status"]
          template: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["cms_status"]
          template?: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["cms_status"]
          template?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_pages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_usage: {
        Row: {
          coupon_id: string
          created_at: string
          discount: number
          id: string
          order_id: string | null
          user_id: string | null
        }
        Insert: {
          coupon_id: string
          created_at?: string
          discount?: number
          id?: string
          order_id?: string | null
          user_id?: string | null
        }
        Update: {
          coupon_id?: string
          created_at?: string
          discount?: number
          id?: string
          order_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          deleted_at: string | null
          description: string | null
          discount_amount: number | null
          discount_percent: number | null
          expires_at: string | null
          id: string
          max_discount: number | null
          min_order_value: number | null
          per_user_limit: number
          starts_at: string | null
          store_id: string | null
          updated_at: string
          usage_limit: number | null
          used_count: number
          vendor_id: string | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          max_discount?: number | null
          min_order_value?: number | null
          per_user_limit?: number
          starts_at?: string | null
          store_id?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          vendor_id?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          max_discount?: number | null
          min_order_value?: number | null
          per_user_limit?: number
          starts_at?: string | null
          store_id?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          loyalty_points: number
          marketing_opt_in: boolean
          notes: string | null
          total_orders: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          loyalty_points?: number
          marketing_opt_in?: boolean
          notes?: string | null
          total_orders?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          loyalty_points?: number
          marketing_opt_in?: boolean
          notes?: string | null
          total_orders?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_otp_requests: {
        Row: {
          client_ip: string | null
          consumed_at: string | null
          email: string
          expires_at: string
          id: string
          is_verified: boolean
          last_error: string | null
          purpose: string
          requested_at: string
          resend_count: number
          user_id: string | null
          verification_attempts: number
          verified_at: string | null
        }
        Insert: {
          client_ip?: string | null
          consumed_at?: string | null
          email: string
          expires_at: string
          id?: string
          is_verified?: boolean
          last_error?: string | null
          purpose: string
          requested_at?: string
          resend_count?: number
          user_id?: string | null
          verification_attempts?: number
          verified_at?: string | null
        }
        Update: {
          client_ip?: string | null
          consumed_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          is_verified?: boolean
          last_error?: string | null
          purpose?: string
          requested_at?: string
          resend_count?: number
          user_id?: string | null
          verification_attempts?: number
          verified_at?: string | null
        }
        Relationships: []
      }
      failed_2fa_attempts: {
        Row: {
          created_at: string
          id: string
          ip: string | null
          method: string | null
          reason: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip?: string | null
          method?: string | null
          reason?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip?: string | null
          method?: string | null
          reason?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          created_at: string
          id: string
          location: string | null
          low_stock_threshold: number
          product_id: string
          quantity: number
          reserved_quantity: number
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          low_stock_threshold?: number
          product_id: string
          quantity?: number
          reserved_quantity?: number
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          low_stock_threshold?: number
          product_id?: string
          quantity?: number
          reserved_quantity?: number
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_logs: {
        Row: {
          change: number
          created_at: string
          created_by: string | null
          id: string
          inventory_id: string | null
          product_id: string
          quantity_after: number
          reason: string
          reference: string | null
          variant_id: string | null
        }
        Insert: {
          change: number
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_id?: string | null
          product_id: string
          quantity_after?: number
          reason?: string
          reference?: string | null
          variant_id?: string | null
        }
        Update: {
          change?: number
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_id?: string | null
          product_id?: string
          quantity_after?: number
          reason?: string
          reference?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_logs_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_logs_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      media_library: {
        Row: {
          alt: string | null
          bucket: string
          created_at: string
          folder: string | null
          height: number | null
          id: string
          mime_type: string | null
          name: string | null
          path: string
          size_bytes: number | null
          updated_at: string
          uploaded_by: string | null
          url: string
          width: number | null
        }
        Insert: {
          alt?: string | null
          bucket: string
          created_at?: string
          folder?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          name?: string | null
          path: string
          size_bytes?: number | null
          updated_at?: string
          uploaded_by?: string | null
          url: string
          width?: number | null
        }
        Update: {
          alt?: string | null
          bucket?: string
          created_at?: string
          folder?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          name?: string | null
          path?: string
          size_bytes?: number | null
          updated_at?: string
          uploaded_by?: string | null
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_library_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json | null
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          color: string | null
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          name: string
          order_id: string
          price: number
          product_id: string | null
          quantity: number
          size: string | null
          sku: string
          store_id: string | null
          total: number
          vendor_earnings: number
          vendor_id: string | null
          vendor_sku: string | null
        }
        Insert: {
          color?: string | null
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          name: string
          order_id: string
          price: number
          product_id?: string | null
          quantity: number
          size?: string | null
          sku: string
          store_id?: string | null
          total: number
          vendor_earnings?: number
          vendor_id?: string | null
          vendor_sku?: string | null
        }
        Update: {
          color?: string | null
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          name?: string
          order_id?: string
          price?: number
          product_id?: string | null
          quantity?: number
          size?: string | null
          sku?: string
          store_id?: string | null
          total?: number
          vendor_earnings?: number
          vendor_id?: string | null
          vendor_sku?: string | null
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
          {
            foreignKeyName: "order_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address: string | null
          city: string
          coupon_code: string | null
          created_at: string
          currency: string
          customer_email: string
          customer_name: string
          customer_phone: string
          deleted_at: string | null
          discount: number
          grand_total: number
          id: string
          invoice_number: string
          marketplace_order: boolean
          notes: string | null
          order_number: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          shipping_address: string
          shipping_cost: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax: number
          updated_at: string
          user_id: string | null
          vendor_count: number
          zip: string
        }
        Insert: {
          billing_address?: string | null
          city: string
          coupon_code?: string | null
          created_at?: string
          currency?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          deleted_at?: string | null
          discount?: number
          grand_total?: number
          id?: string
          invoice_number: string
          marketplace_order?: boolean
          notes?: string | null
          order_number: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping_address: string
          shipping_cost?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax?: number
          updated_at?: string
          user_id?: string | null
          vendor_count?: number
          zip: string
        }
        Update: {
          billing_address?: string | null
          city?: string
          coupon_code?: string | null
          created_at?: string
          currency?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          deleted_at?: string | null
          discount?: number
          grand_total?: number
          id?: string
          invoice_number?: string
          marketplace_order?: boolean
          notes?: string | null
          order_number?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping_address?: string
          shipping_cost?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax?: number
          updated_at?: string
          user_id?: string | null
          vendor_count?: number
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
          payment_id: string | null
          provider: string
          status: Database["public"]["Enums"]["payment_status"]
          transaction_id: string | null
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
          payment_id?: string | null
          provider?: string
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_id?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          order_id?: string
          payment_id?: string | null
          provider?: string
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_id?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          created_at: string
          description: string | null
          id: string
          key: string
          resource: string
          updated_at: string
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          id?: string
          key: string
          resource: string
          updated_at?: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          resource?: string
          updated_at?: string
        }
        Relationships: []
      }
      phone_otp_requests: {
        Row: {
          blocked_until: string | null
          client_ip: string | null
          consumed_at: string | null
          country_code: string | null
          device_id: string | null
          expires_at: string
          id: string
          is_verified: boolean
          last_error: string | null
          phone_number: string
          provider: string
          purpose: string
          requested_at: string
          resend_count: number
          signature_nonce: string | null
          user_id: string | null
          verification_attempts: number
          verified_at: string | null
        }
        Insert: {
          blocked_until?: string | null
          client_ip?: string | null
          consumed_at?: string | null
          country_code?: string | null
          device_id?: string | null
          expires_at: string
          id?: string
          is_verified?: boolean
          last_error?: string | null
          phone_number: string
          provider?: string
          purpose: string
          requested_at?: string
          resend_count?: number
          signature_nonce?: string | null
          user_id?: string | null
          verification_attempts?: number
          verified_at?: string | null
        }
        Update: {
          blocked_until?: string | null
          client_ip?: string | null
          consumed_at?: string | null
          country_code?: string | null
          device_id?: string | null
          expires_at?: string
          id?: string
          is_verified?: boolean
          last_error?: string | null
          phone_number?: string
          provider?: string
          purpose?: string
          requested_at?: string
          resend_count?: number
          signature_nonce?: string | null
          user_id?: string | null
          verification_attempts?: number
          verified_at?: string | null
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          position: number
          product_id: string
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          position?: number
          product_id: string
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          position?: number
          product_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          color: string | null
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: number | null
          product_id: string
          size: string | null
          sku: string
          stock: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price?: number | null
          product_id: string
          size?: string | null
          sku: string
          stock?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number | null
          product_id?: string
          size?: string | null
          sku?: string
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          approval_notes: string | null
          approval_status: Database["public"]["Enums"]["vendor_product_approval"]
          approved_at: string | null
          approved_by: string | null
          best_seller: boolean
          brand_id: string | null
          category_id: string
          colors: string[]
          commission_rate: number | null
          country: string | null
          created_at: string
          deleted_at: string | null
          description: string
          discount_percent: number
          featured: boolean
          final_price: number
          id: string
          marketplace_metadata: Json
          material: string | null
          name: string
          new_arrival: boolean
          original_price: number
          rating: number
          review_count: number
          shipping_profile_id: string | null
          sizes: string[]
          sku: string
          slug: string
          status: Database["public"]["Enums"]["product_status"]
          stock: number
          store_id: string | null
          sub_category_id: string | null
          submitted_at: string | null
          updated_at: string
          vendor_id: string | null
          vendor_sku: string | null
          weight: number | null
        }
        Insert: {
          approval_notes?: string | null
          approval_status?: Database["public"]["Enums"]["vendor_product_approval"]
          approved_at?: string | null
          approved_by?: string | null
          best_seller?: boolean
          brand_id?: string | null
          category_id: string
          colors?: string[]
          commission_rate?: number | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string
          discount_percent?: number
          featured?: boolean
          final_price: number
          id?: string
          marketplace_metadata?: Json
          material?: string | null
          name: string
          new_arrival?: boolean
          original_price: number
          rating?: number
          review_count?: number
          shipping_profile_id?: string | null
          sizes?: string[]
          sku: string
          slug: string
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          store_id?: string | null
          sub_category_id?: string | null
          submitted_at?: string | null
          updated_at?: string
          vendor_id?: string | null
          vendor_sku?: string | null
          weight?: number | null
        }
        Update: {
          approval_notes?: string | null
          approval_status?: Database["public"]["Enums"]["vendor_product_approval"]
          approved_at?: string | null
          approved_by?: string | null
          best_seller?: boolean
          brand_id?: string | null
          category_id?: string
          colors?: string[]
          commission_rate?: number | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string
          discount_percent?: number
          featured?: boolean
          final_price?: number
          id?: string
          marketplace_metadata?: Json
          material?: string | null
          name?: string
          new_arrival?: boolean
          original_price?: number
          rating?: number
          review_count?: number
          shipping_profile_id?: string | null
          sizes?: string[]
          sku?: string
          slug?: string
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          store_id?: string | null
          sub_category_id?: string | null
          submitted_at?: string | null
          updated_at?: string
          vendor_id?: string | null
          vendor_sku?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_shipping_profile_id_fkey"
            columns: ["shipping_profile_id"]
            isOneToOne: false
            referencedRelation: "vendor_shipping_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_sub_category_id_fkey"
            columns: ["sub_category_id"]
            isOneToOne: false
            referencedRelation: "sub_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string
          avatar_url: string | null
          blocked_until: string | null
          country_code: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          email_verified_at: string | null
          failed_attempts: number
          failed_otp_attempts: number
          full_name: string | null
          id: string
          is_active: boolean
          last_login_at: string | null
          last_otp_sent_at: string | null
          last_phone_login: string | null
          otp_attempts: number
          otp_last_sent: string | null
          password_set_at: string | null
          phone: string | null
          phone_last_login: string | null
          phone_number: string | null
          phone_verified: boolean
          phone_verified_at: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          username: string | null
          verification_attempts: number
          verification_provider: string | null
        }
        Insert: {
          account_status?: string
          avatar_url?: string | null
          blocked_until?: string | null
          country_code?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          email_verified_at?: string | null
          failed_attempts?: number
          failed_otp_attempts?: number
          full_name?: string | null
          id: string
          is_active?: boolean
          last_login_at?: string | null
          last_otp_sent_at?: string | null
          last_phone_login?: string | null
          otp_attempts?: number
          otp_last_sent?: string | null
          password_set_at?: string | null
          phone?: string | null
          phone_last_login?: string | null
          phone_number?: string | null
          phone_verified?: boolean
          phone_verified_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          username?: string | null
          verification_attempts?: number
          verification_provider?: string | null
        }
        Update: {
          account_status?: string
          avatar_url?: string | null
          blocked_until?: string | null
          country_code?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          email_verified_at?: string | null
          failed_attempts?: number
          failed_otp_attempts?: number
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          last_otp_sent_at?: string | null
          last_phone_login?: string | null
          otp_attempts?: number
          otp_last_sent?: string | null
          password_set_at?: string | null
          phone?: string | null
          phone_last_login?: string | null
          phone_number?: string | null
          phone_verified?: boolean
          phone_verified_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          username?: string | null
          verification_attempts?: number
          verification_provider?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author_name: string | null
          body: string | null
          created_at: string
          id: string
          images: string[]
          order_id: string | null
          product_id: string
          rating: number
          status: Database["public"]["Enums"]["review_status"]
          store_id: string | null
          title: string | null
          updated_at: string
          user_id: string | null
          vendor_id: string | null
          vendor_replied_at: string | null
          vendor_reply: string | null
        }
        Insert: {
          author_name?: string | null
          body?: string | null
          created_at?: string
          id?: string
          images?: string[]
          order_id?: string | null
          product_id: string
          rating: number
          status?: Database["public"]["Enums"]["review_status"]
          store_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
          vendor_id?: string | null
          vendor_replied_at?: string | null
          vendor_reply?: string | null
        }
        Update: {
          author_name?: string | null
          body?: string | null
          created_at?: string
          id?: string
          images?: string[]
          order_id?: string | null
          product_id?: string
          rating?: number
          status?: Database["public"]["Enums"]["review_status"]
          store_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
          vendor_id?: string | null
          vendor_replied_at?: string | null
          vendor_reply?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      seo: {
        Row: {
          canonical_url: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          keywords: string[]
          meta_description: string | null
          meta_title: string | null
          no_index: boolean
          og_description: string | null
          og_image: string | null
          og_title: string | null
          updated_at: string
        }
        Insert: {
          canonical_url?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          keywords?: string[]
          meta_description?: string | null
          meta_title?: string | null
          no_index?: boolean
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          updated_at?: string
        }
        Update: {
          canonical_url?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          keywords?: string[]
          meta_description?: string | null
          meta_title?: string | null
          no_index?: boolean
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          description: string | null
          is_public: boolean
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          is_public?: boolean
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          is_public?: boolean
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      shipping_methods: {
        Row: {
          created_at: string
          description: string | null
          free_over: number | null
          id: string
          is_active: boolean
          max_days: number
          min_days: number
          name: string
          rate: number
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          free_over?: number | null
          id?: string
          is_active?: boolean
          max_days?: number
          min_days?: number
          name: string
          rate?: number
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          free_over?: number | null
          id?: string
          is_active?: boolean
          max_days?: number
          min_days?: number
          name?: string
          rate?: number
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_methods_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "shipping_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_zones: {
        Row: {
          countries: string[]
          created_at: string
          id: string
          is_active: boolean
          name: string
          states: string[]
          updated_at: string
        }
        Insert: {
          countries?: string[]
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          states?: string[]
          updated_at?: string
        }
        Update: {
          countries?: string[]
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          states?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      store_followers: {
        Row: {
          created_at: string
          id: string
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_followers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_followers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address_line1: string | null
          approved_at: string | null
          approved_by: string | null
          banner_url: string | null
          brand_accent_color: string
          brand_primary_color: string
          city: string | null
          country: string
          created_at: string
          currency: string
          deleted_at: string | null
          description: string | null
          email: string | null
          follower_count: number
          id: string
          is_featured: boolean
          logo_url: string | null
          name: string
          phone: string | null
          privacy_policy: string | null
          product_count: number
          rating: number
          return_policy: string | null
          review_count: number
          seo_description: string | null
          seo_title: string | null
          settings: Json
          shipping_policy: string | null
          slug: string
          social_links: Json
          state: string | null
          status: Database["public"]["Enums"]["vendor_store_status"]
          tagline: string | null
          theme_mode: string
          total_sales: number
          updated_at: string
          vendor_id: string
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          approved_at?: string | null
          approved_by?: string | null
          banner_url?: string | null
          brand_accent_color?: string
          brand_primary_color?: string
          city?: string | null
          country?: string
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          follower_count?: number
          id?: string
          is_featured?: boolean
          logo_url?: string | null
          name: string
          phone?: string | null
          privacy_policy?: string | null
          product_count?: number
          rating?: number
          return_policy?: string | null
          review_count?: number
          seo_description?: string | null
          seo_title?: string | null
          settings?: Json
          shipping_policy?: string | null
          slug: string
          social_links?: Json
          state?: string | null
          status?: Database["public"]["Enums"]["vendor_store_status"]
          tagline?: string | null
          theme_mode?: string
          total_sales?: number
          updated_at?: string
          vendor_id: string
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          approved_at?: string | null
          approved_by?: string | null
          banner_url?: string | null
          brand_accent_color?: string
          brand_primary_color?: string
          city?: string | null
          country?: string
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          follower_count?: number
          id?: string
          is_featured?: boolean
          logo_url?: string | null
          name?: string
          phone?: string | null
          privacy_policy?: string | null
          product_count?: number
          rating?: number
          return_policy?: string | null
          review_count?: number
          seo_description?: string | null
          seo_title?: string | null
          settings?: Json
          shipping_policy?: string | null
          slug?: string
          social_links?: Json
          state?: string | null
          status?: Database["public"]["Enums"]["vendor_store_status"]
          tagline?: string | null
          theme_mode?: string
          total_sales?: number
          updated_at?: string
          vendor_id?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stores_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_categories: {
        Row: {
          category_id: string
          created_at: string
          deleted_at: string | null
          id: string
          is_active: boolean
          name: string
          position: number
          slug: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          position?: number
          slug: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          position?: number
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_rules: {
        Row: {
          country: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          rate: number
          state: string | null
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          rate?: number
          state?: string | null
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          rate?: number
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      theme_settings: {
        Row: {
          created_at: string
          description: string | null
          is_public: boolean
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          is_public?: boolean
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          is_public?: boolean
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          gateway_response: Json | null
          id: string
          order_id: string | null
          payment_id: string | null
          reference: string | null
          status: string
          type: Database["public"]["Enums"]["txn_type"]
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          gateway_response?: Json | null
          id?: string
          order_id?: string | null
          payment_id?: string | null
          reference?: string | null
          status?: string
          type?: Database["public"]["Enums"]["txn_type"]
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          gateway_response?: Json | null
          id?: string
          order_id?: string | null
          payment_id?: string | null
          reference?: string | null
          status?: string
          type?: Database["public"]["Enums"]["txn_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_devices: {
        Row: {
          browser: string | null
          created_at: string
          expires_at: string
          id: string
          ip: string | null
          label: string | null
          last_used_at: string | null
          location: string | null
          os: string | null
          revoked_at: string | null
          token_hash: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string
          expires_at: string
          id?: string
          ip?: string | null
          label?: string | null
          last_used_at?: string | null
          location?: string | null
          os?: string | null
          revoked_at?: string | null
          token_hash: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          ip?: string | null
          label?: string | null
          last_used_at?: string | null
          location?: string | null
          os?: string | null
          revoked_at?: string | null
          token_hash?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      two_factor_challenges: {
        Row: {
          attempts: number
          created_at: string
          email_send_count: number
          email_sent_at: string | null
          expires_at: string
          id: string
          metadata: Json
          method: string | null
          sms_send_count: number
          sms_sent_at: string | null
          token_hash: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          email_send_count?: number
          email_sent_at?: string | null
          expires_at: string
          id?: string
          metadata?: Json
          method?: string | null
          sms_send_count?: number
          sms_sent_at?: string | null
          token_hash: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          email_send_count?: number
          email_sent_at?: string | null
          expires_at?: string
          id?: string
          metadata?: Json
          method?: string | null
          sms_send_count?: number
          sms_sent_at?: string | null
          token_hash?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      two_factor_recovery_codes: {
        Row: {
          batch_id: string
          code_hash: string
          created_at: string
          id: string
          used_at: string | null
          used_ip: string | null
          used_user_agent: string | null
          user_id: string
        }
        Insert: {
          batch_id: string
          code_hash: string
          created_at?: string
          id?: string
          used_at?: string | null
          used_ip?: string | null
          used_user_agent?: string | null
          user_id: string
        }
        Update: {
          batch_id?: string
          code_hash?: string
          created_at?: string
          id?: string
          used_at?: string | null
          used_ip?: string | null
          used_user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_two_factor: {
        Row: {
          created_at: string
          enabled: boolean
          enabled_at: string | null
          encrypted_secret: string | null
          failed_attempts: number
          last_totp_step: number | null
          last_used_at: string | null
          locked_until: string | null
          method: string
          pending_attempts: number
          pending_contact_sent_at: string | null
          pending_encrypted_secret: string | null
          pending_method: string | null
          secret_verified_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          enabled_at?: string | null
          encrypted_secret?: string | null
          failed_attempts?: number
          last_totp_step?: number | null
          last_used_at?: string | null
          locked_until?: string | null
          method?: string
          pending_attempts?: number
          pending_contact_sent_at?: string | null
          pending_encrypted_secret?: string | null
          pending_method?: string | null
          secret_verified_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          enabled_at?: string | null
          encrypted_secret?: string | null
          failed_attempts?: number
          last_totp_step?: number | null
          last_used_at?: string | null
          locked_until?: string | null
          method?: string
          pending_attempts?: number
          pending_contact_sent_at?: string | null
          pending_encrypted_secret?: string | null
          pending_method?: string | null
          secret_verified_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vendor_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json
          resource: string | null
          vendor_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          resource?: string | null
          vendor_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          resource?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_audit_logs_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_conversations: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          last_message_at: string
          last_message_preview: string | null
          order_id: string | null
          status: Database["public"]["Enums"]["vendor_conversation_status"]
          store_id: string | null
          subject: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          last_message_at?: string
          last_message_preview?: string | null
          order_id?: string | null
          status?: Database["public"]["Enums"]["vendor_conversation_status"]
          store_id?: string | null
          subject: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          last_message_at?: string
          last_message_preview?: string | null
          order_id?: string | null
          status?: Database["public"]["Enums"]["vendor_conversation_status"]
          store_id?: string | null
          subject?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_conversations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_conversations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_conversations_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_ledger_entries: {
        Row: {
          amount: number
          available_at: string
          created_at: string
          currency: string
          description: string | null
          id: string
          metadata: Json
          order_id: string | null
          order_item_id: string | null
          payout_id: string | null
          store_id: string | null
          type: Database["public"]["Enums"]["vendor_ledger_type"]
          vendor_id: string
        }
        Insert: {
          amount: number
          available_at?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json
          order_id?: string | null
          order_item_id?: string | null
          payout_id?: string | null
          store_id?: string | null
          type: Database["public"]["Enums"]["vendor_ledger_type"]
          vendor_id: string
        }
        Update: {
          amount?: number
          available_at?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json
          order_id?: string | null
          order_item_id?: string | null
          payout_id?: string | null
          store_id?: string | null
          type?: Database["public"]["Enums"]["vendor_ledger_type"]
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_ledger_entries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_ledger_entries_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_ledger_entries_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "vendor_payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_ledger_entries_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_ledger_entries_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_members: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          joined_at: string | null
          permissions: string[]
          role: Database["public"]["Enums"]["vendor_member_role"]
          status: string
          updated_at: string
          user_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          permissions?: string[]
          role?: Database["public"]["Enums"]["vendor_member_role"]
          status?: string
          updated_at?: string
          user_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          permissions?: string[]
          role?: Database["public"]["Enums"]["vendor_member_role"]
          status?: string
          updated_at?: string
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_members_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_messages: {
        Row: {
          attachments: string[]
          body: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string | null
          sender_type: Database["public"]["Enums"]["vendor_message_sender"]
        }
        Insert: {
          attachments?: string[]
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string | null
          sender_type: Database["public"]["Enums"]["vendor_message_sender"]
        }
        Update: {
          attachments?: string[]
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string | null
          sender_type?: Database["public"]["Enums"]["vendor_message_sender"]
        }
        Relationships: [
          {
            foreignKeyName: "vendor_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "vendor_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string | null
          vendor_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type?: string
          user_id?: string | null
          vendor_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_notifications_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_order_allocations: {
        Row: {
          cancelled_at: string | null
          carrier: string | null
          commission_amount: number
          commission_rate: number
          created_at: string
          delivered_at: string | null
          discount_amount: number
          fulfillment_status: Database["public"]["Enums"]["vendor_fulfillment_status"]
          id: string
          order_id: string
          shipped_at: string | null
          shipping_amount: number
          store_id: string | null
          subtotal: number
          tax_amount: number
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
          vendor_earnings: number
          vendor_id: string
        }
        Insert: {
          cancelled_at?: string | null
          carrier?: string | null
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          delivered_at?: string | null
          discount_amount?: number
          fulfillment_status?: Database["public"]["Enums"]["vendor_fulfillment_status"]
          id?: string
          order_id: string
          shipped_at?: string | null
          shipping_amount?: number
          store_id?: string | null
          subtotal?: number
          tax_amount?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          vendor_earnings?: number
          vendor_id: string
        }
        Update: {
          cancelled_at?: string | null
          carrier?: string | null
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          delivered_at?: string | null
          discount_amount?: number
          fulfillment_status?: Database["public"]["Enums"]["vendor_fulfillment_status"]
          id?: string
          order_id?: string
          shipped_at?: string | null
          shipping_amount?: number
          store_id?: string | null
          subtotal?: number
          tax_amount?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          vendor_earnings?: number
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_order_allocations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_order_allocations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_order_allocations_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_payout_accounts: {
        Row: {
          account_email: string | null
          account_last4: string | null
          account_name: string
          bank_name: string | null
          created_at: string
          id: string
          is_default: boolean
          metadata: Json
          provider: string
          routing_last4: string | null
          status: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          account_email?: string | null
          account_last4?: string | null
          account_name: string
          bank_name?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          metadata?: Json
          provider: string
          routing_last4?: string | null
          status?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          account_email?: string | null
          account_last4?: string | null
          account_name?: string
          bank_name?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          metadata?: Json
          provider?: string
          routing_last4?: string | null
          status?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_payout_accounts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_payouts: {
        Row: {
          adjustments: number
          commissions: number
          created_at: string
          gross_sales: number
          id: string
          method: string
          net_amount: number
          notes: string | null
          payout_number: string
          period_end: string
          period_start: string
          processed_at: string | null
          reference: string | null
          refunds: number
          requested_by: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["vendor_payout_status"]
          updated_at: string
          vendor_id: string
        }
        Insert: {
          adjustments?: number
          commissions?: number
          created_at?: string
          gross_sales?: number
          id?: string
          method?: string
          net_amount?: number
          notes?: string | null
          payout_number: string
          period_end: string
          period_start: string
          processed_at?: string | null
          reference?: string | null
          refunds?: number
          requested_by?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["vendor_payout_status"]
          updated_at?: string
          vendor_id: string
        }
        Update: {
          adjustments?: number
          commissions?: number
          created_at?: string
          gross_sales?: number
          id?: string
          method?: string
          net_amount?: number
          notes?: string | null
          payout_number?: string
          period_end?: string
          period_start?: string
          processed_at?: string | null
          reference?: string | null
          refunds?: number
          requested_by?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["vendor_payout_status"]
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_payouts_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_payouts_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_payouts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_returns: {
        Row: {
          commission_reversal: number
          created_at: string
          id: string
          notes: string | null
          order_id: string
          order_item_id: string | null
          quantity: number
          reason: string
          received_at: string | null
          refund_amount: number
          refunded_at: string | null
          requested_at: string
          resolution_notes: string | null
          reviewed_at: string | null
          rma_number: string
          status: Database["public"]["Enums"]["vendor_return_status"]
          store_id: string | null
          updated_at: string
          user_id: string | null
          vendor_id: string
        }
        Insert: {
          commission_reversal?: number
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          order_item_id?: string | null
          quantity?: number
          reason: string
          received_at?: string | null
          refund_amount?: number
          refunded_at?: string | null
          requested_at?: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          rma_number: string
          status?: Database["public"]["Enums"]["vendor_return_status"]
          store_id?: string | null
          updated_at?: string
          user_id?: string | null
          vendor_id: string
        }
        Update: {
          commission_reversal?: number
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          order_item_id?: string | null
          quantity?: number
          reason?: string
          received_at?: string | null
          refund_amount?: number
          refunded_at?: string | null
          requested_at?: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          rma_number?: string
          status?: Database["public"]["Enums"]["vendor_return_status"]
          store_id?: string | null
          updated_at?: string
          user_id?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_returns_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_returns_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_returns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_returns_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_shipping_profiles: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          metadata: Json
          name: string
          processing_max_days: number
          processing_min_days: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          metadata?: Json
          name: string
          processing_max_days?: number
          processing_min_days?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          metadata?: Json
          name?: string
          processing_max_days?: number
          processing_min_days?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_shipping_profiles_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_shipping_rates: {
        Row: {
          countries: string[]
          created_at: string
          free_over: number | null
          id: string
          is_active: boolean
          max_days: number
          max_weight: number | null
          min_days: number
          min_weight: number | null
          name: string
          profile_id: string
          rate: number
          states: string[]
          updated_at: string
          vendor_id: string
        }
        Insert: {
          countries?: string[]
          created_at?: string
          free_over?: number | null
          id?: string
          is_active?: boolean
          max_days?: number
          max_weight?: number | null
          min_days?: number
          min_weight?: number | null
          name: string
          profile_id: string
          rate?: number
          states?: string[]
          updated_at?: string
          vendor_id: string
        }
        Update: {
          countries?: string[]
          created_at?: string
          free_over?: number | null
          id?: string
          is_active?: boolean
          max_days?: number
          max_weight?: number | null
          min_days?: number
          min_weight?: number | null
          name?: string
          profile_id?: string
          rate?: number
          states?: string[]
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_shipping_rates_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "vendor_shipping_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_shipping_rates_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_verifications: {
        Row: {
          business_registration_url: string | null
          contact_name: string | null
          created_at: string
          id: string
          identity_document_url: string | null
          notes: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["vendor_verification_status"]
          tax_document_url: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          business_registration_url?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          identity_document_url?: string | null
          notes?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["vendor_verification_status"]
          tax_document_url?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          business_registration_url?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          identity_document_url?: string | null
          notes?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["vendor_verification_status"]
          tax_document_url?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_verifications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_verifications_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          banner_url: string | null
          business_type: string | null
          commission_rate: number
          country: string
          created_at: string
          currency: string
          deleted_at: string | null
          description: string | null
          display_name: string
          email: string
          follower_count: number
          id: string
          legal_name: string
          logo_url: string | null
          metadata: Json
          owner_id: string
          payout_cycle: string
          phone: string | null
          product_count: number
          rating: number
          return_policy: string | null
          review_count: number
          shipping_policy: string | null
          slug: string
          status: Database["public"]["Enums"]["vendor_status"]
          support_email: string | null
          support_phone: string | null
          suspended_at: string | null
          suspension_reason: string | null
          tax_id: string | null
          total_sales: number
          updated_at: string
          verification_status: Database["public"]["Enums"]["vendor_verification_status"]
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          banner_url?: string | null
          business_type?: string | null
          commission_rate?: number
          country?: string
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          display_name: string
          email: string
          follower_count?: number
          id?: string
          legal_name: string
          logo_url?: string | null
          metadata?: Json
          owner_id: string
          payout_cycle?: string
          phone?: string | null
          product_count?: number
          rating?: number
          return_policy?: string | null
          review_count?: number
          shipping_policy?: string | null
          slug: string
          status?: Database["public"]["Enums"]["vendor_status"]
          support_email?: string | null
          support_phone?: string | null
          suspended_at?: string | null
          suspension_reason?: string | null
          tax_id?: string | null
          total_sales?: number
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["vendor_verification_status"]
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          banner_url?: string | null
          business_type?: string | null
          commission_rate?: number
          country?: string
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          display_name?: string
          email?: string
          follower_count?: number
          id?: string
          legal_name?: string
          logo_url?: string | null
          metadata?: Json
          owner_id?: string
          payout_cycle?: string
          phone?: string | null
          product_count?: number
          rating?: number
          return_policy?: string | null
          review_count?: number
          shipping_policy?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["vendor_status"]
          support_email?: string | null
          support_phone?: string | null
          suspended_at?: string | null
          suspension_reason?: string | null
          tax_id?: string | null
          total_sales?: number
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["vendor_verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "vendors_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_vendor_profiles: {
        Row: {
          banner_url: string | null
          country: string | null
          created_at: string | null
          description: string | null
          display_name: string | null
          id: string | null
          logo_url: string | null
          product_count: number | null
          rating: number | null
          review_count: number | null
          slug: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_access_vendor_conversation: {
        Args: { p_conversation_id: string }
        Returns: boolean
      }
      can_access_vendor_order: {
        Args: { p_order_id: string }
        Returns: boolean
      }
      check_signup_available: {
        Args: { p_email: string; p_username: string }
        Returns: Json
      }
      consumed_email_otp_request: {
        Args: { p_email: string; p_purpose: string }
        Returns: undefined
      }
      create_email_otp_request: {
        Args: {
          p_client_ip?: string
          p_email: string
          p_expires_in_seconds?: number
          p_max_resend?: number
          p_purpose: string
        }
        Returns: Json
      }
      create_phone_otp_request: {
        Args: {
          p_client_ip?: string
          p_country_code?: string
          p_device_id?: string
          p_expires_in_seconds?: number
          p_max_resend?: number
          p_phone_number: string
          p_provider?: string
          p_purpose?: string
          p_signature_nonce?: string
        }
        Returns: Json
      }
      create_vendor_application: { Args: { payload: Json }; Returns: Json }
      current_app_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      expire_stale_phone_otp_requests: {
        Args: { p_limit?: number }
        Returns: number
      }
      has_permission: { Args: { p_key: string }; Returns: boolean }
      has_vendor_permission: {
        Args: { p_permission: string; p_vendor_id: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      is_vendor_admin: { Args: { p_vendor_id: string }; Returns: boolean }
      is_vendor_member: { Args: { p_vendor_id: string }; Returns: boolean }
      log_vendor_audit: {
        Args: {
          p_action: string
          p_metadata?: Json
          p_resource?: string
          p_vendor_id: string
        }
        Returns: undefined
      }
      marketplace_commission_for: {
        Args: { p_explicit?: number; p_vendor_id: string }
        Returns: number
      }
      marketplace_public_store_exists: {
        Args: { p_store_id: string }
        Returns: boolean
      }
      marketplace_public_vendor_directory: {
        Args: never
        Returns: {
          banner_url: string
          country: string
          created_at: string
          description: string
          display_name: string
          id: string
          logo_url: string
          product_count: number
          rating: number
          review_count: number
          slug: string
        }[]
      }
      marketplace_public_vendor_exists: {
        Args: { p_vendor_id: string }
        Returns: boolean
      }
      marketplace_slugify: { Args: { p_value: string }; Returns: string }
      merge_guest_cart: { Args: { p_from_user: string }; Returns: undefined }
      pending_otp_request: {
        Args: { p_email: string; p_purpose: string }
        Returns: Json
      }
      pending_phone_otp_request: {
        Args: { p_phone_number: string; p_purpose?: string }
        Returns: Json
      }
      place_order: { Args: { payload: Json }; Returns: Json }
      process_vendor_payout: {
        Args: {
          p_notes?: string
          p_payout_id: string
          p_reference?: string
          p_status: Database["public"]["Enums"]["vendor_payout_status"]
        }
        Returns: undefined
      }
      process_vendor_return: {
        Args: {
          p_notes?: string
          p_refund_amount?: number
          p_return_id: string
          p_status: Database["public"]["Enums"]["vendor_return_status"]
        }
        Returns: undefined
      }
      request_vendor_payout: { Args: { p_vendor_id: string }; Returns: Json }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      user_has_password: { Args: { p_user_id: string }; Returns: boolean }
      validate_coupon_code: {
        Args: { p_code: string; p_subtotal: number }
        Returns: Json
      }
      verify_email_otp_request: {
        Args: {
          p_email: string
          p_error?: string
          p_max_attempts?: number
          p_purpose: string
          p_success: boolean
        }
        Returns: Json
      }
      verify_phone_otp_request: {
        Args: {
          p_block_minutes?: number
          p_error?: string
          p_max_attempts?: number
          p_phone_number: string
          p_purpose: string
          p_success: boolean
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "customer" | "guest"
      audit_status: "SUCCESS" | "FAILED"
      cart_status: "ACTIVE" | "CONVERTED" | "ABANDONED"
      cms_status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
      notification_type:
        | "ORDER"
        | "PAYMENT"
        | "SYSTEM"
        | "PROMOTION"
        | "SECURITY"
        | "REVIEW"
      order_status:
        | "PENDING"
        | "CONFIRMED"
        | "PROCESSING"
        | "PACKED"
        | "SHIPPED"
        | "DELIVERED"
        | "CANCELLED"
        | "RETURNED"
      payment_method: "COD" | "UPI" | "CARD" | "NETBANKING"
      payment_status: "PENDING" | "PAID" | "FAILED" | "REFUNDED"
      product_status: "ACTIVE" | "DRAFT" | "HIDDEN"
      review_status: "PENDING" | "APPROVED" | "REJECTED"
      txn_type: "CHARGE" | "REFUND" | "ADJUSTMENT" | "PAYOUT"
      vendor_conversation_status: "OPEN" | "PENDING" | "RESOLVED" | "CLOSED"
      vendor_fulfillment_status:
        | "PENDING"
        | "PROCESSING"
        | "PACKED"
        | "SHIPPED"
        | "DELIVERED"
        | "CANCELLED"
        | "RETURNED"
      vendor_ledger_type:
        | "SALE"
        | "COMMISSION"
        | "REFUND"
        | "ADJUSTMENT"
        | "PAYOUT"
        | "RESERVE_RELEASE"
      vendor_member_role: "OWNER" | "ADMIN" | "MANAGER" | "ANALYST" | "SUPPORT"
      vendor_message_sender: "CUSTOMER" | "VENDOR" | "STAFF" | "SYSTEM"
      vendor_payout_status:
        | "PENDING"
        | "APPROVED"
        | "PROCESSING"
        | "PAID"
        | "FAILED"
        | "CANCELLED"
      vendor_product_approval: "PENDING" | "APPROVED" | "REJECTED"
      vendor_return_status:
        | "REQUESTED"
        | "APPROVED"
        | "REJECTED"
        | "RECEIVED"
        | "REFUNDED"
        | "CLOSED"
        | "CANCELLED"
      vendor_status:
        | "PENDING"
        | "UNDER_REVIEW"
        | "APPROVED"
        | "SUSPENDED"
        | "REJECTED"
        | "CLOSED"
      vendor_store_status:
        | "DRAFT"
        | "PENDING_REVIEW"
        | "ACTIVE"
        | "SUSPENDED"
        | "CLOSED"
      vendor_verification_status:
        | "UNVERIFIED"
        | "PENDING"
        | "VERIFIED"
        | "REJECTED"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "manager", "customer", "guest"],
      audit_status: ["SUCCESS", "FAILED"],
      cart_status: ["ACTIVE", "CONVERTED", "ABANDONED"],
      cms_status: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      notification_type: [
        "ORDER",
        "PAYMENT",
        "SYSTEM",
        "PROMOTION",
        "SECURITY",
        "REVIEW",
      ],
      order_status: [
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "PACKED",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        "RETURNED",
      ],
      payment_method: ["COD", "UPI", "CARD", "NETBANKING"],
      payment_status: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      product_status: ["ACTIVE", "DRAFT", "HIDDEN"],
      review_status: ["PENDING", "APPROVED", "REJECTED"],
      txn_type: ["CHARGE", "REFUND", "ADJUSTMENT", "PAYOUT"],
      vendor_conversation_status: ["OPEN", "PENDING", "RESOLVED", "CLOSED"],
      vendor_fulfillment_status: [
        "PENDING",
        "PROCESSING",
        "PACKED",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        "RETURNED",
      ],
      vendor_ledger_type: [
        "SALE",
        "COMMISSION",
        "REFUND",
        "ADJUSTMENT",
        "PAYOUT",
        "RESERVE_RELEASE",
      ],
      vendor_member_role: ["OWNER", "ADMIN", "MANAGER", "ANALYST", "SUPPORT"],
      vendor_message_sender: ["CUSTOMER", "VENDOR", "STAFF", "SYSTEM"],
      vendor_payout_status: [
        "PENDING",
        "APPROVED",
        "PROCESSING",
        "PAID",
        "FAILED",
        "CANCELLED",
      ],
      vendor_product_approval: ["PENDING", "APPROVED", "REJECTED"],
      vendor_return_status: [
        "REQUESTED",
        "APPROVED",
        "REJECTED",
        "RECEIVED",
        "REFUNDED",
        "CLOSED",
        "CANCELLED",
      ],
      vendor_status: [
        "PENDING",
        "UNDER_REVIEW",
        "APPROVED",
        "SUSPENDED",
        "REJECTED",
        "CLOSED",
      ],
      vendor_store_status: [
        "DRAFT",
        "PENDING_REVIEW",
        "ACTIVE",
        "SUSPENDED",
        "CLOSED",
      ],
      vendor_verification_status: [
        "UNVERIFIED",
        "PENDING",
        "VERIFIED",
        "REJECTED",
      ],
    },
  },
} as const
