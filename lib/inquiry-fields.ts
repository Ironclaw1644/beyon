import type { ExtraField, SummaryField } from '@/components/lead-form';

// Beyon Vital is a care provider on a non-HIPAA stack: forms collect contact
// details and routing information only, never health information.
export const NO_MEDICAL_NOTICE =
  'Please do not include medical details, diagnoses, medications, or other health information. We can discuss specifics by phone.';

export const SERVICE_OPTIONS = ['Residential Group Home', 'Community Engagement'];
export const WHO_FOR_OPTIONS = ['Myself', 'A family member', 'Someone I support professionally', 'Someone else'];
export const CONTACT_TIME_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Any time'];

export const subscribeField: ExtraField = {
  name: 'subscribe_updates',
  label: 'Email updates',
  type: 'checkbox',
  placeholder: 'Send me occasional updates and announcements by email (optional).'
};

export function noteField(label = 'Note (optional)', required = false): ExtraField {
  return {
    name: 'notes',
    label,
    type: 'textarea',
    required,
    minLength: required ? 10 : undefined,
    placeholder: 'Anything else you would like us to know. No medical details, please.',
    helperText: NO_MEDICAL_NOTICE
  };
}

export const inquiryExtraFields: ExtraField[] = [
  { name: 'who_for', label: 'Who is this inquiry for?', type: 'select', required: true, options: WHO_FOR_OPTIONS },
  { name: 'service_interest', label: 'Service of interest', type: 'select', required: true, options: SERVICE_OPTIONS },
  { name: 'preferred_contact_time', label: 'Preferred contact time', type: 'select', required: true, options: CONTACT_TIME_OPTIONS },
  subscribeField,
  noteField()
];

export const contactSummaryFields: SummaryField[] = [
  { name: 'contact_name', label: 'Name' },
  { name: 'contact_email', label: 'Email' },
  { name: 'contact_phone', label: 'Phone' }
];

export const inquirySummaryFields: SummaryField[] = [
  ...contactSummaryFields,
  { name: 'who_for', label: 'Inquiry For' },
  { name: 'service_interest', label: 'Service of Interest' },
  { name: 'preferred_contact_time', label: 'Preferred Contact Time' }
];
