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
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string
          id: number
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type: string
          id?: never
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string
          id?: never
        }
        Relationships: []
      }
      billing_addresses: {
        Row: {
          billing_name: string
          city: string
          company: string | null
          country: string
          country_code: string | null
          currency: string
          email: string | null
          line1: string
          line2: string | null
          phone: string | null
          postal_code: string | null
          region: string | null
          tax_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_name: string
          city: string
          company?: string | null
          country: string
          country_code?: string | null
          currency?: string
          email?: string | null
          line1: string
          line2?: string | null
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_name?: string
          city?: string
          company?: string | null
          country?: string
          country_code?: string | null
          currency?: string
          email?: string | null
          line1?: string
          line2?: string | null
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_requirements: {
        Row: {
          active: boolean
          budget_max: number | null
          budget_min: number | null
          created_at: string
          currency: string
          geographies: string[]
          id: string
          requirement: string
          sectors: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          currency?: string
          geographies?: string[]
          id?: string
          requirement: string
          sectors?: string[]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          currency?: string
          geographies?: string[]
          id?: string
          requirement?: string
          sectors?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      connections: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          intent: Database["public"]["Enums"]["connection_intent"]
          last_action_at: string | null
          last_action_by: string | null
          last_action_role: string | null
          message: string | null
          opportunity_id: string | null
          requester_id: string
          responded_at: string | null
          response_note: string | null
          status: Database["public"]["Enums"]["connection_status"]
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          intent?: Database["public"]["Enums"]["connection_intent"]
          last_action_at?: string | null
          last_action_by?: string | null
          last_action_role?: string | null
          message?: string | null
          opportunity_id?: string | null
          requester_id: string
          responded_at?: string | null
          response_note?: string | null
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          intent?: Database["public"]["Enums"]["connection_intent"]
          last_action_at?: string | null
          last_action_by?: string | null
          last_action_role?: string | null
          message?: string | null
          opportunity_id?: string | null
          requester_id?: string
          responded_at?: string | null
          response_note?: string | null
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      content_posts: {
        Row: {
          author_id: string | null
          body: string
          category: string
          created_at: string
          excerpt: string | null
          external_url: string | null
          id: string
          image_url: string | null
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body: string
          category: string
          created_at?: string
          excerpt?: string | null
          external_url?: string | null
          id?: string
          image_url?: string | null
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          category?: string
          created_at?: string
          excerpt?: string | null
          external_url?: string | null
          id?: string
          image_url?: string | null
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      deal_room_members: {
        Row: {
          added_by: string | null
          created_at: string
          deal_room_id: string
          role: string
          user_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          deal_room_id: string
          role?: string
          user_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          deal_room_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_room_members_deal_room_id_fkey"
            columns: ["deal_room_id"]
            isOneToOne: false
            referencedRelation: "deal_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_room_messages: {
        Row: {
          author_id: string
          body: string
          created_at: string
          deal_room_id: string
          id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          deal_room_id: string
          id?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          deal_room_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_room_messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_room_messages_deal_room_id_fkey"
            columns: ["deal_room_id"]
            isOneToOne: false
            referencedRelation: "deal_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_rooms: {
        Row: {
          close_note: string | null
          closed_at: string | null
          closed_by: string | null
          created_at: string
          created_by: string
          deal_currency: string | null
          deal_value: number | null
          deal_value_usd: number | null
          fx_rate_at: string | null
          fx_rate_to_usd: number | null
          id: string
          opportunity_id: string
          status: Database["public"]["Enums"]["deal_room_status"]
          success_fee_amount: number | null
          success_fee_amount_usd: number | null
          success_fee_rate: number
          updated_at: string
        }
        Insert: {
          close_note?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          created_by: string
          deal_currency?: string | null
          deal_value?: number | null
          deal_value_usd?: number | null
          fx_rate_at?: string | null
          fx_rate_to_usd?: number | null
          id?: string
          opportunity_id: string
          status?: Database["public"]["Enums"]["deal_room_status"]
          success_fee_amount?: number | null
          success_fee_amount_usd?: number | null
          success_fee_rate?: number
          updated_at?: string
        }
        Update: {
          close_note?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          created_by?: string
          deal_currency?: string | null
          deal_value?: number | null
          deal_value_usd?: number | null
          fx_rate_at?: string | null
          fx_rate_to_usd?: number | null
          id?: string
          opportunity_id?: string
          status?: Database["public"]["Enums"]["deal_room_status"]
          success_fee_amount?: number | null
          success_fee_amount_usd?: number | null
          success_fee_rate?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_rooms_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: true
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      document_access_events: {
        Row: {
          created_at: string
          document_id: string
          event_type: string
          id: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          document_id: string
          event_type: string
          id?: never
          user_id?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string
          event_type?: string
          id?: never
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_access_events_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_records"
            referencedColumns: ["id"]
          },
        ]
      }
      document_access_grants: {
        Row: {
          created_at: string
          document_id: string
          expires_at: string | null
          granted_by: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          expires_at?: string | null
          granted_by: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          expires_at?: string | null
          granted_by?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_access_grants_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_records"
            referencedColumns: ["id"]
          },
        ]
      }
      document_records: {
        Row: {
          access_scope: Database["public"]["Enums"]["document_access_scope"]
          created_at: string
          deal_room_id: string | null
          file_name: string
          id: string
          mime_type: string | null
          object_path: string
          opportunity_id: string | null
          owner_user_id: string
          purpose: string
          size_bytes: number | null
        }
        Insert: {
          access_scope?: Database["public"]["Enums"]["document_access_scope"]
          created_at?: string
          deal_room_id?: string | null
          file_name: string
          id?: string
          mime_type?: string | null
          object_path: string
          opportunity_id?: string | null
          owner_user_id: string
          purpose?: string
          size_bytes?: number | null
        }
        Update: {
          access_scope?: Database["public"]["Enums"]["document_access_scope"]
          created_at?: string
          deal_room_id?: string | null
          file_name?: string
          id?: string
          mime_type?: string | null
          object_path?: string
          opportunity_id?: string | null
          owner_user_id?: string
          purpose?: string
          size_bytes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_records_deal_room_id_fkey"
            columns: ["deal_room_id"]
            isOneToOne: false
            referencedRelation: "deal_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_records_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      expressions_of_interest: {
        Row: {
          applicant_id: string
          created_at: string
          id: string
          last_action_at: string | null
          last_action_by: string | null
          last_action_role: string | null
          message: string
          opportunity_id: string
          owner_note: string | null
          status: Database["public"]["Enums"]["eoi_status"]
          updated_at: string
        }
        Insert: {
          applicant_id: string
          created_at?: string
          id?: string
          last_action_at?: string | null
          last_action_by?: string | null
          last_action_role?: string | null
          message: string
          opportunity_id: string
          owner_note?: string | null
          status?: Database["public"]["Enums"]["eoi_status"]
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          created_at?: string
          id?: string
          last_action_at?: string | null
          last_action_by?: string | null
          last_action_role?: string | null
          message?: string
          opportunity_id?: string
          owner_note?: string | null
          status?: Database["public"]["Enums"]["eoi_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expressions_of_interest_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: []
      }
      introductions: {
        Row: {
          created_at: string
          eoi_id: string | null
          id: string
          introduced_at: string | null
          last_action_at: string | null
          last_action_by: string | null
          last_action_role: string | null
          managed_by: string | null
          meeting_at: string | null
          meeting_url: string | null
          opportunity_id: string
          recipient_id: string
          request_note: string | null
          requester_id: string
          staff_note: string | null
          status: Database["public"]["Enums"]["introduction_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          eoi_id?: string | null
          id?: string
          introduced_at?: string | null
          last_action_at?: string | null
          last_action_by?: string | null
          last_action_role?: string | null
          managed_by?: string | null
          meeting_at?: string | null
          meeting_url?: string | null
          opportunity_id: string
          recipient_id: string
          request_note?: string | null
          requester_id: string
          staff_note?: string | null
          status?: Database["public"]["Enums"]["introduction_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          eoi_id?: string | null
          id?: string
          introduced_at?: string | null
          last_action_at?: string | null
          last_action_by?: string | null
          last_action_role?: string | null
          managed_by?: string | null
          meeting_at?: string | null
          meeting_url?: string | null
          opportunity_id?: string
          recipient_id?: string
          request_note?: string | null
          requester_id?: string
          staff_note?: string | null
          status?: Database["public"]["Enums"]["introduction_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "introductions_eoi_id_fkey"
            columns: ["eoi_id"]
            isOneToOne: false
            referencedRelation: "expressions_of_interest"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "introductions_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_mandates: {
        Row: {
          active: boolean
          created_at: string
          currency: string
          geographies: string[]
          id: string
          notes: string | null
          sectors: string[]
          ticket_max: number | null
          ticket_min: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency?: string
          geographies?: string[]
          id?: string
          notes?: string | null
          sectors?: string[]
          ticket_max?: number | null
          ticket_min?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string
          geographies?: string[]
          id?: string
          notes?: string | null
          sectors?: string[]
          ticket_max?: number | null
          ticket_min?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      legal_acceptances: {
        Row: {
          accepted_at: string
          agreement_version: string
          created_at: string
          id: string
          nda_accepted: boolean
          privacy_acknowledged: boolean
          source: string
          success_fee_acknowledged: boolean
          terms_accepted: boolean
          user_agreement_accepted: boolean
          user_id: string
        }
        Insert: {
          accepted_at: string
          agreement_version: string
          created_at?: string
          id?: string
          nda_accepted?: boolean
          privacy_acknowledged?: boolean
          source?: string
          success_fee_acknowledged?: boolean
          terms_accepted?: boolean
          user_agreement_accepted?: boolean
          user_id: string
        }
        Update: {
          accepted_at?: string
          agreement_version?: string
          created_at?: string
          id?: string
          nda_accepted?: boolean
          privacy_acknowledged?: boolean
          source?: string
          success_fee_acknowledged?: boolean
          terms_accepted?: boolean
          user_agreement_accepted?: boolean
          user_id?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string
          created_by: string
          id: string
          opportunity_id: string
          rationale: string | null
          score: number
          status: Database["public"]["Enums"]["match_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          opportunity_id: string
          rationale?: string | null
          score?: number
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          opportunity_id?: string
          rationale?: string | null
          score?: number
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_types: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          name: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          name: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          name?: string
        }
        Relationships: []
      }
      memberships: {
        Row: {
          approved_by: string | null
          created_at: string
          id: string
          member_number: string | null
          membership_type_code: string
          organization_id: string | null
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
          user_id: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          id?: string
          member_number?: string | null
          membership_type_code: string
          organization_id?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          id?: string
          member_number?: string | null
          membership_type_code?: string
          organization_id?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memberships_membership_type_code_fkey"
            columns: ["membership_type_code"]
            isOneToOne: false
            referencedRelation: "membership_types"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          href: string | null
          id: string
          kind: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          kind?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          kind?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          capital_required: number | null
          capital_required_usd: number | null
          category: string | null
          city: string | null
          country: string
          country_code: string | null
          created_at: string
          currency: string
          deadline: string | null
          description: string
          fx_rate_at: string | null
          fx_rate_to_usd: number | null
          id: string
          importance: number
          intent: Database["public"]["Enums"]["listing_intent"]
          is_featured: boolean
          kind: Database["public"]["Enums"]["opportunity_kind"]
          minimum_ticket: number | null
          minimum_ticket_usd: number | null
          owner_organization_id: string | null
          owner_user_id: string
          published_at: string | null
          region: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sector: string
          status: Database["public"]["Enums"]["opportunity_status"]
          submitted_at: string | null
          summary: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          capital_required?: number | null
          capital_required_usd?: number | null
          category?: string | null
          city?: string | null
          country: string
          country_code?: string | null
          created_at?: string
          currency?: string
          deadline?: string | null
          description: string
          fx_rate_at?: string | null
          fx_rate_to_usd?: number | null
          id?: string
          importance?: number
          intent?: Database["public"]["Enums"]["listing_intent"]
          is_featured?: boolean
          kind: Database["public"]["Enums"]["opportunity_kind"]
          minimum_ticket?: number | null
          minimum_ticket_usd?: number | null
          owner_organization_id?: string | null
          owner_user_id: string
          published_at?: string | null
          region?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sector: string
          status?: Database["public"]["Enums"]["opportunity_status"]
          submitted_at?: string | null
          summary: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          capital_required?: number | null
          capital_required_usd?: number | null
          category?: string | null
          city?: string | null
          country?: string
          country_code?: string | null
          created_at?: string
          currency?: string
          deadline?: string | null
          description?: string
          fx_rate_at?: string | null
          fx_rate_to_usd?: number | null
          id?: string
          importance?: number
          intent?: Database["public"]["Enums"]["listing_intent"]
          is_featured?: boolean
          kind?: Database["public"]["Enums"]["opportunity_kind"]
          minimum_ticket?: number | null
          minimum_ticket_usd?: number | null
          owner_organization_id?: string | null
          owner_user_id?: string
          published_at?: string | null
          region?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sector?: string
          status?: Database["public"]["Enums"]["opportunity_status"]
          submitted_at?: string | null
          summary?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_owner_organization_id_fkey"
            columns: ["owner_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_status_events: {
        Row: {
          actor_id: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["opportunity_status"] | null
          id: number
          note: string | null
          opportunity_id: string
          to_status: Database["public"]["Enums"]["opportunity_status"]
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["opportunity_status"] | null
          id?: never
          note?: string | null
          opportunity_id: string
          to_status: Database["public"]["Enums"]["opportunity_status"]
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["opportunity_status"] | null
          id?: never
          note?: string | null
          opportunity_id?: string
          to_status?: Database["public"]["Enums"]["opportunity_status"]
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_status_events_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          role?: Database["public"]["Enums"]["organization_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["organization_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_verified: boolean
          name: string
          preferred_currency: string
          registration_number: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
          website: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_verified?: boolean
          name: string
          preferred_currency?: string
          registration_number?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_verified?: boolean
          name?: string
          preferred_currency?: string
          registration_number?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Relationships: []
      }
      outbound_emails: {
        Row: {
          body: string
          created_at: string
          error: string | null
          id: string
          kind: string
          related_id: string | null
          sent_at: string | null
          status: string
          subject: string
          to_email: string
          to_user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          error?: string | null
          id?: string
          kind?: string
          related_id?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          to_email: string
          to_user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          error?: string | null
          id?: string
          kind?: string
          related_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          to_email?: string
          to_user_id?: string | null
        }
        Relationships: []
      }
      outbound_pushes: {
        Row: {
          body: string | null
          created_at: string
          error: string | null
          href: string | null
          id: string
          sent_at: string | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          error?: string | null
          href?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          error?: string | null
          href?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          bank_name: string | null
          brand: string | null
          created_at: string
          exp_month: number | null
          exp_year: number | null
          holder_name: string | null
          id: string
          is_primary: boolean
          kind: Database["public"]["Enums"]["payment_method"]
          label: string | null
          last4: string | null
          momo_network: string | null
          momo_number: string | null
          provider: string
          provider_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_name?: string | null
          brand?: string | null
          created_at?: string
          exp_month?: number | null
          exp_year?: number | null
          holder_name?: string | null
          id?: string
          is_primary?: boolean
          kind: Database["public"]["Enums"]["payment_method"]
          label?: string | null
          last4?: string | null
          momo_network?: string | null
          momo_number?: string | null
          provider?: string
          provider_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_name?: string | null
          brand?: string | null
          created_at?: string
          exp_month?: number | null
          exp_year?: number | null
          holder_name?: string | null
          id?: string
          is_primary?: boolean
          kind?: Database["public"]["Enums"]["payment_method"]
          label?: string | null
          last4?: string | null
          momo_network?: string | null
          momo_number?: string | null
          provider?: string
          provider_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_user_id_fkey"
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
          billing_snapshot: Json | null
          confirmed_by: string | null
          created_at: string
          currency: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          note: string | null
          paid_at: string | null
          payment_method_id: string | null
          plan_code: string | null
          provider: string
          provider_reference: string | null
          reference: string
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          billing_snapshot?: Json | null
          confirmed_by?: string | null
          created_at?: string
          currency?: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          note?: string | null
          paid_at?: string | null
          payment_method_id?: string | null
          plan_code?: string | null
          provider?: string
          provider_reference?: string | null
          reference: string
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          billing_snapshot?: Json | null
          confirmed_by?: string | null
          created_at?: string
          currency?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          note?: string | null
          paid_at?: string | null
          payment_method_id?: string | null
          plan_code?: string | null
          provider?: string
          provider_reference?: string | null
          reference?: string
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_plan_code_fkey"
            columns: ["plan_code"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_backups: {
        Row: {
          created_at: string
          created_by: string
          id: string
          label: string
          last_restored_at: string | null
          last_restored_by: string | null
          note: string | null
          restore_count: number
          scope: string
          snapshot: Json
          status: string
          table_counts: Json
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          label: string
          last_restored_at?: string | null
          last_restored_by?: string | null
          note?: string | null
          restore_count?: number
          scope?: string
          snapshot: Json
          status?: string
          table_counts?: Json
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          label?: string
          last_restored_at?: string | null
          last_restored_by?: string | null
          note?: string | null
          restore_count?: number
          scope?: string
          snapshot?: Json
          status?: string
          table_counts?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          avatar_url: string | null
          can_post_opportunities: boolean
          can_view_opportunities: boolean
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string
          grandfathered_verified_access: boolean
          id: string
          id_number: string | null
          id_type: string | null
          job_title: string | null
          legal_agreed_at: string | null
          legal_agreement_version: string | null
          participant_type:
            | Database["public"]["Enums"]["participant_type"]
            | null
          password_change_required: boolean
          phone: string | null
          phone_country_code: string | null
          preferred_currency: string
          profile_completed: boolean
          requested_participant_type:
            | Database["public"]["Enums"]["participant_type"]
            | null
          requested_plan_code: string | null
          support_bypass_reason: string | null
          support_bypass_until: string | null
          system_role: Database["public"]["Enums"]["system_role"]
          updated_at: string
          username: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_at: string | null
          verified_by: string | null
          wtca_chapter: string | null
          wtca_membership_number: string | null
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          avatar_url?: string | null
          can_post_opportunities?: boolean
          can_view_opportunities?: boolean
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          grandfathered_verified_access?: boolean
          id: string
          id_number?: string | null
          id_type?: string | null
          job_title?: string | null
          legal_agreed_at?: string | null
          legal_agreement_version?: string | null
          participant_type?:
            | Database["public"]["Enums"]["participant_type"]
            | null
          password_change_required?: boolean
          phone?: string | null
          phone_country_code?: string | null
          preferred_currency?: string
          profile_completed?: boolean
          requested_participant_type?:
            | Database["public"]["Enums"]["participant_type"]
            | null
          requested_plan_code?: string | null
          support_bypass_reason?: string | null
          support_bypass_until?: string | null
          system_role?: Database["public"]["Enums"]["system_role"]
          updated_at?: string
          username?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          verified_by?: string | null
          wtca_chapter?: string | null
          wtca_membership_number?: string | null
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          avatar_url?: string | null
          can_post_opportunities?: boolean
          can_view_opportunities?: boolean
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          grandfathered_verified_access?: boolean
          id?: string
          id_number?: string | null
          id_type?: string | null
          job_title?: string | null
          legal_agreed_at?: string | null
          legal_agreement_version?: string | null
          participant_type?:
            | Database["public"]["Enums"]["participant_type"]
            | null
          password_change_required?: boolean
          phone?: string | null
          phone_country_code?: string | null
          preferred_currency?: string
          profile_completed?: boolean
          requested_participant_type?:
            | Database["public"]["Enums"]["participant_type"]
            | null
          requested_plan_code?: string | null
          support_bypass_reason?: string | null
          support_bypass_until?: string | null
          system_role?: Database["public"]["Enums"]["system_role"]
          updated_at?: string
          username?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          verified_by?: string | null
          wtca_chapter?: string | null
          wtca_membership_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_requested_plan_code_fkey"
            columns: ["requested_plan_code"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["code"]
          },
        ]
      }
      public_page_views_daily: {
        Row: {
          path: string
          view_date: string
          views: number
        }
        Insert: {
          path: string
          view_date?: string
          views?: number
        }
        Update: {
          path?: string
          view_date?: string
          views?: number
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      saved_opportunities: {
        Row: {
          created_at: string
          opportunity_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          opportunity_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          opportunity_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_opportunities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content_blocks: {
        Row: {
          accent: Database["public"]["Enums"]["brand_accent"]
          body: string | null
          created_at: string
          cta_href: string | null
          cta_label: string | null
          eyebrow: string | null
          heading: string
          heading_emphasis: string | null
          id: string
          image_url: string | null
          is_published: boolean
          layout: string
          page_slug: string
          secondary_cta_href: string | null
          secondary_cta_label: string | null
          section_key: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          accent?: Database["public"]["Enums"]["brand_accent"]
          body?: string | null
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          eyebrow?: string | null
          heading: string
          heading_emphasis?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          layout?: string
          page_slug: string
          secondary_cta_href?: string | null
          secondary_cta_label?: string | null
          section_key: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          accent?: Database["public"]["Enums"]["brand_accent"]
          body?: string | null
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          eyebrow?: string | null
          heading?: string
          heading_emphasis?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          layout?: string
          page_slug?: string
          secondary_cta_href?: string | null
          secondary_cta_label?: string | null
          section_key?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      site_content_items: {
        Row: {
          accent: Database["public"]["Enums"]["brand_accent"]
          block_id: string
          body: string | null
          created_at: string
          eyebrow: string | null
          heading: string
          href: string | null
          id: string
          image_alt: string | null
          image_url: string | null
          is_published: boolean
          item_key: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          accent?: Database["public"]["Enums"]["brand_accent"]
          block_id: string
          body?: string | null
          created_at?: string
          eyebrow?: string | null
          heading: string
          href?: string | null
          id?: string
          image_alt?: string | null
          image_url?: string | null
          is_published?: boolean
          item_key: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          accent?: Database["public"]["Enums"]["brand_accent"]
          block_id?: string
          body?: string | null
          created_at?: string
          eyebrow?: string | null
          heading?: string
          href?: string | null
          id?: string
          image_alt?: string | null
          image_url?: string | null
          is_published?: boolean
          item_key?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_content_items_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "site_content_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      site_nav_links: {
        Row: {
          created_at: string
          href: string
          id: string
          is_published: boolean
          label: string
          placement: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          href: string
          id?: string
          is_published?: boolean
          label: string
          placement: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          href?: string
          id?: string
          is_published?: boolean
          label?: string
          placement?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          help: string | null
          key: string
          label: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          help?: string | null
          key: string
          label: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Update: {
          help?: string | null
          key?: string
          label?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          active: boolean
          allowed_email_domains: string[]
          billing_interval: string
          code: string
          created_at: string
          description: string | null
          eligibility_note: string | null
          name: string
          price_usd: number
          requires_approval: boolean
          requires_verified_organisation: boolean
          success_fee_rate: number
          target_participant_types: string[]
          tier: number
        }
        Insert: {
          active?: boolean
          allowed_email_domains?: string[]
          billing_interval?: string
          code: string
          created_at?: string
          description?: string | null
          eligibility_note?: string | null
          name: string
          price_usd?: number
          requires_approval?: boolean
          requires_verified_organisation?: boolean
          success_fee_rate?: number
          target_participant_types?: string[]
          tier?: number
        }
        Update: {
          active?: boolean
          allowed_email_domains?: string[]
          billing_interval?: string
          code?: string
          created_at?: string
          description?: string | null
          eligibility_note?: string | null
          name?: string
          price_usd?: number
          requires_approval?: boolean
          requires_verified_organisation?: boolean
          success_fee_rate?: number
          target_participant_types?: string[]
          tier?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          approved_by: string | null
          auto_renew: boolean
          created_at: string
          ends_at: string | null
          external_reference: string | null
          id: string
          plan_code: string
          replaces_subscription_id: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          auto_renew?: boolean
          created_at?: string
          ends_at?: string | null
          external_reference?: string | null
          id?: string
          plan_code: string
          replaces_subscription_id?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_by?: string | null
          auto_renew?: boolean
          created_at?: string
          ends_at?: string | null
          external_reference?: string | null
          id?: string
          plan_code?: string
          replaces_subscription_id?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_code_fkey"
            columns: ["plan_code"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "subscriptions_replaces_subscription_id_fkey"
            columns: ["replaces_subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          support_request_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          support_request_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          support_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_support_request_id_fkey"
            columns: ["support_request_id"]
            isOneToOne: false
            referencedRelation: "support_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      support_requests: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          id: string
          priority: string
          status: Database["public"]["Enums"]["support_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          id?: string
          priority?: string
          status?: Database["public"]["Enums"]["support_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          id?: string
          priority?: string
          status?: Database["public"]["Enums"]["support_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          auto_translate: boolean
          created_at: string
          email_notifications: boolean
          introduction_updates: boolean
          language: string
          locale: string
          marketing_emails: boolean
          membership_updates: boolean
          opportunity_updates: boolean
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_translate?: boolean
          created_at?: string
          email_notifications?: boolean
          introduction_updates?: boolean
          language?: string
          locale?: string
          marketing_emails?: boolean
          membership_updates?: boolean
          opportunity_updates?: boolean
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_translate?: boolean
          created_at?: string
          email_notifications?: boolean
          introduction_updates?: boolean
          language?: string
          locale?: string
          marketing_emails?: boolean
          membership_updates?: boolean
          opportunity_updates?: boolean
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_termination_requests: {
        Row: {
          approved_by: string | null
          executed_at: string | null
          id: string
          reason: string
          request_type: string
          requested_at: string
          requested_by: string
          reviewed_at: string | null
          status: string
          target_email: string | null
          target_name: string | null
          target_user: string
        }
        Insert: {
          approved_by?: string | null
          executed_at?: string | null
          id?: string
          reason: string
          request_type: string
          requested_at?: string
          requested_by: string
          reviewed_at?: string | null
          status?: string
          target_email?: string | null
          target_name?: string | null
          target_user: string
        }
        Update: {
          approved_by?: string | null
          executed_at?: string | null
          id?: string
          reason?: string
          request_type?: string
          requested_at?: string
          requested_by?: string
          reviewed_at?: string | null
          status?: string
          target_email?: string | null
          target_name?: string | null
          target_user?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          created_at: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_note: string | null
          status: Database["public"]["Enums"]["verification_status"]
          submission_note: string | null
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_note?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          submission_note?: string | null
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_note?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          submission_note?: string | null
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_update_profile: {
        Args: {
          new_city?: string
          new_country?: string
          new_full_name: string
          new_job_title?: string
          new_phone?: string
          new_requested_participant_type?: string
          target_user: string
        }
        Returns: undefined
      }
      approve_subscription: {
        Args: { decision: string; note?: string; subscription_id: string }
        Returns: undefined
      }
      cancel_pending_subscription: { Args: never; Returns: undefined }
      close_deal_room: {
        Args: {
          closed_currency?: string
          closed_value: number
          closed_value_usd?: number
          note?: string
          rate_to_usd?: number
          room_id: string
        }
        Returns: undefined
      }
      complete_initial_password_change: {
        Args: { target_user?: string }
        Returns: undefined
      }
      complete_test_payment: {
        Args: { payment_id: string }
        Returns: undefined
      }
      confirm_payment: {
        Args: { decision: string; note?: string; payment_id: string }
        Returns: undefined
      }
      create_membership_record: {
        Args: {
          member_number?: string
          membership_status?: string
          membership_type_code: string
          target_user: string
          valid_from?: string
          valid_until?: string
        }
        Returns: string
      }
      create_platform_backup: {
        Args: { backup_label?: string; backup_note?: string }
        Returns: string
      }
      delete_platform_backup: {
        Args: { backup_id: string }
        Returns: undefined
      }
      expire_subscriptions: { Args: never; Returns: number }
      get_platform_report_metrics: { Args: never; Returns: Json }
      get_support_participant_directory: {
        Args: never
        Returns: {
          full_name: string
          id: string
        }[]
      }
      increment_public_page_view: {
        Args: { page_path: string }
        Returns: boolean
      }
      listing_owner_cards: {
        Args: { owner_ids: string[] }
        Returns: {
          avatar_url: string
          country: string
          full_name: string
          id: string
          is_verified: boolean
          job_title: string
          organisation: string
          participant_type: string
        }[]
      }
      log_platform_backup_export: {
        Args: { backup_id: string }
        Returns: undefined
      }
      member_directory: {
        Args: {
          max_rows?: number
          member_country?: string
          only_ids?: string[]
          participant?: string
          search?: string
        }
        Returns: {
          avatar_url: string
          city: string
          connection_status: string
          country: string
          full_name: string
          id: string
          is_following: boolean
          is_staff: boolean
          is_verified: boolean
          job_title: string
          organisation: string
          participant_type: string
        }[]
      }
      member_email: { Args: { target_user: string }; Returns: string }
      member_emails: {
        Args: never
        Returns: {
          email: string
          id: string
        }[]
      }
      message_member: {
        Args: {
          message_body: string
          message_href?: string
          message_title: string
          target_user: string
        }
        Returns: undefined
      }
      my_access_state: { Args: never; Returns: Json }
      payment_readiness: { Args: { target?: string }; Returns: Json }
      plan_eligibility: {
        Args: { plan: string }
        Returns: {
          eligible: boolean
          reason: string
        }[]
      }
      post_deal_room_message: {
        Args: { message_body: string; room: string }
        Returns: string
      }
      provision_account_profile: {
        Args: {
          force_password_change?: boolean
          new_account_status: string
          new_full_name: string
          new_system_role: string
          requested_type: string
          target_user: string
        }
        Returns: undefined
      }
      public_listing_facets: {
        Args: never
        Returns: {
          facet: string
          listings: number
          value: string
        }[]
      }
      public_listing_teasers: {
        Args: {
          listing_category?: string
          listing_country?: string
          listing_intent?: string
          listing_kind?: string
          listing_sector?: string
          max_rows?: number
        }
        Returns: {
          category: string
          country: string
          deadline: string
          id: string
          importance: number
          intent: string
          kind: string
          published_at: string
          region: string
          sector: string
          tags: string[]
          teaser: string
          title: string
          title_hidden: boolean
        }[]
      }
      public_verified_member_profile: {
        Args: { member_username: string }
        Returns: {
          avatar_url: string
          city: string
          country: string
          full_name: string
          id: string
          job_title: string
          participant_type: string
          username: string
          verified: boolean
        }[]
      }
      record_provider_payment: {
        Args: {
          payment_reference: string
          provider_ref: string
          succeeded: boolean
        }
        Returns: undefined
      }
      refresh_my_matches: { Args: never; Returns: number }
      registration_resume_state: {
        Args: { lookup_email: string }
        Returns: Json
      }
      rename_platform_backup: {
        Args: { backup_id: string; new_label: string; new_note?: string }
        Returns: undefined
      }
      request_connection: {
        Args: {
          addressee: string
          connection_intent?: string
          note?: string
          opportunity?: string
        }
        Returns: string
      }
      request_introduction: {
        Args: { opportunity_id: string; request_note?: string }
        Returns: string
      }
      request_membership: {
        Args: { membership_type_code: string }
        Returns: string
      }
      request_subscription: { Args: { plan_code: string }; Returns: string }
      request_user_termination: {
        Args: { reason: string; request_type: string; target_user: string }
        Returns: string
      }
      respond_to_connection: {
        Args: {
          connection_id: string
          decision: string
          response_note?: string
        }
        Returns: undefined
      }
      respond_to_deal_request: {
        Args: { deal_id: string; decision: string; response_note?: string }
        Returns: undefined
      }
      restore_platform_backup: {
        Args: {
          backup_id: string
          confirmation_text?: string
          restore_mode?: string
        }
        Returns: undefined
      }
      review_bid: {
        Args: { bid_id: string; decision: string; review_note?: string }
        Returns: undefined
      }
      review_deal_request: {
        Args: { deal_id: string; decision: string; review_note?: string }
        Returns: undefined
      }
      review_introduction: {
        Args: {
          decision: string
          introduction_id: string
          meeting_at?: string
          meeting_url?: string
          staff_note?: string
        }
        Returns: undefined
      }
      review_opportunity: {
        Args: {
          decision: string
          opportunity_id: string
          reviewer_note?: string
        }
        Returns: undefined
      }
      review_organization: {
        Args: { decision: string; organization_id: string }
        Returns: undefined
      }
      review_subscription: {
        Args: {
          decision: string
          subscription_id: string
          valid_until?: string
        }
        Returns: undefined
      }
      review_user_deletion: {
        Args: {
          confirmation_text?: string
          decision: string
          request_id: string
        }
        Returns: undefined
      }
      review_verification_request: {
        Args: { decision: string; request_id: string; reviewer_note?: string }
        Returns: undefined
      }
      send_renewal_reminders: { Args: never; Returns: number }
      session_bootstrap: { Args: never; Returns: Json }
      set_account_status: {
        Args: { new_status: string; reason?: string; target_user: string }
        Returns: undefined
      }
      set_member_subscription: {
        Args: {
          ends?: string
          new_status: string
          note?: string
          plan: string
          starts?: string
          target_user: string
        }
        Returns: string
      }
      set_participant_access: {
        Args: {
          allow_post: boolean
          allow_view: boolean
          reason?: string
          target_user: string
        }
        Returns: undefined
      }
      set_primary_payment_method: {
        Args: { method_id: string }
        Returns: undefined
      }
      set_staff_role: {
        Args: { new_role: string; target_user: string }
        Returns: undefined
      }
      set_support_bypass: {
        Args: { reason?: string; target_user: string; until_at: string }
        Returns: undefined
      }
      set_verification_status: {
        Args: { new_status: string; note?: string; target_user: string }
        Returns: undefined
      }
      submit_opportunity: {
        Args: { opportunity_id: string }
        Returns: undefined
      }
      submit_verification_request: {
        Args: { submission_note?: string }
        Returns: string
      }
      throttle: {
        Args: {
          bucket: string
          max_hits: number
          subject_hint?: string
          window_seconds: number
        }
        Returns: boolean
      }
      toggle_follow: { Args: { target_user: string }; Returns: boolean }
      update_membership_record: {
        Args: {
          member_number?: string
          membership_id: string
          membership_status: string
          valid_from?: string
          valid_until?: string
        }
        Returns: undefined
      }
      username_available: { Args: { candidate: string }; Returns: boolean }
      withdraw_bid: { Args: { bid_id: string }; Returns: undefined }
      withdraw_deal_request: { Args: { deal_id: string }; Returns: undefined }
      withdraw_opportunity: {
        Args: { opportunity_id: string }
        Returns: undefined
      }
    }
    Enums: {
      account_status: "pending" | "active" | "suspended" | "disabled"
      brand_accent: "navy" | "orange" | "teal" | "gold" | "sky" | "peach"
      connection_intent: "connect" | "invest" | "buy" | "partner"
      connection_status: "pending" | "accepted" | "declined" | "withdrawn"
      content_status: "draft" | "published" | "archived"
      deal_room_status: "active" | "closed"
      document_access_scope: "private" | "verified" | "granted"
      eoi_status:
        | "submitted"
        | "under_review"
        | "accepted"
        | "declined"
        | "withdrawn"
      introduction_status:
        | "requested"
        | "approved"
        | "introduced"
        | "meeting_scheduled"
        | "completed"
        | "declined"
      listing_intent:
        | "seeking_investment"
        | "offering_investment"
        | "offering_supply"
        | "seeking_supply"
        | "partnership"
      match_status: "suggested" | "shortlisted" | "contacted" | "dismissed"
      membership_status:
        | "pending"
        | "active"
        | "expired"
        | "suspended"
        | "cancelled"
      opportunity_kind: "investment" | "trade" | "procurement" | "partnership"
      opportunity_status:
        | "draft"
        | "submitted"
        | "in_review"
        | "changes_requested"
        | "published"
        | "paused"
        | "closed"
        | "rejected"
        | "archived"
      organization_role: "owner" | "admin" | "member"
      participant_type:
        | "investor"
        | "buyer"
        | "business"
        | "project_sponsor"
        | "wtc_association_member"
        | "wtc_accra_member"
        | "staff"
        | "institutional_partner"
      payment_method: "card" | "mobile_money" | "bank_transfer" | "invoice"
      payment_status: "pending" | "paid" | "failed" | "refunded" | "cancelled"
      subscription_status:
        | "pending"
        | "active"
        | "past_due"
        | "expired"
        | "cancelled"
        | "awaiting_approval"
      support_status: "open" | "in_progress" | "resolved" | "closed"
      system_role:
        | "user"
        | "trade_officer"
        | "verification_officer"
        | "content_manager"
        | "finance"
        | "admin"
        | "super_admin"
        | "support"
      verification_status:
        | "pending_profile"
        | "pending_review"
        | "verified"
        | "changes_requested"
        | "rejected"
        | "suspended"
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
      account_status: ["pending", "active", "suspended", "disabled"],
      brand_accent: ["navy", "orange", "teal", "gold", "sky", "peach"],
      connection_intent: ["connect", "invest", "buy", "partner"],
      connection_status: ["pending", "accepted", "declined", "withdrawn"],
      content_status: ["draft", "published", "archived"],
      deal_room_status: ["active", "closed"],
      document_access_scope: ["private", "verified", "granted"],
      eoi_status: [
        "submitted",
        "under_review",
        "accepted",
        "declined",
        "withdrawn",
      ],
      introduction_status: [
        "requested",
        "approved",
        "introduced",
        "meeting_scheduled",
        "completed",
        "declined",
      ],
      listing_intent: [
        "seeking_investment",
        "offering_investment",
        "offering_supply",
        "seeking_supply",
        "partnership",
      ],
      match_status: ["suggested", "shortlisted", "contacted", "dismissed"],
      membership_status: [
        "pending",
        "active",
        "expired",
        "suspended",
        "cancelled",
      ],
      opportunity_kind: ["investment", "trade", "procurement", "partnership"],
      opportunity_status: [
        "draft",
        "submitted",
        "in_review",
        "changes_requested",
        "published",
        "paused",
        "closed",
        "rejected",
        "archived",
      ],
      organization_role: ["owner", "admin", "member"],
      participant_type: [
        "investor",
        "buyer",
        "business",
        "project_sponsor",
        "wtc_association_member",
        "wtc_accra_member",
        "staff",
        "institutional_partner",
      ],
      payment_method: ["card", "mobile_money", "bank_transfer", "invoice"],
      payment_status: ["pending", "paid", "failed", "refunded", "cancelled"],
      subscription_status: [
        "pending",
        "active",
        "past_due",
        "expired",
        "cancelled",
        "awaiting_approval",
      ],
      support_status: ["open", "in_progress", "resolved", "closed"],
      system_role: [
        "user",
        "trade_officer",
        "verification_officer",
        "content_manager",
        "finance",
        "admin",
        "super_admin",
        "support",
      ],
      verification_status: [
        "pending_profile",
        "pending_review",
        "verified",
        "changes_requested",
        "rejected",
        "suspended",
      ],
    },
  },
} as const

export type Profile = Database['public']['Tables']['profiles']['Row']
export type VerificationRequest = Database['public']['Tables']['verification_requests']['Row']
export type SiteContentBlock = Database['public']['Tables']['site_content_blocks']['Row']
export type SiteContentItem = Database['public']['Tables']['site_content_items']['Row']
export type Opportunity = Database['public']['Tables']['opportunities']['Row']
export type ExpressionOfInterest = Database['public']['Tables']['expressions_of_interest']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row']
export type Membership = Database['public']['Tables']['memberships']['Row']
export type NotificationRow = Database['public']['Tables']['notifications']['Row']
export type ContentPost = Database['public']['Tables']['content_posts']['Row']
export type AuditEvent = Database['public']['Tables']['audit_events']['Row']
export type Organization = Database['public']['Tables']['organizations']['Row']
export type Introduction = Database['public']['Tables']['introductions']['Row']
export type MatchRow = Database['public']['Tables']['matches']['Row']
export type DocumentRecord = Database['public']['Tables']['document_records']['Row']
export type DealRoom = Database['public']['Tables']['deal_rooms']['Row']
export type Connection = Database['public']['Tables']['connections']['Row']
