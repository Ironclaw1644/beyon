import { z } from 'zod';
import type { LeadSubmitPayload } from '@/lib/types';

export const topLevelLeadSchema = z.object({
  contact_name: z.string().min(1),
  contact_email: z.string().email(),
  contact_phone: z.string().min(7),
  company_name: z.string(),
  message: z.string().min(1)
});

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
