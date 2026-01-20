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
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          company_name: string | null
          plan: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          company_name?: string | null
          plan?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          company_name?: string | null
          plan?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          id: string
          user_id: string
          name: string
          aliases: string[] | null
          is_competitor: boolean
          website: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          aliases?: string[] | null
          is_competitor?: boolean
          website?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          aliases?: string[] | null
          is_competitor?: boolean
          website?: string | null
          created_at?: string
        }
        Relationships: []
      }
      queries: {
        Row: {
          id: string
          user_id: string
          query_text: string
          category: string | null
          tags: string[] | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          query_text: string
          category?: string | null
          tags?: string[] | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          query_text?: string
          category?: string | null
          tags?: string[] | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      results: {
        Row: {
          id: string
          query_id: string
          llm_provider: string
          llm_model: string
          response_text: string
          brands_mentioned: string[] | null
          brands_recommended: string[] | null
          run_at: string
        }
        Insert: {
          id?: string
          query_id: string
          llm_provider: string
          llm_model: string
          response_text: string
          brands_mentioned?: string[] | null
          brands_recommended?: string[] | null
          run_at?: string
        }
        Update: {
          id?: string
          query_id?: string
          llm_provider?: string
          llm_model?: string
          response_text?: string
          brands_mentioned?: string[] | null
          brands_recommended?: string[] | null
          run_at?: string
        }
        Relationships: []
      }
      query_brands: {
        Row: {
          id: string
          query_id: string
          brand_id: string
        }
        Insert: {
          id?: string
          query_id: string
          brand_id: string
        }
        Update: {
          id?: string
          query_id?: string
          brand_id?: string
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

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Brand = Database['public']['Tables']['brands']['Row']
export type Query = Database['public']['Tables']['queries']['Row']
export type Result = Database['public']['Tables']['results']['Row']
export type QueryBrand = Database['public']['Tables']['query_brands']['Row']

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type BrandInsert = Database['public']['Tables']['brands']['Insert']
export type QueryInsert = Database['public']['Tables']['queries']['Insert']
export type ResultInsert = Database['public']['Tables']['results']['Insert']
export type QueryBrandInsert = Database['public']['Tables']['query_brands']['Insert']
