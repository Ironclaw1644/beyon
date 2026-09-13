export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Tables = Database['beyon']['Tables'];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
  beyon: {
    Tables: {
      announcements: {
        Row: {
          id: string;
          title: string;
          body: string;
          active: boolean;
          start_date: string | null;
          end_date: string | null;
          target_pages: string[];
          priority: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Tables['announcements']['Row']> & Pick<Tables['announcements']['Row'], 'id' | 'title' | 'body'>;
        Update: Partial<Tables['announcements']['Row']>;
        Relationships: [];
      };
      subscribers: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          phone: string | null;
          source: string;
          opted_in: boolean;
          status: string;
          unsubscribed_at: string | null;
          bounced_at: string | null;
          complaint_at: string | null;
          unsubscribe_reason: string | null;
          archived_at: string | null;
          archived_by: string | null;
          confirm_token_hash: string | null;
          confirm_token_expires_at: string | null;
          confirm_sent_at: string | null;
          confirmed_at: string | null;
          consent_source: string | null;
          consent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Tables['subscribers']['Row']> & Pick<Tables['subscribers']['Row'], 'id' | 'email' | 'source' | 'opted_in'>;
        Update: Partial<Tables['subscribers']['Row']>;
        Relationships: [];
      };
      email_events: {
        Row: {
          id: string;
          email: string;
          type: string;
          meta: Json;
          created_at: string;
        };
        Insert: Partial<Tables['email_events']['Row']>;
        Update: Partial<Tables['email_events']['Row']>;
        Relationships: [];
      };
      email_campaigns: {
        Row: {
          id: string;
          subject: string;
          preview_text: string | null;
          body: string;
          audience_source: string | null;
          idempotency_key: string;
          status: string;
          sent_at: string | null;
          total_recipients: number;
          sent_count: number;
          skipped_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Tables['email_campaigns']['Row']>;
        Update: Partial<Tables['email_campaigns']['Row']>;
        Relationships: [];
      };
      email_campaign_recipients: {
        Row: {
          id: string;
          campaign_id: string;
          email: string;
          status: string;
          reason: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: Partial<Tables['email_campaign_recipients']['Row']>;
        Update: Partial<Tables['email_campaign_recipients']['Row']>;
        Relationships: [];
      };
      rate_limit_hits: {
        Row: { id: number; bucket: string; key_hash: string; created_at: string };
        Insert: Partial<Tables['rate_limit_hits']['Row']> & Pick<Tables['rate_limit_hits']['Row'], 'bucket' | 'key_hash'>;
        Update: Partial<Tables['rate_limit_hits']['Row']>;
        Relationships: [];
      };
      lead_notes: {
        Row: { id: string; lead_id: string; note: string; created_at: string; updated_at: string };
        Insert: Partial<Tables['lead_notes']['Row']> & Pick<Tables['lead_notes']['Row'], 'id' | 'lead_id' | 'note'>;
        Update: Partial<Tables['lead_notes']['Row']>;
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          created_at: string;
          contact_name: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          company_name: string | null;
          message: string | null;
          page_path: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_term: string | null;
          utm_content: string | null;
          referrer: string | null;
          lead_type: string | null;
          status: string | null;
          forwarded_to_leadops: boolean;
          leadops_forwarded_at: string | null;
          leadops_error: string | null;
          confirmation_sent_at: string | null;
          followup_sent_at: string | null;
          last_email_error: string | null;
          admin_notified_at: string | null;
          admin_notify_error: string | null;
          archived_at: string | null;
          archived_by: string | null;
        };
        Insert: Partial<Tables['leads']['Row']>;
        Update: Partial<Tables['leads']['Row']>;
        Relationships: [];
      };
      activity_events: {
        Row: {
          id: string;
          created_at: string;
          session_id: string | null;
          event_type: string;
          page_path: string | null;
          referrer: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_term: string | null;
          utm_content: string | null;
          device: string | null;
          city: string | null;
          region: string | null;
          country: string | null;
          ip_hash: string | null;
          user_agent: string | null;
          cta_name: string | null;
          form_name: string | null;
        };
        Insert: Partial<Tables['activity_events']['Row']>;
        Update: Partial<Tables['activity_events']['Row']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type CmsSchemaName = 'beyon';
