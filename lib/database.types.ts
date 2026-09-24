export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id:string; full_name:string; phone:string|null; job_title:string|null; country:string|null; city:string|null; requested_participant_type:Database['public']['Enums']['participant_type']|null; participant_type:Database['public']['Enums']['participant_type']|null; verification_status:Database['public']['Enums']['verification_status']; system_role:Database['public']['Enums']['system_role']; wtca_membership_number:string|null; wtca_chapter:string|null; profile_completed:boolean; account_status:Database['public']['Enums']['account_status']; password_change_required:boolean; can_view_opportunities:boolean; can_post_opportunities:boolean; requested_plan_code:string|null; support_bypass_until:string|null; support_bypass_reason:string|null; avatar_url:string|null; verified_at:string|null; verified_by:string|null; created_at:string; updated_at:string }
        Insert: { id:string; full_name?:string; phone?:string|null; job_title?:string|null; country?:string|null; city?:string|null; requested_participant_type?:Database['public']['Enums']['participant_type']|null; participant_type?:Database['public']['Enums']['participant_type']|null; verification_status?:Database['public']['Enums']['verification_status']; system_role?:Database['public']['Enums']['system_role']; wtca_membership_number?:string|null; wtca_chapter?:string|null; profile_completed?:boolean; account_status?:Database['public']['Enums']['account_status']; password_change_required?:boolean; can_view_opportunities?:boolean; can_post_opportunities?:boolean; requested_plan_code?:string|null; support_bypass_until?:string|null; support_bypass_reason?:string|null; avatar_url?:string|null; verified_at?:string|null; verified_by?:string|null; created_at?:string; updated_at?:string }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
      verification_requests: {
        Row: { id:string; user_id:string; status:Database['public']['Enums']['verification_status']; submission_note:string|null; reviewer_note:string|null; submitted_at:string; reviewed_at:string|null; reviewed_by:string|null; created_at:string; updated_at:string }
        Insert: { id?:string; user_id:string; status?:Database['public']['Enums']['verification_status']; submission_note?:string|null; reviewer_note?:string|null; submitted_at?:string; reviewed_at?:string|null; reviewed_by?:string|null; created_at?:string; updated_at?:string }
        Update: Partial<Database['public']['Tables']['verification_requests']['Insert']>
        Relationships: []
      }
      site_content_blocks: {
        Row: { id:string; page_slug:string; section_key:string; sort_order:number; layout:string; accent:Database['public']['Enums']['brand_accent']; eyebrow:string|null; heading:string; heading_emphasis:string|null; body:string|null; cta_label:string|null; cta_href:string|null; secondary_cta_label:string|null; secondary_cta_href:string|null; image_url:string|null; is_published:boolean; updated_by:string|null; created_at:string; updated_at:string }
        Insert: { id?:string; page_slug:string; section_key:string; sort_order?:number; layout?:string; accent?:Database['public']['Enums']['brand_accent']; eyebrow?:string|null; heading:string; heading_emphasis?:string|null; body?:string|null; cta_label?:string|null; cta_href?:string|null; secondary_cta_label?:string|null; secondary_cta_href?:string|null; image_url?:string|null; is_published?:boolean; updated_by?:string|null; created_at?:string; updated_at?:string }
        Update: Partial<Database['public']['Tables']['site_content_blocks']['Insert']>
        Relationships: []
      }
      opportunities: {
        Row: { id:string; owner_user_id:string; owner_organization_id:string|null; title:string; summary:string; description:string; sector:string; country:string; city:string|null; kind:Database['public']['Enums']['opportunity_kind']; intent:Database['public']['Enums']['listing_intent']; region:string|null; importance:number; capital_required:number|null; minimum_ticket:number|null; currency:string; deadline:string|null; tags:string[]; status:Database['public']['Enums']['opportunity_status']; is_featured:boolean; review_note:string|null; submitted_at:string|null; published_at:string|null; reviewed_at:string|null; reviewed_by:string|null; created_at:string; updated_at:string }
        Insert: { id?:string; owner_user_id:string; owner_organization_id?:string|null; title:string; summary:string; description:string; sector:string; country:string; city?:string|null; kind:Database['public']['Enums']['opportunity_kind']; intent?:Database['public']['Enums']['listing_intent']; region?:string|null; importance?:number; capital_required?:number|null; minimum_ticket?:number|null; currency?:string; deadline?:string|null; tags?:string[]; status?:Database['public']['Enums']['opportunity_status']; is_featured?:boolean; review_note?:string|null; submitted_at?:string|null; published_at?:string|null; reviewed_at?:string|null; reviewed_by?:string|null; created_at?:string; updated_at?:string }
        Update: Partial<Database['public']['Tables']['opportunities']['Insert']>
        Relationships: []
      }
      expressions_of_interest: {
        Row: { id:string; opportunity_id:string; applicant_id:string; message:string; status:Database['public']['Enums']['eoi_status']; owner_note:string|null; created_at:string; updated_at:string }
        Insert: { id?:string; opportunity_id:string; applicant_id:string; message:string; status?:Database['public']['Enums']['eoi_status']; owner_note?:string|null; created_at?:string; updated_at?:string }
        Update: Partial<Database['public']['Tables']['expressions_of_interest']['Insert']>
        Relationships: []
      }
      saved_opportunities: {
        Row: { user_id:string; opportunity_id:string; created_at:string }
        Insert: { user_id:string; opportunity_id:string; created_at?:string }
        Update: Partial<Database['public']['Tables']['saved_opportunities']['Insert']>
        Relationships: []
      }
      subscription_plans: {
        Row: { code:string; name:string; description:string|null; price_usd:number; billing_interval:string; target_participant_types:string[]; active:boolean; created_at:string; tier:number; requires_approval:boolean; allowed_email_domains:string[]; requires_verified_organisation:boolean; eligibility_note:string|null }
        Insert: { code:string; name:string; description?:string|null; price_usd?:number; billing_interval?:string; target_participant_types?:string[]; active?:boolean; created_at?:string; tier?:number; requires_approval?:boolean; allowed_email_domains?:string[]; requires_verified_organisation?:boolean; eligibility_note?:string|null }
        Update: Partial<Database['public']['Tables']['subscription_plans']['Insert']>
        Relationships: []
      }
      subscriptions: {
        Row: { id:string; user_id:string; plan_code:string; status:Database['public']['Enums']['subscription_status']; starts_at:string|null; ends_at:string|null; auto_renew:boolean; external_reference:string|null; approved_by:string|null; replaces_subscription_id:string|null; created_at:string; updated_at:string }
        Insert: { id?:string; user_id:string; plan_code:string; status?:Database['public']['Enums']['subscription_status']; starts_at?:string|null; ends_at?:string|null; auto_renew?:boolean; external_reference?:string|null; approved_by?:string|null; replaces_subscription_id?:string|null; created_at?:string; updated_at?:string }
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>
        Relationships: []
      }
      memberships: {
        Row: { id:string; membership_type_code:string; user_id:string|null; organization_id:string|null; status:Database['public']['Enums']['membership_status']; member_number:string|null; valid_from:string|null; valid_until:string|null; approved_by:string|null; created_at:string; updated_at:string }
        Insert: { id?:string; membership_type_code:string; user_id?:string|null; organization_id?:string|null; status?:Database['public']['Enums']['membership_status']; member_number?:string|null; valid_from?:string|null; valid_until?:string|null; approved_by?:string|null; created_at?:string; updated_at?:string }
        Update: Partial<Database['public']['Tables']['memberships']['Insert']>
        Relationships: []
      }
      membership_types: {
        Row: { code:string; name:string; description:string|null; active:boolean; created_at:string }
        Insert: { code:string; name:string; description?:string|null; active?:boolean; created_at?:string }
        Update: Partial<Database['public']['Tables']['membership_types']['Insert']>
        Relationships: []
      }
      notifications: {
        Row: { id:string; user_id:string; kind:string; title:string; body:string|null; href:string|null; read_at:string|null; created_at:string }
        Insert: { id?:string; user_id:string; kind?:string; title:string; body?:string|null; href?:string|null; read_at?:string|null; created_at?:string }
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
        Relationships: []
      }
      content_posts: {
        Row: { id:string; category:string; title:string; slug:string; excerpt:string|null; body:string; external_url:string|null; image_url:string|null; status:Database['public']['Enums']['content_status']; published_at:string|null; author_id:string|null; created_at:string; updated_at:string }
        Insert: { id?:string; category:string; title:string; slug:string; excerpt?:string|null; body:string; external_url?:string|null; image_url?:string|null; status?:Database['public']['Enums']['content_status']; published_at?:string|null; author_id?:string|null; created_at?:string; updated_at?:string }
        Update: Partial<Database['public']['Tables']['content_posts']['Insert']>
        Relationships: []
      }
      support_requests: {
        Row: { id:string; user_id:string; subject:string; category:string; priority:string; status:Database['public']['Enums']['support_status']; assigned_to:string|null; created_at:string; updated_at:string }
        Insert: { id?:string; user_id:string; subject:string; category?:string; priority?:string; status?:Database['public']['Enums']['support_status']; assigned_to?:string|null; created_at?:string; updated_at?:string }
        Update: Partial<Database['public']['Tables']['support_requests']['Insert']>
        Relationships: []
      }
      support_messages: {
        Row: { id:string; support_request_id:string; author_id:string; body:string; created_at:string }
        Insert: { id?:string; support_request_id:string; author_id:string; body:string; created_at?:string }
        Update: Partial<Database['public']['Tables']['support_messages']['Insert']>
        Relationships: []
      }
      user_preferences: {
        Row: { user_id:string; email_notifications:boolean; opportunity_updates:boolean; introduction_updates:boolean; membership_updates:boolean; marketing_emails:boolean; timezone:string; locale:string; created_at:string; updated_at:string }
        Insert: { user_id:string; email_notifications?:boolean; opportunity_updates?:boolean; introduction_updates?:boolean; membership_updates?:boolean; marketing_emails?:boolean; timezone?:string; locale?:string; created_at?:string; updated_at?:string }
        Update: Partial<Database['public']['Tables']['user_preferences']['Insert']>
        Relationships: []
      }
      audit_events: {
        Row: { id:number; actor_id:string|null; action:string; entity_type:string; entity_id:string|null; details:Json; created_at:string }
        Insert: { actor_id?:string|null; action:string; entity_type:string; entity_id?:string|null; details?:Json; created_at?:string }
        Update: Partial<Database['public']['Tables']['audit_events']['Insert']>
        Relationships: []
      }
      organizations: {
        Row: { id:string; name:string; registration_number:string|null; website:string|null; country:string|null; city:string|null; description:string|null; created_by:string; is_verified:boolean; verified_at:string|null; verified_by:string|null; created_at:string; updated_at:string }
        Insert: { id?:string; name:string; registration_number?:string|null; website?:string|null; country?:string|null; city?:string|null; description?:string|null; created_by:string; is_verified?:boolean; verified_at?:string|null; verified_by?:string|null; created_at?:string; updated_at?:string }
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>
        Relationships: []
      }
      organization_members: {
        Row: { organization_id:string; user_id:string; role:Database['public']['Enums']['organization_role']; created_at:string }
        Insert: { organization_id:string; user_id:string; role?:Database['public']['Enums']['organization_role']; created_at?:string }
        Update: Partial<Database['public']['Tables']['organization_members']['Insert']>
        Relationships: []
      }
      introductions: {
        Row: { id:string; opportunity_id:string; eoi_id:string|null; requester_id:string; recipient_id:string; status:Database['public']['Enums']['introduction_status']; request_note:string|null; staff_note:string|null; meeting_at:string|null; meeting_url:string|null; introduced_at:string|null; managed_by:string|null; created_at:string; updated_at:string }
        Insert: { id?:string; opportunity_id:string; eoi_id?:string|null; requester_id:string; recipient_id:string; status?:Database['public']['Enums']['introduction_status']; request_note?:string|null; staff_note?:string|null; meeting_at?:string|null; meeting_url?:string|null; introduced_at?:string|null; managed_by?:string|null; created_at?:string; updated_at?:string }
        Update: Partial<Database['public']['Tables']['introductions']['Insert']>
        Relationships: []
      }
      matches: {
        Row: { id:string; user_id:string; opportunity_id:string; created_by:string; score:number; rationale:string|null; status:Database['public']['Enums']['match_status']; created_at:string; updated_at:string }
        Insert: { id?:string; user_id:string; opportunity_id:string; created_by:string; score?:number; rationale?:string|null; status?:Database['public']['Enums']['match_status']; created_at?:string; updated_at?:string }
        Update: Partial<Database['public']['Tables']['matches']['Insert']>
        Relationships: []
      }
      investor_mandates: {
        Row: { id:string; user_id:string; title:string; sectors:string[]; geographies:string[]; ticket_min:number|null; ticket_max:number|null; currency:string; notes:string|null; active:boolean; created_at:string; updated_at:string }
        Insert: { id?:string; user_id:string; title:string; sectors?:string[]; geographies?:string[]; ticket_min?:number|null; ticket_max?:number|null; currency?:string; notes?:string|null; active?:boolean; created_at?:string; updated_at?:string }
        Update: Partial<Database['public']['Tables']['investor_mandates']['Insert']>
        Relationships: []
      }
      buyer_requirements: {
        Row: { id:string; user_id:string; title:string; sectors:string[]; geographies:string[]; requirement:string; budget_min:number|null; budget_max:number|null; currency:string; active:boolean; created_at:string; updated_at:string }
        Insert: { id?:string; user_id:string; title:string; sectors?:string[]; geographies?:string[]; requirement:string; budget_min?:number|null; budget_max?:number|null; currency?:string; active?:boolean; created_at?:string; updated_at?:string }
        Update: Partial<Database['public']['Tables']['buyer_requirements']['Insert']>
        Relationships: []
      }
      document_records: {
        Row: { id:string; owner_user_id:string; opportunity_id:string|null; deal_room_id:string|null; object_path:string; file_name:string; mime_type:string|null; size_bytes:number|null; access_scope:Database['public']['Enums']['document_access_scope']; purpose:string; created_at:string }
        Insert: { id?:string; owner_user_id:string; opportunity_id?:string|null; deal_room_id?:string|null; object_path:string; file_name:string; mime_type?:string|null; size_bytes?:number|null; access_scope?:Database['public']['Enums']['document_access_scope']; purpose?:string; created_at?:string }
        Update: Partial<Database['public']['Tables']['document_records']['Insert']>
        Relationships: []
      }
      deal_room_messages: {
        Row: { id:string; deal_room_id:string; author_id:string; body:string; created_at:string }
        Insert: { id?:string; deal_room_id:string; author_id:string; body:string; created_at?:string }
        Update: Partial<{ id:string; deal_room_id:string; author_id:string; body:string; created_at:string }>
        Relationships: []
      }
      deal_rooms: {
        Row: { id:string; opportunity_id:string; created_by:string; status:Database['public']['Enums']['deal_room_status']; created_at:string; updated_at:string }
        Insert: { id?:string; opportunity_id:string; created_by:string; status?:Database['public']['Enums']['deal_room_status']; created_at?:string; updated_at?:string }
        Update: Partial<Database['public']['Tables']['deal_rooms']['Insert']>
        Relationships: []
      }
      deal_room_members: {
        Row: { deal_room_id:string; user_id:string; role:string; added_by:string|null; created_at:string }
        Insert: { deal_room_id:string; user_id:string; role?:string; added_by?:string|null; created_at?:string }
        Update: Partial<Database['public']['Tables']['deal_room_members']['Insert']>
        Relationships: []
      }
      connections: {
        Row: { id:string; requester_id:string; addressee_id:string; opportunity_id:string|null; intent:Database['public']['Enums']['connection_intent']; status:Database['public']['Enums']['connection_status']; message:string|null; response_note:string|null; responded_at:string|null; created_at:string; updated_at:string }
        Insert: { id?:string; requester_id:string; addressee_id:string; opportunity_id?:string|null; intent?:Database['public']['Enums']['connection_intent']; status?:Database['public']['Enums']['connection_status']; message?:string|null; response_note?:string|null; responded_at?:string|null; created_at?:string; updated_at?:string }
        Update: Partial<Database['public']['Tables']['connections']['Insert']>
        Relationships: []
      }
      follows: {
        Row: { follower_id:string; following_id:string; created_at:string }
        Insert: { follower_id:string; following_id:string; created_at?:string }
        Update: Partial<Database['public']['Tables']['follows']['Insert']>
        Relationships: []
      }
      outbound_emails: {
        Row: { id:string; to_email:string; to_user_id:string|null; subject:string; body:string; kind:string; related_id:string|null; status:string; error:string|null; sent_at:string|null; created_at:string }
        Insert: { id?:string; to_email:string; to_user_id?:string|null; subject:string; body:string; kind?:string; related_id?:string|null; status?:string; error?:string|null; sent_at?:string|null; created_at?:string }
        Update: Partial<Database['public']['Tables']['outbound_emails']['Insert']>
        Relationships: []
      }
      outbound_pushes: {
        Row: { id:string; user_id:string; title:string; body:string|null; href:string|null; status:string; error:string|null; sent_at:string|null; created_at:string }
        Insert: { id?:string; user_id:string; title:string; body?:string|null; href?:string|null; status?:string; error?:string|null; sent_at?:string|null; created_at?:string }
        Update: Partial<Database['public']['Tables']['outbound_pushes']['Insert']>
        Relationships: []
      }
      push_subscriptions: {
        Row: { id:string; user_id:string; endpoint:string; p256dh:string; auth:string; user_agent:string|null; created_at:string }
        Insert: { id?:string; user_id:string; endpoint:string; p256dh:string; auth:string; user_agent?:string|null; created_at?:string }
        Update: Partial<Database['public']['Tables']['push_subscriptions']['Insert']>
        Relationships: []
      }
      document_access_events: {
        Row: { id:number; document_id:string; user_id:string|null; event_type:string; created_at:string }
        Insert: { document_id:string; user_id?:string|null; event_type:string; created_at?:string }
        Update: Partial<Database['public']['Tables']['document_access_events']['Insert']>
        Relationships: []
      }
      billing_addresses: {
        Row: { user_id:string; billing_name:string; company:string|null; tax_id:string|null; email:string|null; phone:string|null; line1:string; line2:string|null; city:string; region:string|null; postal_code:string|null; country:string; updated_at:string }
        Insert: { user_id:string; billing_name:string; company?:string|null; tax_id?:string|null; email?:string|null; phone?:string|null; line1:string; line2?:string|null; city:string; region?:string|null; postal_code?:string|null; country:string; updated_at?:string }
        Update: Partial<Database['public']['Tables']['billing_addresses']['Insert']>
        Relationships: []
      }
      payment_methods: {
        Row: { id:string; user_id:string; kind:Database['public']['Enums']['payment_method']; label:string|null; brand:string|null; last4:string|null; exp_month:number|null; exp_year:number|null; holder_name:string|null; momo_network:string|null; momo_number:string|null; bank_name:string|null; provider:string; provider_token:string|null; is_primary:boolean; created_at:string; updated_at:string }
        Insert: { id?:string; user_id:string; kind:Database['public']['Enums']['payment_method']; label?:string|null; brand?:string|null; last4?:string|null; exp_month?:number|null; exp_year?:number|null; holder_name?:string|null; momo_network?:string|null; momo_number?:string|null; bank_name?:string|null; provider?:string; provider_token?:string|null; is_primary?:boolean; created_at?:string; updated_at?:string }
        Update: Partial<Database['public']['Tables']['payment_methods']['Insert']>
        Relationships: []
      }
      payments: {
        Row: { id:string; user_id:string; subscription_id:string|null; plan_code:string|null; amount:number; currency:string; method:Database['public']['Enums']['payment_method']; provider:string; reference:string; provider_reference:string|null; status:Database['public']['Enums']['payment_status']; paid_at:string|null; confirmed_by:string|null; note:string|null; payment_method_id:string|null; billing_snapshot:Record<string, unknown>|null; created_at:string; updated_at:string }
        Insert: { id?:string; user_id:string; subscription_id?:string|null; plan_code?:string|null; amount:number; currency?:string; method:Database['public']['Enums']['payment_method']; provider?:string; reference:string; provider_reference?:string|null; status?:Database['public']['Enums']['payment_status']; paid_at?:string|null; confirmed_by?:string|null; note?:string|null; created_at?:string; updated_at?:string; payment_method_id?:string|null; billing_snapshot?:Record<string, unknown>|null }
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
        Relationships: []
      }
      site_settings: {
        Row: { key:string; value:string; label:string; help:string|null; updated_by:string|null; updated_at:string }
        Insert: { key:string; value?:string; label:string; help?:string|null; updated_by?:string|null; updated_at?:string }
        Update: Partial<Database['public']['Tables']['site_settings']['Insert']>
        Relationships: []
      }
      site_nav_links: {
        Row: { id:string; placement:string; label:string; href:string; sort_order:number; is_published:boolean; updated_by:string|null; created_at:string; updated_at:string }
        Insert: { id?:string; placement:string; label:string; href:string; sort_order?:number; is_published?:boolean; updated_by?:string|null; created_at?:string; updated_at?:string }
        Update: Partial<Database['public']['Tables']['site_nav_links']['Insert']>
        Relationships: []
      }
      site_content_items: {
        Row: { id:string; block_id:string; item_key:string; sort_order:number; eyebrow:string|null; heading:string; body:string|null; accent:Database['public']['Enums']['brand_accent']; image_url:string|null; image_alt:string|null; href:string|null; is_published:boolean; updated_by:string|null; created_at:string; updated_at:string }
        Insert: { id?:string; block_id:string; item_key:string; sort_order?:number; eyebrow?:string|null; heading:string; body?:string|null; accent?:Database['public']['Enums']['brand_accent']; image_url?:string|null; image_alt?:string|null; href?:string|null; is_published?:boolean; updated_by?:string|null; created_at?:string; updated_at?:string }
        Update: Partial<Database['public']['Tables']['site_content_items']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      submit_verification_request: { Args: { submission_note?: string | null }; Returns: string }
      review_verification_request: { Args: { request_id: string; decision: string; reviewer_note?: string | null }; Returns: undefined }
      my_access_state: { Args: Record<string, never>; Returns: Json }
      set_participant_access: { Args: { target_user: string; allow_view: boolean; allow_post: boolean; reason?: string | null }; Returns: undefined }
      set_account_status: { Args: { target_user: string; new_status: string; reason?: string | null }; Returns: undefined }
      set_staff_role: { Args: { target_user: string; new_role: string }; Returns: undefined }
      review_opportunity: { Args: { opportunity_id: string; decision: string; reviewer_note?: string | null }; Returns: undefined }
      submit_opportunity: { Args: { opportunity_id: string }; Returns: undefined }
      review_subscription: { Args: { subscription_id: string; decision: string; valid_until?: string | null }; Returns: undefined }
      request_subscription: { Args: { plan_code: string }; Returns: string }
      request_membership: { Args: { membership_type_code: string }; Returns: string }
      complete_initial_password_change: { Args: { target_user: string }; Returns: undefined }
      get_platform_report_metrics: { Args: Record<string, never>; Returns: Json }
      public_listing_teasers: { Args: { listing_kind?: string | null; listing_intent?: string | null; listing_sector?: string | null; listing_country?: string | null; max_rows?: number }; Returns: { id: string; title: string; kind: string; intent: string; sector: string; country: string; region: string | null; importance: number; teaser: string; tags: string[]; deadline: string | null; published_at: string | null; title_hidden: boolean }[] }
      public_listing_facets: { Args: Record<string, never>; Returns: { facet: string; value: string; listings: number }[] }
      withdraw_opportunity: { Args: { opportunity_id: string }; Returns: undefined }
      complete_test_payment: { Args: { payment_id: string }; Returns: undefined }
      set_verification_status: { Args: { target_user: string; new_status: string; note?: string | null }; Returns: undefined }
      message_member: { Args: { target_user: string; message_title: string; message_body: string; message_href?: string | null }; Returns: undefined }
      set_member_subscription: { Args: { target_user: string; plan: string; new_status: string; starts?: string | null; ends?: string | null; note?: string | null }; Returns: string }
      plan_eligibility: { Args: { plan: string }; Returns: { eligible: boolean; reason: string | null }[] }
      cancel_pending_subscription: { Args: Record<string, never>; Returns: undefined }
      approve_subscription: { Args: { subscription_id: string; decision: string; note?: string | null }; Returns: undefined }
      expire_subscriptions: { Args: Record<string, never>; Returns: number }
      set_support_bypass: { Args: { target_user: string; until_at: string | null; reason?: string | null }; Returns: undefined }
      member_email: { Args: { target_user: string }; Returns: string | null }
      refresh_my_matches: { Args: Record<string, never>; Returns: number }
      post_deal_room_message: { Args: { room: string; message_body: string }; Returns: string }
      withdraw_bid: { Args: { bid_id: string }; Returns: undefined }
      set_primary_payment_method: { Args: { method_id: string }; Returns: undefined }
      review_bid: { Args: { bid_id: string; decision: string; review_note?: string | null }; Returns: undefined }
      confirm_payment: { Args: { payment_id: string; decision: string; note?: string | null }; Returns: undefined }
      record_provider_payment: { Args: { payment_reference: string; provider_ref: string; succeeded: boolean }; Returns: undefined }
      request_connection: { Args: { addressee: string; connection_intent?: string; opportunity?: string | null; note?: string | null }; Returns: string }
      respond_to_connection: { Args: { connection_id: string; decision: string; response_note?: string | null }; Returns: undefined }
      toggle_follow: { Args: { target_user: string }; Returns: boolean }
      member_directory: { Args: { search?: string | null; participant?: string | null; member_country?: string | null; only_ids?: string[] | null; max_rows?: number }; Returns: { id: string; full_name: string; job_title: string | null; participant_type: string | null; country: string | null; city: string | null; organisation: string | null; is_following: boolean; connection_status: string | null; is_staff: boolean; avatar_url: string | null; is_verified: boolean }[] }
      member_emails: { Args: Record<string, never>; Returns: { id: string; email: string }[] }
      payment_readiness: { Args: { target?: string | null }; Returns: Json }
      throttle: { Args: { bucket: string; max_hits: number; window_seconds: number; subject_hint?: string | null }; Returns: boolean }
      session_bootstrap: { Args: Record<string, never>; Returns: Json }
      listing_owner_cards: { Args: { owner_ids: string[] }; Returns: { id: string; full_name: string; participant_type: string | null; country: string | null; organisation: string | null; avatar_url: string | null; job_title: string | null; is_verified: boolean }[] }
      request_introduction: { Args: { opportunity_id: string; request_note?: string | null }; Returns: string }
      review_introduction: { Args: { introduction_id: string; decision: string; staff_note?: string | null; meeting_at?: string | null; meeting_url?: string | null }; Returns: undefined }
      get_support_participant_directory: { Args: Record<string, never>; Returns: { id: string; full_name: string }[] }
    }
    Enums: {
      participant_type: 'investor'|'buyer'|'business'|'project_sponsor'|'wtc_association_member'|'wtc_accra_member'|'staff'|'institutional_partner'
      system_role: 'user'|'trade_officer'|'verification_officer'|'content_manager'|'finance'|'admin'|'super_admin'|'support'
      verification_status: 'pending_profile'|'pending_review'|'verified'|'changes_requested'|'rejected'|'suspended'
      account_status: 'pending'|'active'|'suspended'|'disabled'
      brand_accent: 'navy'|'orange'|'teal'|'gold'|'sky'|'peach'
      opportunity_kind: 'investment'|'trade'|'procurement'|'partnership'
      listing_intent: 'seeking_investment'|'offering_investment'|'offering_supply'|'seeking_supply'|'partnership'
      connection_status: 'pending'|'accepted'|'declined'|'withdrawn'
      connection_intent: 'connect'|'invest'|'buy'|'partner'
      payment_status: 'pending'|'paid'|'failed'|'refunded'|'cancelled'
      payment_method: 'card'|'mobile_money'|'bank_transfer'|'invoice'
      opportunity_status: 'draft'|'submitted'|'in_review'|'changes_requested'|'published'|'paused'|'closed'|'rejected'|'archived'
      eoi_status: 'submitted'|'under_review'|'accepted'|'declined'|'withdrawn'
      subscription_status: 'pending'|'active'|'past_due'|'expired'|'cancelled'|'awaiting_approval'
      membership_status: 'pending'|'active'|'expired'|'suspended'|'cancelled'
      content_status: 'draft'|'published'|'archived'
      support_status: 'open'|'in_progress'|'resolved'|'closed'
      organization_role: 'owner'|'admin'|'member'
      introduction_status: 'requested'|'approved'|'introduced'|'meeting_scheduled'|'completed'|'declined'
      match_status: 'suggested'|'shortlisted'|'contacted'|'dismissed'
      document_access_scope: 'private'|'verified'|'granted'
      deal_room_status: 'active'|'closed'
    }
    CompositeTypes: Record<string, never>
  }
}

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
