/**
 * TypeScript type definitions auto-generated from the Supabase schema.
 * These match the migration files exactly.
 * Note: Relationships: [] is required by Supabase's GenericTable constraint.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          sku: string
          title: string
          description: string | null
          price: number
          original_price: number | null
          material_composition: string | null
          category: string | null
          sub_category: string | null
          gender: string | null
          brand: string | null
          tags: string[]
          sizes: string[]
          colors: string[]
          image_urls: string[]
          stock_by_size: Json
          is_featured: boolean
          is_active: boolean
          vector_status: 'ACTIVE' | 'PENDING' | 'FAILED'
          ai_metadata: Json
          seller_id: string | null
          created_at: string
          updated_at: string
          fts_document: unknown | null  // tsvector, handled server-side
        }
        Insert: {
          id?: string
          sku: string
          title: string
          description?: string | null
          price: number
          original_price?: number | null
          material_composition?: string | null
          category?: string | null
          sub_category?: string | null
          gender?: string | null
          brand?: string | null
          tags?: string[]
          sizes?: string[]
          colors?: string[]
          image_urls?: string[]
          stock_by_size?: Json
          is_featured?: boolean
          is_active?: boolean
          vector_status?: 'ACTIVE' | 'PENDING' | 'FAILED'
          ai_metadata?: Json
          seller_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sku?: string
          title?: string
          description?: string | null
          price?: number
          original_price?: number | null
          material_composition?: string | null
          category?: string | null
          sub_category?: string | null
          gender?: string | null
          brand?: string | null
          tags?: string[]
          sizes?: string[]
          colors?: string[]
          image_urls?: string[]
          stock_by_size?: Json
          is_featured?: boolean
          is_active?: boolean
          vector_status?: 'ACTIVE' | 'PENDING' | 'FAILED'
          ai_metadata?: Json
          seller_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      product_embeddings: {
        Row: {
          id: string
          product_id: string
          text_embedding: number[] | null
          image_embedding: number[] | null
          combined_embedding: number[] | null
          content_hash: string | null
          model_version: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          text_embedding?: number[] | null
          image_embedding?: number[] | null
          combined_embedding?: number[] | null
          content_hash?: string | null
          model_version?: string | null
          created_at?: string
        }
        Update: {
          text_embedding?: number[] | null
          image_embedding?: number[] | null
          combined_embedding?: number[] | null
          content_hash?: string | null
          model_version?: string | null
        }
        Relationships: []
      }
      user_style_profiles: {
        Row: {
          user_id: string
          display_name: string | null
          style_tokens: string[]
          preferred_size: string | null
          budget_min: number
          budget_max: number
          preferred_colors: string[]
          preferred_categories: string[]
          onboarding_complete: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          display_name?: string | null
          style_tokens?: string[]
          preferred_size?: string | null
          budget_min?: number
          budget_max?: number
          preferred_colors?: string[]
          preferred_categories?: string[]
          onboarding_complete?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          display_name?: string | null
          style_tokens?: string[]
          preferred_size?: string | null
          budget_min?: number
          budget_max?: number
          preferred_colors?: string[]
          preferred_categories?: string[]
          onboarding_complete?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          user_id: string
          items: Json
          subtotal: number
          shipping_cost: number
          total: number
          status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
          shipping_address: Json
          tracking_number: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          items: Json
          subtotal: number
          shipping_cost?: number
          total: number
          status?: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
          shipping_address?: Json
          tracking_number?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
          tracking_number?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      chat_sessions: {
        Row: {
          id: string
          user_id: string
          title: string
          messages: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string
          messages?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          messages?: Json
          updated_at?: string
        }
        Relationships: []
      }
      user_payment_methods: {
        Row: {
          id: string
          user_id: string
          card_last4: string
          card_brand: string | null
          card_name: string
          card_expiry: string
          card_number_masked: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          card_last4: string
          card_brand?: string | null
          card_name: string
          card_expiry: string
          card_number_masked: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          card_last4?: string
          card_brand?: string | null
          card_name?: string
          card_expiry?: string
          card_number_masked?: string
          is_default?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      merchant_profiles: {
        Row: {
          user_id: string
          store_name: string
          store_email: string | null
          business_address: string | null
          phone: string | null
          tax_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          store_name: string
          store_email?: string | null
          business_address?: string | null
          phone?: string | null
          tax_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          store_name?: string
          store_email?: string | null
          business_address?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      hybrid_search: {
        Args: {
          query_embedding: number[]
          query_text: string
          match_count?: number
          semantic_weight?: number
          keyword_weight?: number
          rrf_k?: number
          filter_category?: string | null
          filter_gender?: string | null
          price_min?: number | null
          price_max?: number | null
        }
        Returns: Array<{
          product_id: string
          title: string
          sku: string
          price: number
          category: string
          tags: string[]
          image_urls: string[]
          stock_by_size: Json
          colors: string[]
          sizes: string[]
          brand: string
          description: string
          material_composition: string
          rrf_score: number
          semantic_rank: number
          keyword_rank: number
        }>
      }
      check_inventory: {
        Args: { p_sku: string }
        Returns: Array<{
          product_id: string
          title: string
          sku: string
          stock_by_size: Json
          is_active: boolean
        }>
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// ─────────────────────────────────────────────────────────────────────
// Application-level type aliases (used throughout the codebase)
// ─────────────────────────────────────────────────────────────────────

export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductEmbedding = Database['public']['Tables']['product_embeddings']['Row']
export type UserStyleProfile = Database['public']['Tables']['user_style_profiles']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type ChatSession = Database['public']['Tables']['chat_sessions']['Row']
export type MerchantProfile = Database['public']['Tables']['merchant_profiles']['Row']
export type UserPaymentMethod = Database['public']['Tables']['user_payment_methods']['Row']

export type HybridSearchResult = Database['public']['Functions']['hybrid_search']['Returns'][number]

export type StockMap = Record<string, number>  // { "S": 10, "M": 5 }

export interface OrderItem {
  product_id: string
  sku: string
  title: string
  size: string
  qty: number
  unit_price: number
  image_url: string
}

export interface ShippingAddress {
  name: string
  street: string
  city: string
  state: string
  zip: string
  country: string
}
