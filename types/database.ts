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
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          website_url: string | null
          industry: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          website_url?: string | null
          industry?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          website_url?: string | null
          industry?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_brands: {
        Row: {
          id: string
          project_id: string
          brand_id: string
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          brand_id: string
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          brand_id?: string
          is_primary?: boolean
          created_at?: string
        }
        Relationships: []
      }
      keywords: {
        Row: {
          id: string
          project_id: string
          keyword: string
          tags: string[] | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          keyword: string
          tags?: string[] | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          keyword?: string
          tags?: string[] | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      sov_snapshots: {
        Row: {
          id: string
          project_id: string
          brand_id: string
          keyword_id: string | null
          llm_provider: string
          was_mentioned: boolean
          was_recommended: boolean
          response_text: string | null
          snapshot_date: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          brand_id: string
          keyword_id?: string | null
          llm_provider: string
          was_mentioned?: boolean
          was_recommended?: boolean
          response_text?: string | null
          snapshot_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          brand_id?: string
          keyword_id?: string | null
          llm_provider?: string
          was_mentioned?: boolean
          was_recommended?: boolean
          response_text?: string | null
          snapshot_date?: string
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
export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectBrand = Database['public']['Tables']['project_brands']['Row']
export type Keyword = Database['public']['Tables']['keywords']['Row']
export type SOVSnapshot = Database['public']['Tables']['sov_snapshots']['Row']
export type Query = Database['public']['Tables']['queries']['Row']
export type Result = Database['public']['Tables']['results']['Row']

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type BrandInsert = Database['public']['Tables']['brands']['Insert']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type ProjectBrandInsert = Database['public']['Tables']['project_brands']['Insert']
export type KeywordInsert = Database['public']['Tables']['keywords']['Insert']
export type SOVSnapshotInsert = Database['public']['Tables']['sov_snapshots']['Insert']
export type QueryInsert = Database['public']['Tables']['queries']['Insert']
export type ResultInsert = Database['public']['Tables']['results']['Insert']
