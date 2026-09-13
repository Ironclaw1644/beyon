import { z } from 'zod';
import type { LeadSubmitPayload } from '@/lib/types';

// Upper bounds keep a scripted POST from storing (and emailing) megabytes of
// text. `message` holds the summary, the free-text note, and the meta JSON, so
// it gets the largest cap; the form's textareas are limited to 2000 characters.
export const LEAD_TEXTAREA_MAX = 2000;

export const topLevelLeadSchema = z.object({
  contact_name: z.string().trim().min(1).max(200),
  contact_email: z.string().trim().email().max(254),
  contact_phone: z.string().trim().min(7).max(40),
  company_name: z.string().max(200),
  message: z.string().min(1).max(20000)
});

const LEAD_FIELD_LABELS: Record<string, string> = {
  contact_name: 'name',
  contact_email: 'email',
  contact_phone: 'phone',
  company_name: 'company',
  message: 'message'
};

/** A short, user-facing summary of which fields failed validation. */
export function leadValidationMessage(error: z.ZodError) {
  const fields = Array.from(new Set(error.issues.map((issue) => LEAD_FIELD_LABELS[String(issue.path[0])] || 'form')));
  return `Please check your ${fields.join(', ')} and try again.`;
}

export function buildLeadMessage(summaryLines: string[], meta: Record<string, unknown>, freeText?: string) {
  const summary = summaryLines.filter(Boolean).join('\n');
  const notes = freeText?.trim() ? `\n\nNotes:\n${freeText.trim()}` : '';
  return `${summary}${notes}\n\n---meta---\n${JSON.stringify(meta)}`;
}

export function stripMetaBlock(message?: string | null) {
  const raw = String(message || '');
  return raw.split('---meta---')[0]?.trim() || '';
}

export function parseLeadMeta(message?: string | null) {
  if (!message) return null;
  const parts = message.split('---meta---');
  if (parts.length < 2) return null;
  try {
    return JSON.parse(parts[1].trim()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function assertTopLevelLead(payload: unknown): LeadSubmitPayload {
  return topLevelLeadSchema.parse(payload);
}
