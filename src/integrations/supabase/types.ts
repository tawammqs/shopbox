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
      affiliate_payments: {
        Row: {
          affiliate_id: string
          amount: number
          created_at: string
          id: string
          notes: string | null
          paid_at: string
          paid_by: string | null
          pix_key: string | null
          store_id: string
        }
        Insert: {
          affiliate_id: string
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string
          paid_by?: string | null
          pix_key?: string | null
          store_id: string
        }
        Update: {
          affiliate_id?: string
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string
          paid_by?: string | null
          pix_key?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payments_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "store_affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_payments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_sales: {
        Row: {
          affiliate_id: string
          commission_amount: number
          commission_percent: number
          created_at: string
          customer_name: string | null
          id: string
          items: Json
          level: number
          order_id: string | null
          order_total: number
          source_affiliate_id: string | null
          status: string
          store_id: string
        }
        Insert: {
          affiliate_id: string
          commission_amount?: number
          commission_percent?: number
          created_at?: string
          customer_name?: string | null
          id?: string
          items?: Json
          level?: number
          order_id?: string | null
          order_total?: number
          source_affiliate_id?: string | null
          status?: string
          store_id: string
        }
        Update: {
          affiliate_id?: string
          commission_amount?: number
          commission_percent?: number
          created_at?: string
          customer_name?: string | null
          id?: string
          items?: Json
          level?: number
          order_id?: string | null
          order_total?: number
          source_affiliate_id?: string | null
          status?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_sales_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "store_affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_sales_source_affiliate_id_fkey"
            columns: ["source_affiliate_id"]
            isOneToOne: false
            referencedRelation: "store_affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_sales_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          active: boolean
          button_label: string | null
          button_link: string | null
          created_at: string
          desktop_url: string | null
          display_order: number
          id: string
          mobile_url: string | null
          store_id: string
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          button_label?: string | null
          button_link?: string | null
          created_at?: string
          desktop_url?: string | null
          display_order?: number
          id?: string
          mobile_url?: string | null
          store_id: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          button_label?: string | null
          button_link?: string | null
          created_at?: string
          desktop_url?: string | null
          display_order?: number
          id?: string
          mobile_url?: string | null
          store_id?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "banners_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          name: string
          parent_id: string | null
          slug: string
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          name: string
          parent_id?: string | null
          slug: string
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      combo_promotions: {
        Row: {
          active: boolean
          badge_label: string | null
          created_at: string
          discount_kind: Database["public"]["Enums"]["combo_kind"]
          discount_value: number
          id: string
          min_quantity: number
          name: string
          scope_ids: Json
          scope_type: Database["public"]["Enums"]["promo_scope"]
          store_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          badge_label?: string | null
          created_at?: string
          discount_kind: Database["public"]["Enums"]["combo_kind"]
          discount_value?: number
          id?: string
          min_quantity?: number
          name: string
          scope_ids?: Json
          scope_type?: Database["public"]["Enums"]["promo_scope"]
          store_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          badge_label?: string | null
          created_at?: string
          discount_kind?: Database["public"]["Enums"]["combo_kind"]
          discount_value?: number
          id?: string
          min_quantity?: number
          name?: string
          scope_ids?: Json
          scope_type?: Database["public"]["Enums"]["promo_scope"]
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "combo_promotions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_leads: {
        Row: {
          birthday: string | null
          coupon_code: string
          created_at: string
          email: string
          id: string
          name: string
          source: string
          store_id: string
          viewed_at: string | null
          whatsapp: string
        }
        Insert: {
          birthday?: string | null
          coupon_code?: string
          created_at?: string
          email: string
          id?: string
          name: string
          source?: string
          store_id: string
          viewed_at?: string | null
          whatsapp: string
        }
        Update: {
          birthday?: string | null
          coupon_code?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          source?: string
          store_id?: string
          viewed_at?: string | null
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_leads_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_uses: {
        Row: {
          coupon_id: string
          customer_whatsapp: string | null
          id: string
          used_at: string
        }
        Insert: {
          coupon_id: string
          customer_whatsapp?: string | null
          id?: string
          used_at?: string
        }
        Update: {
          coupon_id?: string
          customer_whatsapp?: string | null
          id?: string
          used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_uses_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          expires_at: string | null
          first_purchase_only: boolean
          id: string
          max_uses: number | null
          max_uses_per_customer: number | null
          min_cart: number
          scope_ids: Json
          scope_type: Database["public"]["Enums"]["promo_scope"]
          store_id: string
          type: Database["public"]["Enums"]["coupon_type"]
          updated_at: string
          uses_count: number
          value: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          expires_at?: string | null
          first_purchase_only?: boolean
          id?: string
          max_uses?: number | null
          max_uses_per_customer?: number | null
          min_cart?: number
          scope_ids?: Json
          scope_type?: Database["public"]["Enums"]["promo_scope"]
          store_id: string
          type: Database["public"]["Enums"]["coupon_type"]
          updated_at?: string
          uses_count?: number
          value: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          expires_at?: string | null
          first_purchase_only?: boolean
          id?: string
          max_uses?: number | null
          max_uses_per_customer?: number | null
          min_cart?: number
          scope_ids?: Json
          scope_type?: Database["public"]["Enums"]["promo_scope"]
          store_id?: string
          type?: Database["public"]["Enums"]["coupon_type"]
          updated_at?: string
          uses_count?: number
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          cep: string | null
          city_state: string | null
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          store_id: string
          updated_at: string
          whatsapp: string
        }
        Insert: {
          address?: string | null
          cep?: string | null
          city_state?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          store_id: string
          updated_at?: string
          whatsapp: string
        }
        Update: {
          address?: string | null
          cep?: string | null
          city_state?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          store_id?: string
          updated_at?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
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
      home_video_sections: {
        Row: {
          aspect: string
          created_at: string
          id: string
          is_active: boolean
          position: number
          store_id: string
          title: string
          updated_at: string
          video_type: string | null
          video_url: string | null
        }
        Insert: {
          aspect?: string
          created_at?: string
          id?: string
          is_active?: boolean
          position?: number
          store_id: string
          title?: string
          updated_at?: string
          video_type?: string | null
          video_url?: string | null
        }
        Update: {
          aspect?: string
          created_at?: string
          id?: string
          is_active?: boolean
          position?: number
          store_id?: string
          title?: string
          updated_at?: string
          video_type?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      home_video_tags: {
        Row: {
          created_at: string
          home_video_section_id: string
          id: string
          position_x: number
          position_y: number
          product_id: string
          timestamp_end: number | null
          timestamp_start: number | null
        }
        Insert: {
          created_at?: string
          home_video_section_id: string
          id?: string
          position_x?: number
          position_y?: number
          product_id: string
          timestamp_end?: number | null
          timestamp_start?: number | null
        }
        Update: {
          created_at?: string
          home_video_section_id?: string
          id?: string
          position_x?: number
          position_y?: number
          product_id?: string
          timestamp_end?: number | null
          timestamp_start?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "home_video_tags_home_video_section_id_fkey"
            columns: ["home_video_section_id"]
            isOneToOne: false
            referencedRelation: "home_video_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_video_tags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      impersonation_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          id: string
          reason: string | null
          target_store_id: string | null
          target_user_id: string
        }
        Insert: {
          action?: string
          admin_user_id: string
          created_at?: string
          id?: string
          reason?: string | null
          target_store_id?: string | null
          target_user_id: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          target_store_id?: string | null
          target_user_id?: string
        }
        Relationships: []
      }
      newsletter_leads: {
        Row: {
          created_at: string
          email: string
          id: string
          store_id: string
          viewed_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          store_id: string
          viewed_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          store_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_leads_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_at: string
          id: string
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          changed_at?: string
          id?: string
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          changed_at?: string
          id?: string
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
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
          coupon_code: string | null
          created_at: string
          customer_id: string | null
          delivery_notes: string | null
          delivery_status: string
          discount_amount: number
          id: string
          items: Json
          order_number: number
          promotion_description: string | null
          status: Database["public"]["Enums"]["order_status"]
          status_updated_at: string
          store_id: string
          subtotal: number
          total: number
          tracking_code: string | null
          tracking_url: string | null
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          customer_id?: string | null
          delivery_notes?: string | null
          delivery_status?: string
          discount_amount?: number
          id?: string
          items?: Json
          order_number: number
          promotion_description?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          status_updated_at?: string
          store_id: string
          subtotal?: number
          total?: number
          tracking_code?: string | null
          tracking_url?: string | null
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          coupon_code?: string | null
          created_at?: string
          customer_id?: string | null
          delivery_notes?: string | null
          delivery_status?: string
          discount_amount?: number
          id?: string
          items?: Json
          order_number?: number
          promotion_description?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          status_updated_at?: string
          store_id?: string
          subtotal?: number
          total?: number
          tracking_code?: string | null
          tracking_url?: string | null
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          created_at: string
          display_order: number
          features: Json
          id: string
          max_products: number
          name: string
          price_cents: number
          slug: string
          stripe_price_id: string | null
          stripe_price_id_yearly: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_order?: number
          features?: Json
          id?: string
          max_products?: number
          name: string
          price_cents?: number
          slug: string
          stripe_price_id?: string | null
          stripe_price_id_yearly?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_order?: number
          features?: Json
          id?: string
          max_products?: number
          name?: string
          price_cents?: number
          slug?: string
          stripe_price_id?: string | null
          stripe_price_id_yearly?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_colors: {
        Row: {
          hex: string
          id: string
          name: string
          position: number
          product_id: string
        }
        Insert: {
          hex: string
          id?: string
          name: string
          position?: number
          product_id: string
        }
        Update: {
          hex?: string
          id?: string
          name?: string
          position?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_colors_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          position: number
          product_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          position?: number
          product_id: string
          url: string
        }
        Update: {
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
      product_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          created_at: string
          customer_name: string
          customer_whatsapp: string | null
          id: string
          product_id: string
          question: string
          status: Database["public"]["Enums"]["question_status"]
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          created_at?: string
          customer_name: string
          customer_whatsapp?: string | null
          id?: string
          product_id: string
          question: string
          status?: Database["public"]["Enums"]["question_status"]
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          created_at?: string
          customer_name?: string
          customer_whatsapp?: string | null
          id?: string
          product_id?: string
          question?: string
          status?: Database["public"]["Enums"]["question_status"]
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_questions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          created_at: string
          customer_name: string
          customer_whatsapp: string | null
          id: string
          photo_url: string | null
          product_id: string
          rating: number
          status: Database["public"]["Enums"]["review_status"]
          text: string | null
          viewed_at: string | null
        }
        Insert: {
          created_at?: string
          customer_name: string
          customer_whatsapp?: string | null
          id?: string
          photo_url?: string | null
          product_id: string
          rating: number
          status?: Database["public"]["Enums"]["review_status"]
          text?: string | null
          viewed_at?: string | null
        }
        Update: {
          created_at?: string
          customer_name?: string
          customer_whatsapp?: string | null
          id?: string
          photo_url?: string | null
          product_id?: string
          rating?: number
          status?: Database["public"]["Enums"]["review_status"]
          text?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_section_positions: {
        Row: {
          created_at: string
          id: string
          position: number
          product_id: string
          section_key: string
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          position?: number
          product_id: string
          section_key: string
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
          product_id?: string
          section_key?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_section_positions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_section_positions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_sizes: {
        Row: {
          id: string
          label: string
          position: number
          product_id: string
        }
        Insert: {
          id?: string
          label: string
          position?: number
          product_id: string
        }
        Update: {
          id?: string
          label?: string
          position?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_sizes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_stock: {
        Row: {
          color_id: string | null
          id: string
          product_id: string
          quantity: number
          size_id: string | null
        }
        Insert: {
          color_id?: string | null
          id?: string
          product_id: string
          quantity?: number
          size_id?: string | null
        }
        Update: {
          color_id?: string | null
          id?: string
          product_id?: string
          quantity?: number
          size_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_stock_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "product_colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_stock_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "product_sizes"
            referencedColumns: ["id"]
          },
        ]
      }
      product_video_testimonials: {
        Row: {
          created_at: string
          customer_name: string | null
          id: string
          kind: Database["public"]["Enums"]["video_kind"]
          position: number
          product_id: string
          quote: string | null
          rating: number
          video_url: string
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["video_kind"]
          position?: number
          product_id: string
          quote?: string | null
          rating?: number
          video_url: string
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["video_kind"]
          position?: number
          product_id?: string
          quote?: string | null
          rating?: number
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_video_testimonials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          brand: string | null
          brand_name: string | null
          category_id: string | null
          cost_price: number | null
          created_at: string
          description: string | null
          featured_sections: string[] | null
          free_shipping: boolean | null
          id: string
          is_visible: boolean | null
          low_stock_threshold: number
          meta_description: string | null
          meta_title: string | null
          on_sale: boolean | null
          price: number
          product_type: string | null
          promo_ends_at: string | null
          promo_price: number | null
          promo_starts_at: string | null
          seo_description: string | null
          seo_title: string | null
          show_price: boolean | null
          size_guide_url: string | null
          sku: string | null
          slug: string
          stock_mode: string | null
          stock_quantity: number | null
          store_id: string
          subcategory_id: string | null
          tags: Database["public"]["Enums"]["product_tag"][]
          title: string
          updated_at: string
          url_slug: string | null
          video_type: string | null
          video_url: string | null
          view_count: number
          wishlist_count: number
        }
        Insert: {
          active?: boolean
          brand?: string | null
          brand_name?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          featured_sections?: string[] | null
          free_shipping?: boolean | null
          id?: string
          is_visible?: boolean | null
          low_stock_threshold?: number
          meta_description?: string | null
          meta_title?: string | null
          on_sale?: boolean | null
          price?: number
          product_type?: string | null
          promo_ends_at?: string | null
          promo_price?: number | null
          promo_starts_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          show_price?: boolean | null
          size_guide_url?: string | null
          sku?: string | null
          slug: string
          stock_mode?: string | null
          stock_quantity?: number | null
          store_id: string
          subcategory_id?: string | null
          tags?: Database["public"]["Enums"]["product_tag"][]
          title: string
          updated_at?: string
          url_slug?: string | null
          video_type?: string | null
          video_url?: string | null
          view_count?: number
          wishlist_count?: number
        }
        Update: {
          active?: boolean
          brand?: string | null
          brand_name?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          featured_sections?: string[] | null
          free_shipping?: boolean | null
          id?: string
          is_visible?: boolean | null
          low_stock_threshold?: number
          meta_description?: string | null
          meta_title?: string | null
          on_sale?: boolean | null
          price?: number
          product_type?: string | null
          promo_ends_at?: string | null
          promo_price?: number | null
          promo_starts_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          show_price?: boolean | null
          size_guide_url?: string | null
          sku?: string | null
          slug?: string
          stock_mode?: string | null
          stock_quantity?: number | null
          store_id?: string
          subcategory_id?: string | null
          tags?: Database["public"]["Enums"]["product_tag"][]
          title?: string
          updated_at?: string
          url_slug?: string | null
          video_type?: string | null
          video_url?: string | null
          view_count?: number
          wishlist_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
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
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          active: boolean
          badge_label: string | null
          created_at: string
          ends_at: string | null
          id: string
          name: string
          scope_ids: Json
          scope_type: Database["public"]["Enums"]["promo_scope"]
          starts_at: string | null
          store_id: string
          type: Database["public"]["Enums"]["coupon_type"]
          updated_at: string
          value: number
        }
        Insert: {
          active?: boolean
          badge_label?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          name: string
          scope_ids?: Json
          scope_type?: Database["public"]["Enums"]["promo_scope"]
          starts_at?: string | null
          store_id: string
          type: Database["public"]["Enums"]["coupon_type"]
          updated_at?: string
          value: number
        }
        Update: {
          active?: boolean
          badge_label?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          name?: string
          scope_ids?: Json
          scope_type?: Database["public"]["Enums"]["promo_scope"]
          starts_at?: string | null
          store_id?: string
          type?: Database["public"]["Enums"]["coupon_type"]
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "promotions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      static_pages: {
        Row: {
          content_md: string
          created_at: string
          id: string
          slug: string
          store_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content_md?: string
          created_at?: string
          id?: string
          slug: string
          store_id: string
          title: string
          updated_at?: string
        }
        Update: {
          content_md?: string
          created_at?: string
          id?: string
          slug?: string
          store_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "static_pages_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_notify_requests: {
        Row: {
          color_id: string | null
          created_at: string
          customer_whatsapp: string
          id: string
          notified: boolean
          product_id: string
          size_id: string | null
        }
        Insert: {
          color_id?: string | null
          created_at?: string
          customer_whatsapp: string
          id?: string
          notified?: boolean
          product_id: string
          size_id?: string | null
        }
        Update: {
          color_id?: string | null
          created_at?: string
          customer_whatsapp?: string
          id?: string
          notified?: boolean
          product_id?: string
          size_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_notify_requests_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "product_colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_notify_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_notify_requests_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "product_sizes"
            referencedColumns: ["id"]
          },
        ]
      }
      store_addon_configs: {
        Row: {
          addon_key: string
          config: Json
          created_at: string
          id: string
          store_id: string
          updated_at: string
        }
        Insert: {
          addon_key: string
          config?: Json
          created_at?: string
          id?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          addon_key?: string
          config?: Json
          created_at?: string
          id?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_addon_configs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_addons: {
        Row: {
          addon_key: string
          created_at: string
          current_period_end: string | null
          id: string
          plan_tier: string | null
          status: string
          store_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          addon_key: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan_tier?: string | null
          status?: string
          store_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          addon_key?: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan_tier?: string | null
          status?: string
          store_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_addons_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_affiliates: {
        Row: {
          affiliate_slug: string
          commission_percent: number
          created_at: string
          email: string
          id: string
          name: string
          paid_commission: number
          password_hash: string
          pending_commission: number
          pix_key: string | null
          referral_commission_percent: number
          referred_by: string | null
          session_token: string | null
          status: string
          store_id: string
          whatsapp: string | null
        }
        Insert: {
          affiliate_slug: string
          commission_percent?: number
          created_at?: string
          email: string
          id?: string
          name: string
          paid_commission?: number
          password_hash: string
          pending_commission?: number
          pix_key?: string | null
          referral_commission_percent?: number
          referred_by?: string | null
          session_token?: string | null
          status?: string
          store_id: string
          whatsapp?: string | null
        }
        Update: {
          affiliate_slug?: string
          commission_percent?: number
          created_at?: string
          email?: string
          id?: string
          name?: string
          paid_commission?: number
          password_hash?: string
          pending_commission?: number
          pix_key?: string | null
          referral_commission_percent?: number
          referred_by?: string | null
          session_token?: string | null
          status?: string
          store_id?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_affiliates_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "store_affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_affiliates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_contact_info: {
        Row: {
          address: string | null
          company_name: string | null
          contact_text: string | null
          created_at: string
          id: string
          phone: string | null
          store_email: string | null
          store_id: string
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          contact_text?: string | null
          created_at?: string
          id?: string
          phone?: string | null
          store_email?: string | null
          store_id: string
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_name?: string | null
          contact_text?: string | null
          created_at?: string
          id?: string
          phone?: string | null
          store_email?: string | null
          store_id?: string
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_contact_info_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_domains: {
        Row: {
          cloudflare_hostname_id: string | null
          created_at: string
          domain: string
          id: string
          is_default: boolean
          is_primary: boolean
          ownership_verification_name: string | null
          ownership_verification_value: string | null
          ssl_status: string
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          cloudflare_hostname_id?: string | null
          created_at?: string
          domain: string
          id?: string
          is_default?: boolean
          is_primary?: boolean
          ownership_verification_name?: string | null
          ownership_verification_value?: string | null
          ssl_status?: string
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          cloudflare_hostname_id?: string | null
          created_at?: string
          domain?: string
          id?: string
          is_default?: boolean
          is_primary?: boolean
          ownership_verification_name?: string | null
          ownership_verification_value?: string | null
          ssl_status?: string
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_domains_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_filter_settings: {
        Row: {
          id: string
          show_brand: boolean
          show_price: boolean
          show_variations: boolean
          store_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          show_brand?: boolean
          show_price?: boolean
          show_variations?: boolean
          store_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          show_brand?: boolean
          show_price?: boolean
          show_variations?: boolean
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_filter_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_menu_items: {
        Row: {
          created_at: string
          id: string
          label: string
          menu_id: string
          position: number
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          menu_id: string
          position?: number
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          menu_id?: string
          position?: number
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_menu_items_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "store_menus"
            referencedColumns: ["id"]
          },
        ]
      }
      store_menus: {
        Row: {
          created_at: string
          id: string
          name: string
          store_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          store_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_menus_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_payment_settings: {
        Row: {
          cash_enabled: boolean
          created_at: string
          credit_card_enabled: boolean
          id: string
          installments_enabled: boolean
          installments_no_interest: boolean
          max_installments: number
          min_installment_value: number
          pickup_payment_enabled: boolean
          pix_discount_percent: number
          pix_enabled: boolean
          pix_key: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          cash_enabled?: boolean
          created_at?: string
          credit_card_enabled?: boolean
          id?: string
          installments_enabled?: boolean
          installments_no_interest?: boolean
          max_installments?: number
          min_installment_value?: number
          pickup_payment_enabled?: boolean
          pix_discount_percent?: number
          pix_enabled?: boolean
          pix_key?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          cash_enabled?: boolean
          created_at?: string
          credit_card_enabled?: boolean
          id?: string
          installments_enabled?: boolean
          installments_no_interest?: boolean
          max_installments?: number
          min_installment_value?: number
          pickup_payment_enabled?: boolean
          pix_discount_percent?: number
          pix_enabled?: boolean
          pix_key?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_payment_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_policies: {
        Row: {
          created_at: string
          id: string
          sobre_config: Json
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          sobre_config?: Json
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          sobre_config?: Json
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_policies_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_private_secrets: {
        Row: {
          meta_conversion_token: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          meta_conversion_token?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          meta_conversion_token?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_private_secrets_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_sales_team: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          photo_url: string | null
          position: number
          store_id: string
          updated_at: string
          whatsapp: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          photo_url?: string | null
          position?: number
          store_id: string
          updated_at?: string
          whatsapp: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          photo_url?: string | null
          position?: number
          store_id?: string
          updated_at?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_sales_team_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_social_links: {
        Row: {
          blog_url: string | null
          facebook_url: string | null
          id: string
          instagram_token: string | null
          instagram_username: string | null
          pinterest_tag: string | null
          pinterest_url: string | null
          store_id: string
          tiktok_username: string | null
          twitter_username: string | null
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          blog_url?: string | null
          facebook_url?: string | null
          id?: string
          instagram_token?: string | null
          instagram_username?: string | null
          pinterest_tag?: string | null
          pinterest_url?: string | null
          store_id: string
          tiktok_username?: string | null
          twitter_username?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          blog_url?: string | null
          facebook_url?: string | null
          id?: string
          instagram_token?: string | null
          instagram_username?: string | null
          pinterest_tag?: string | null
          pinterest_url?: string | null
          store_id?: string
          tiktok_username?: string | null
          twitter_username?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_social_links_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_theme_settings: {
        Row: {
          active_theme_id: string | null
          customizations: Json
          id: string
          store_id: string
          updated_at: string
        }
        Insert: {
          active_theme_id?: string | null
          customizations?: Json
          id?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          active_theme_id?: string | null
          customizations?: Json
          id?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_theme_settings_active_theme_id_fkey"
            columns: ["active_theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_theme_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_owner: boolean
          name: string | null
          notifications: Json
          permissions: Json
          role: string
          store_id: string
          two_factor_enabled: boolean
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_owner?: boolean
          name?: string | null
          notifications?: Json
          permissions?: Json
          role?: string
          store_id: string
          two_factor_enabled?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_owner?: boolean
          name?: string | null
          notifications?: Json
          permissions?: Json
          role?: string
          store_id?: string
          two_factor_enabled?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_users_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_videos: {
        Row: {
          created_at: string
          id: string
          placement: string
          position: number
          product_id: string | null
          store_id: string
          thumbnail_url: string | null
          title: string | null
          updated_at: string
          video_url: string
          views_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          placement?: string
          position?: number
          product_id?: string | null
          store_id: string
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          video_url: string
          views_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          placement?: string
          position?: number
          product_id?: string | null
          store_id?: string
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          video_url?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_videos_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_videos_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_visits: {
        Row: {
          created_at: string
          device: string | null
          id: string
          path: string
          product_id: string | null
          referrer: string | null
          session_id: string | null
          store_id: string
        }
        Insert: {
          created_at?: string
          device?: string | null
          id?: string
          path: string
          product_id?: string | null
          referrer?: string | null
          session_id?: string | null
          store_id: string
        }
        Update: {
          created_at?: string
          device?: string | null
          id?: string
          path?: string
          product_id?: string | null
          referrer?: string | null
          session_id?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_visits_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_visits_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          accent_color: string
          active: boolean
          affiliate_commission_direct: number
          affiliate_commission_referrer: number
          affiliate_page_content: Json
          affiliates_enabled: boolean
          created_at: string
          current_period_end: string | null
          custom_domain: string | null
          facebook: string | null
          facebook_pixel_id: string | null
          favicon_url: string | null
          google_analytics_id: string | null
          id: string
          instagram: string | null
          login_whatsapp: string | null
          logo_url: string | null
          name: string
          notify_stock_enabled: boolean
          owner_user_id: string
          plan_id: string | null
          segment: string | null
          seo_meta: Json
          shipping_rates: Json
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          tagline: string | null
          tiktok: string | null
          trial_ends_at: string | null
          trust_badges: Json
          updated_at: string
          welcome_popup: Json
          whatsapp: string
          whatsapp_greeting: string | null
          youtube: string | null
        }
        Insert: {
          accent_color?: string
          active?: boolean
          affiliate_commission_direct?: number
          affiliate_commission_referrer?: number
          affiliate_page_content?: Json
          affiliates_enabled?: boolean
          created_at?: string
          current_period_end?: string | null
          custom_domain?: string | null
          facebook?: string | null
          facebook_pixel_id?: string | null
          favicon_url?: string | null
          google_analytics_id?: string | null
          id?: string
          instagram?: string | null
          login_whatsapp?: string | null
          logo_url?: string | null
          name: string
          notify_stock_enabled?: boolean
          owner_user_id: string
          plan_id?: string | null
          segment?: string | null
          seo_meta?: Json
          shipping_rates?: Json
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          tagline?: string | null
          tiktok?: string | null
          trial_ends_at?: string | null
          trust_badges?: Json
          updated_at?: string
          welcome_popup?: Json
          whatsapp?: string
          whatsapp_greeting?: string | null
          youtube?: string | null
        }
        Update: {
          accent_color?: string
          active?: boolean
          affiliate_commission_direct?: number
          affiliate_commission_referrer?: number
          affiliate_page_content?: Json
          affiliates_enabled?: boolean
          created_at?: string
          current_period_end?: string | null
          custom_domain?: string | null
          facebook?: string | null
          facebook_pixel_id?: string | null
          favicon_url?: string | null
          google_analytics_id?: string | null
          id?: string
          instagram?: string | null
          login_whatsapp?: string | null
          logo_url?: string | null
          name?: string
          notify_stock_enabled?: boolean
          owner_user_id?: string
          plan_id?: string | null
          segment?: string | null
          seo_meta?: Json
          shipping_rates?: Json
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          tagline?: string | null
          tiktok?: string | null
          trial_ends_at?: string | null
          trust_badges?: Json
          updated_at?: string
          welcome_popup?: Json
          whatsapp?: string
          whatsapp_greeting?: string | null
          youtube?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          created_at: string
          id: string
          payload: Json | null
          store_id: string | null
          stripe_event_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json | null
          store_id?: string | null
          stripe_event_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json | null
          store_id?: string | null
          stripe_event_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
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
      the_shoes_theme_settings: {
        Row: {
          created_at: string
          id: string
          settings: Json
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          settings?: Json
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          settings?: Json
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "the_shoes_theme_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      theme_partners: {
        Row: {
          active: boolean
          commission_percent: number
          created_at: string
          display_name: string
          email: string | null
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          commission_percent?: number
          created_at?: string
          display_name: string
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          commission_percent?: number
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      theme_purchases: {
        Row: {
          created_at: string
          id: string
          partner_commission_percent: number
          partner_earnings_cents: number
          partner_id: string | null
          platform_earnings_cents: number
          price_cents: number
          status: string
          store_id: string
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          theme_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          partner_commission_percent?: number
          partner_earnings_cents?: number
          partner_id?: string | null
          platform_earnings_cents?: number
          price_cents?: number
          status?: string
          store_id: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          theme_id: string
        }
        Update: {
          created_at?: string
          id?: string
          partner_commission_percent?: number
          partner_earnings_cents?: number
          partner_id?: string | null
          platform_earnings_cents?: number
          price_cents?: number
          status?: string
          store_id?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          theme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "theme_purchases_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "theme_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "theme_purchases_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "theme_purchases_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      themes: {
        Row: {
          carousel_urls: Json
          category: string | null
          created_at: string
          default_sections: Json
          demo_url: string | null
          description: string | null
          display_order: number
          features: Json
          id: string
          install_count: number
          is_free: boolean
          name: string
          partner_id: string | null
          preview_desktop_url: string | null
          preview_mobile_url: string | null
          price_cents: number
          rating_avg: number
          rating_count: number
          required_plan: string
          segment_tags: string[]
          slug: string
          status: Database["public"]["Enums"]["theme_status"]
          style_tags: string[]
          tagline: string | null
          tokens: Json
          updated_at: string
        }
        Insert: {
          carousel_urls?: Json
          category?: string | null
          created_at?: string
          default_sections?: Json
          demo_url?: string | null
          description?: string | null
          display_order?: number
          features?: Json
          id?: string
          install_count?: number
          is_free?: boolean
          name: string
          partner_id?: string | null
          preview_desktop_url?: string | null
          preview_mobile_url?: string | null
          price_cents?: number
          rating_avg?: number
          rating_count?: number
          required_plan?: string
          segment_tags?: string[]
          slug: string
          status?: Database["public"]["Enums"]["theme_status"]
          style_tags?: string[]
          tagline?: string | null
          tokens?: Json
          updated_at?: string
        }
        Update: {
          carousel_urls?: Json
          category?: string | null
          created_at?: string
          default_sections?: Json
          demo_url?: string | null
          description?: string | null
          display_order?: number
          features?: Json
          id?: string
          install_count?: number
          is_free?: boolean
          name?: string
          partner_id?: string | null
          preview_desktop_url?: string | null
          preview_mobile_url?: string | null
          price_cents?: number
          rating_avg?: number
          rating_count?: number
          required_plan?: string
          segment_tags?: string[]
          slug?: string
          status?: Database["public"]["Enums"]["theme_status"]
          style_tags?: string[]
          tagline?: string | null
          tokens?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "themes_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "theme_partners"
            referencedColumns: ["id"]
          },
        ]
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
      vip_group_leads: {
        Row: {
          city: string | null
          created_at: string
          id: string
          name: string | null
          source: string | null
          store_id: string | null
          viewed_at: string | null
          whatsapp: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          name?: string | null
          source?: string | null
          store_id?: string | null
          viewed_at?: string | null
          whatsapp: string
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          name?: string | null
          source?: string | null
          store_id?: string | null
          viewed_at?: string | null
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_group_leads_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      product_color_groups: {
        Row: {
          brand: string | null
          colors: string[] | null
          first_images: string[] | null
          model_name: string | null
          product_ids: string[] | null
          product_slugs: string[] | null
          store_id: string | null
          variant_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_list_users: {
        Args: { _user_ids: string[] }
        Returns: {
          created_at: string
          email: string
          id: string
        }[]
      }
      affiliate_dashboard: { Args: { _token: string }; Returns: Json }
      affiliate_login: {
        Args: { _email: string; _password: string; _store_id: string }
        Returns: Json
      }
      affiliate_name_by_slug: {
        Args: { _slug: string; _store_id: string }
        Returns: string
      }
      affiliate_public_json: {
        Args: { _a: Database["public"]["Tables"]["store_affiliates"]["Row"] }
        Returns: Json
      }
      affiliate_set_pix_key: {
        Args: { _pix_key: string; _token: string }
        Returns: Json
      }
      affiliate_slugify: { Args: { _name: string }; Returns: string }
      create_order_with_customer: {
        Args: {
          _address: string
          _cep: string
          _city_state: string
          _coupon_code: string
          _cpf: string
          _discount: number
          _email: string
          _items: Json
          _name: string
          _promotion_description: string
          _store_id: string
          _subtotal: number
          _total: number
          _whatsapp: string
        }
        Returns: {
          customer_id: string
          order_id: string
          order_number: number
        }[]
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_for_whatsapp: { Args: { _whatsapp: string }; Returns: string }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_product_view: {
        Args: { _product_id: string }
        Returns: undefined
      }
      increment_theme_installs: {
        Args: { _theme_id: string }
        Returns: undefined
      }
      is_store_owner: { Args: { _store_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      pay_affiliate: {
        Args: { _affiliate_id: string; _notes?: string }
        Returns: Json
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      register_affiliate: {
        Args: {
          _email: string
          _name: string
          _password: string
          _referred_by_slug?: string
          _store_id: string
          _whatsapp: string
        }
        Returns: Json
      }
      register_affiliate_sale: {
        Args: {
          _affiliate_slug: string
          _customer_name: string
          _items?: Json
          _order_id: string
          _order_total: number
          _store_id: string
        }
        Returns: Json
      }
      store_has_access: { Args: { p_user_id: string }; Returns: boolean }
      store_has_theme: {
        Args: { _store_id: string; _theme_id: string }
        Returns: boolean
      }
      store_id_from_product: { Args: { _product_id: string }; Returns: string }
      track_order: {
        Args: { _order_number: number; _store_id: string; _whatsapp: string }
        Returns: {
          created_at: string
          delivery_notes: string
          delivery_status: string
          items: Json
          order_number: number
          status_updated_at: string
          total: number
          tracking_code: string
          tracking_url: string
        }[]
      }
      verify_affiliate_password: {
        Args: { affiliate_id: string; password_input: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "platform_admin" | "user"
      combo_kind: "fixed_total" | "percent" | "free_n"
      coupon_type: "fixed" | "percent"
      order_status:
        | "aguardando"
        | "confirmado"
        | "enviado"
        | "entregue"
        | "cancelado"
      product_tag: "destaques" | "lancamentos" | "ofertas" | "principal"
      promo_scope: "all" | "category" | "subcategory" | "tag" | "products"
      question_status: "pending" | "answered" | "hidden"
      review_status: "pending" | "approved" | "rejected"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "incomplete"
        | "unpaid"
        | "inactive"
      theme_status: "draft" | "pending_review" | "approved" | "rejected"
      video_kind: "youtube" | "mp4"
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
  public: {
    Enums: {
      app_role: ["platform_admin", "user"],
      combo_kind: ["fixed_total", "percent", "free_n"],
      coupon_type: ["fixed", "percent"],
      order_status: [
        "aguardando",
        "confirmado",
        "enviado",
        "entregue",
        "cancelado",
      ],
      product_tag: ["destaques", "lancamentos", "ofertas", "principal"],
      promo_scope: ["all", "category", "subcategory", "tag", "products"],
      question_status: ["pending", "answered", "hidden"],
      review_status: ["pending", "approved", "rejected"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "incomplete",
        "unpaid",
        "inactive",
      ],
      theme_status: ["draft", "pending_review", "approved", "rejected"],
      video_kind: ["youtube", "mp4"],
    },
  },
} as const
