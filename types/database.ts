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
      expert_knowledge: {
        Row: {
          id: string
          specialist_id: string
          content_type: string
          title: string
          content: string
          tags: string[] | null
          metadata: Json | null
          is_approved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          specialist_id: string
          content_type: string
          title: string
          content: string
          tags?: string[] | null
          metadata?: Json | null
          is_approved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          specialist_id?: string
          content_type?: string
          title?: string
          content?: string
          tags?: string[] | null
          metadata?: Json | null
          is_approved?: boolean
          created_at?: string
        }
      }
      ai_recommendations: {
        Row: {
          id: string
          user_id: string
          context_type: string
          recommendation_text: string
          confidence_score: number | null
          source_knowledge_ids: string[] | null
          is_dismissed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          context_type: string
          recommendation_text: string
          confidence_score?: number | null
          source_knowledge_ids?: string[] | null
          is_dismissed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          context_type?: string
          recommendation_text?: string
          confidence_score?: number | null
          source_knowledge_ids?: string[] | null
          is_dismissed?: boolean
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          voornaam: string | null
          achternaam: string | null
          avatar_url: string | null
          type: string
          postcode: string | null
          gemeente: string | null
          geboortedatum: string | null // Dates are often strings from DB
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          voornaam?: string | null
          achternaam?: string | null
          avatar_url?: string | null
          type?: string
          postcode?: string | null
          gemeente?: string | null
          geboortedatum?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          voornaam?: string | null
          achternaam?: string | null
          avatar_url?: string | null
          type?: string
          postcode?: string | null
          gemeente?: string | null
          geboortedatum?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          type: string
          titel: string
          beschrijving: string | null
          duur: number | null
          hartslag_doel: number | null
          herhaal_patroon: string | null
          dagen_van_week: string[] | null
          metingen: string[] | null
          notities: string | null
          labels: string[] | null
          specialist_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          titel: string
          beschrijving?: string | null
          duur?: number | null
          hartslag_doel?: number | null
          herhaal_patroon?: string | null
          dagen_van_week?: string[] | null
          metingen?: string[] | null
          notities?: string | null
          labels?: string[] | null
          specialist_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          titel?: string
          beschrijving?: string | null
          duur?: number | null
          hartslag_doel?: number | null
          herhaal_patroon?: string | null
          dagen_van_week?: string[] | null
          metingen?: string[] | null
          notities?: string | null
          labels?: string[] | null
          specialist_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      task_logs: {
        Row: {
          id: string
          task_id: string
          user_id: string
          start_tijd: string // Dates are often strings from DB
          eind_tijd: string | null
          energie_voor: number | null
          energie_na: number | null
          pijn_score: number | null
          vermoeidheid_score: number | null
          stemming: string | null
          hartslag: number | null
          notitie: string | null
          ai_validatie: string | null
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          start_tijd: string
          eind_tijd?: string | null
          energie_voor?: number | null
          energie_na?: number | null
          pijn_score?: number | null
          vermoeidheid_score?: number | null
          stemming?: string | null
          hartslag?: number | null
          notitie?: string | null
          ai_validatie?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          start_tijd?: string
          eind_tijd?: string | null
          energie_voor?: number | null
          energie_na?: number | null
          pijn_score?: number | null
          vermoeidheid_score?: number | null
          stemming?: string | null
          hartslag?: number | null
          notitie?: string | null
          ai_validatie?: string | null
          created_at?: string
        }
      }
      // All database tables are now defined below
      planning: {
        Row: {
          id: string
          user_id: string
          datum: string // Date
          task_ids: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          datum: string // Date
          task_ids: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          datum?: string // Date
          task_ids?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      reflecties: {
        Row: {
          id: string
          user_id: string
          datum: string // Date
          stemming: string | null
          notitie: string | null
          ai_validatie: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          datum: string // Date
          stemming?: string | null
          notitie?: string | null
          ai_validatie?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          datum?: string // Date
          stemming?: string | null
          notitie?: string | null
          ai_validatie?: string | null
          created_at?: string
        }
      }
      specialist_patienten: {
        Row: {
          id: string
          specialist_id: string
          patient_id: string
          toegangsrechten: string[]
          created_at: string
        }
        Insert: {
          id?: string
          specialist_id: string
          patient_id: string
          toegangsrechten: string[]
          created_at?: string
        }
        Update: {
          id?: string
          specialist_id?: string
          patient_id?: string
          toegangsrechten?: string[]
          created_at?: string
        }
      }
      inzichten: {
        Row: {
          id: string
          user_id: string
          periode: string // 'dag' | 'week' | 'maand'
          trend_type: string | null
          beschrijving: string
          gegenereerd_door_ai: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          periode: string // 'dag' | 'week' | 'maand'
          trend_type?: string | null
          beschrijving: string
          gegenereerd_door_ai?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          periode?: string // 'dag' | 'week' | 'maand'
          trend_type?: string | null
          beschrijving?: string
          gegenereerd_door_ai?: boolean
          created_at?: string
        }
      }
      abonnementen: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          plan_type: string | null // 'basis' | 'premium' | 'enterprise'
          max_patienten: number | null
          verloopt_op: string | null // Date
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan_type?: string | null // 'basis' | 'premium' | 'enterprise'
          max_patienten?: number | null
          verloopt_op?: string | null // Date
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan_type?: string | null // 'basis' | 'premium' | 'enterprise'
          max_patienten?: number | null
          verloopt_op?: string | null // Date
          created_at?: string
          updated_at?: string
        }
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
