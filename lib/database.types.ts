export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id:string; full_name:string; phone:string|null; job_title:string|null; country:string|null; city:string|null; requested_participant_type:Database['public']['Enums']['participant_type']|null; participant_type:Database['public']['Enums']['participant_type']|null; verification_status:Database['public']['Enums']['verification_status']; system_role:Database['public']['Enums']['system_role']; wtca_membership_number:string|null; wtca_chapter:string|null; profile_completed:boolean; verified_at:string|null; verified_by:string|null; created_at:string; updated_at:string }
        Insert: { id:string; full_name?:string; phone?:string|null; job_title?:string|null; country?:string|null; city?:string|null; requested_participant_type?:Database['public']['Enums']['participant_type']|null; participant_type?:Database['public']['Enums']['participant_type']|null; verification_status?:Database['public']['Enums']['verification_status']; system_role?:Database['public']['Enums']['system_role']; wtca_membership_number?:string|null; wtca_chapter?:string|null; profile_completed?:boolean; verified_at?:string|null; verified_by?:string|null; created_at?:string; updated_at?:string }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
      verification_requests: {
        Row: { id:string; user_id:string; status:Database['public']['Enums']['verification_status']; submission_note:string|null; reviewer_note:string|null; submitted_at:string; reviewed_at:string|null; reviewed_by:string|null; created_at:string; updated_at:string }
        Insert: { id?:string; user_id:string; status?:Database['public']['Enums']['verification_status']; submission_note?:string|null; reviewer_note?:string|null; submitted_at?:string; reviewed_at?:string|null; reviewed_by?:string|null; created_at?:string; updated_at?:string }
        Update: Partial<Database['public']['Tables']['verification_requests']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      submit_verification_request: { Args: { submission_note?: string | null }; Returns: string }
      review_verification_request: { Args: { request_id: string; decision: string; reviewer_note?: string | null }; Returns: undefined }
    }
    Enums: {
      participant_type: 'investor'|'buyer'|'business'|'project_sponsor'|'wtc_association_member'|'wtc_accra_member'|'staff'
      system_role: 'user'|'trade_officer'|'verification_officer'|'content_manager'|'finance'|'admin'|'super_admin'
      verification_status: 'pending_profile'|'pending_review'|'verified'|'changes_requested'|'rejected'|'suspended'
    }
    CompositeTypes: Record<string, never>
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type VerificationRequest = Database['public']['Tables']['verification_requests']['Row']
