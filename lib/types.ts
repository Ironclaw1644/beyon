export type LeadSubmitPayload = {
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  company_name: string;
  message: string;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  active: boolean;
  start_date?: string;
  end_date?: string;
  target_pages: string[];
  priority: number;
  created_at: string;
  updated_at: string;
};

export type Subscriber = {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  source: string;
  opted_in: boolean;
  status: 'active' | 'unsubscribed' | 'bounced' | 'complaint';
  unsubscribed_at?: string;
  bounced_at?: string;
  complaint_at?: string;
  unsubscribe_reason?: string;
  archived_at?: string;
  archived_by?: string;
  created_at: string;
};

export type LeadNote = {
  id: string;
  leadId: string;
  note: string;
  created_at: string;
};

export type LocalLead = {
  id: string;
  created_at: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  company_name: string;
  message: string;
  page_path?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
  lead_type?: string;
  status: string;
  forwarded_to_leadops: boolean;
  leadops_forwarded_at?: string;
  leadops_error?: string;
  confirmation_sent_at?: string;
  followup_sent_at?: string;
  last_email_error?: string;
  admin_notified_at?: string;
  admin_notify_error?: string;
  archived_at?: string;
  archived_by?: string;
  notes_count?: number;
};

export type ActivityEventType = 'page_view' | 'cta_click' | 'form_submit';

export type ActivityEventPayload = {
  event_type: ActivityEventType;
  page_path?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  device?: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  city?: string;
  session_id?: string;
  cta_name?: string;
  form_name?: string;
};
