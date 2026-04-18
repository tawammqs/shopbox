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
          updated_at?: string
        }
        Relationships: []
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
      product_reviews: {
        Row: {
          created_at: string
          customer_name: string
          customer_whatsapp: string | null
          id: string
          product_id: string
          rating: number
          status: Database["public"]["Enums"]["review_status"]
          text: string | null
        }
        Insert: {
          created_at?: string
          customer_name: string
          customer_whatsapp?: string | null
          id?: string
          product_id: string
          rating: number
          status?: Database["public"]["Enums"]["review_status"]
          text?: string | null
        }
        Update: {
          created_at?: string
          customer_name?: string
          customer_whatsapp?: string | null
          id?: string
          product_id?: string
          rating?: number
          status?: Database["public"]["Enums"]["review_status"]
          text?: string | null
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
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          low_stock_threshold: number
          meta_description: string | null
          meta_title: string | null
          price: number
          promo_ends_at: string | null
          promo_price: number | null
          promo_starts_at: string | null
          size_guide_url: string | null
          sku: string | null
          slug: string
          store_id: string
          subcategory_id: string | null
          tags: Database["public"]["Enums"]["product_tag"][]
          title: string
          updated_at: string
          view_count: number
          wishlist_count: number
        }
        Insert: {
          active?: boolean
          brand?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          low_stock_threshold?: number
          meta_description?: string | null
          meta_title?: string | null
          price?: number
          promo_ends_at?: string | null
          promo_price?: number | null
          promo_starts_at?: string | null
          size_guide_url?: string | null
          sku?: string | null
          slug: string
          store_id: string
          subcategory_id?: string | null
          tags?: Database["public"]["Enums"]["product_tag"][]
          title: string
          updated_at?: string
          view_count?: number
          wishlist_count?: number
        }
        Update: {
          active?: boolean
          brand?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          low_stock_threshold?: number
          meta_description?: string | null
          meta_title?: string | null
          price?: number
          promo_ends_at?: string | null
          promo_price?: number | null
          promo_starts_at?: string | null
          size_guide_url?: string | null
          sku?: string | null
          slug?: string
          store_id?: string
          subcategory_id?: string | null
          tags?: Database["public"]["Enums"]["product_tag"][]
          title?: string
          updated_at?: string
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
      stores: {
        Row: {
          accent_color: string
          active: boolean
          created_at: string
          current_period_end: string | null
          custom_domain: string | null
          facebook: string | null
          favicon_url: string | null
          id: string
          instagram: string | null
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
          created_at?: string
          current_period_end?: string | null
          custom_domain?: string | null
          facebook?: string | null
          favicon_url?: string | null
          id?: string
          instagram?: string | null
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
          created_at?: string
          current_period_end?: string | null
          custom_domain?: string | null
          facebook?: string | null
          favicon_url?: string | null
          id?: string
          instagram?: string | null
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
      is_store_owner: { Args: { _store_id: string }; Returns: boolean }
      store_id_from_product: { Args: { _product_id: string }; Returns: string }
    }
    Enums: {
      app_role: "platform_admin" | "user"
      combo_kind: "fixed_total" | "percent" | "free_n"
      coupon_type: "fixed" | "percent"
      product_tag: "destaques" | "lancamentos" | "ofertas" | "principal"
      promo_scope: "all" | "category" | "subcategory" | "tag" | "products"
      review_status: "pending" | "approved" | "rejected"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "incomplete"
        | "unpaid"
        | "inactive"
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
      app_role: ["platform_admin", "user"],
      combo_kind: ["fixed_total", "percent", "free_n"],
      coupon_type: ["fixed", "percent"],
      product_tag: ["destaques", "lancamentos", "ofertas", "principal"],
      promo_scope: ["all", "category", "subcategory", "tag", "products"],
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
      video_kind: ["youtube", "mp4"],
    },
  },
} as const
