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
          updated_at: string
          usage_limit: number | null
          used_count: number
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
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
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
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
        }
        Relationships: []
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
          created_at: string
          id: string
          name: string
          order_id: string
          price: number
          product_id: string | null
          quantity: number
          size: string | null
          sku: string
          total: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          order_id: string
          price: number
          product_id?: string | null
          quantity: number
          size?: string | null
          sku: string
          total: number
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          order_id?: string
          price?: number
          product_id?: string | null
          quantity?: number
          size?: string | null
          sku?: string
          total?: number
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
          best_seller: boolean
          brand_id: string | null
          category_id: string
          colors: string[]
          country: string | null
          created_at: string
          deleted_at: string | null
          description: string
          discount_percent: number
          featured: boolean
          final_price: number
          id: string
          material: string | null
          name: string
          new_arrival: boolean
          original_price: number
          rating: number
          review_count: number
          sizes: string[]
          sku: string
          slug: string
          status: Database["public"]["Enums"]["product_status"]
          stock: number
          sub_category_id: string | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          best_seller?: boolean
          brand_id?: string | null
          category_id: string
          colors?: string[]
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string
          discount_percent?: number
          featured?: boolean
          final_price: number
          id?: string
          material?: string | null
          name: string
          new_arrival?: boolean
          original_price: number
          rating?: number
          review_count?: number
          sizes?: string[]
          sku: string
          slug: string
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          sub_category_id?: string | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          best_seller?: boolean
          brand_id?: string | null
          category_id?: string
          colors?: string[]
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string
          discount_percent?: number
          featured?: boolean
          final_price?: number
          id?: string
          material?: string | null
          name?: string
          new_arrival?: boolean
          original_price?: number
          rating?: number
          review_count?: number
          sizes?: string[]
          sku?: string
          slug?: string
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          sub_category_id?: string | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
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
            foreignKeyName: "products_sub_category_id_fkey"
            columns: ["sub_category_id"]
            isOneToOne: false
            referencedRelation: "sub_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          last_login_at: string | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          last_login_at?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          username?: string | null
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
          title: string | null
          updated_at: string
          user_id: string | null
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
          title?: string | null
          updated_at?: string
          user_id?: string | null
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
          title?: string | null
          updated_at?: string
          user_id?: string | null
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
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      [_ in never]: never
    }
    Functions: {
      check_signup_available: {
        Args: { p_email: string; p_username: string }
        Returns: Json
      }
      current_app_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_permission: { Args: { p_key: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      merge_guest_cart: { Args: { p_from_user: string }; Returns: undefined }
      place_order: { Args: { payload: Json }; Returns: Json }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      validate_coupon_code: {
        Args: { p_code: string; p_subtotal: number }
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
    },
  },
} as const
