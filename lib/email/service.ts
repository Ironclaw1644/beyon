import 'server-only';

import { SITE_URL } from '@/lib/utils';
import { business } from '@/lib/content';
import type { LocalLead } from '@/lib/types';
import {
  createEmailCampaign,
  finalizeEmailCampaign,
  getLocalLeadById,
  getEmailCampaignByIdempotencyKey,
  getSubscriberByEmail,
  listCampaignRecipientEmails,
  listSubscribersForBlast,
  logEmailEvent,
  markLeadAdminNotified,
  markLeadAdminNotifyError,
  markLeadEmailError,
  markLeadEmailSent,
  recordEmailCampaignRecipient,
} from '@/lib/storage';
import { createEmailToken } from '@/lib/email/tokens';
import { sendResendEmail, sleep } from '@/lib/email/resend';
import { renderLeadResponseEmail, renderMarketingEmail, renderSubscribeConfirmEmail } from '@/lib/email/template';
import { parseLeadMeta, stripMetaBlock } from '@/lib/forms';
import { formatEmailDateTime } from '@/lib/email/format';

// Resend's default team limit is 2 requests/second. Sending one message every
// 600ms keeps blasts safely under it; 429s are still retried in sendResendEmail.
const BLAST_SEND_INTERVAL_MS = 600;

// Unsubscribe links must keep working long after the send (CAN-SPAM, Gmail/Yahoo
// bulk-sender rules), so marketing tokens outlive the 30-day default.
const UNSUBSCRIBE_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 365;

function adminRecipient() {
  const value = process.env.RESEND_TO?.trim();
  if (!value) throw new Error('RESEND_TO is required');
  return value;
}

function adminNotificationRecipients() {
  const raw = process.env.RESEND_REPLY_TO?.trim();
  if (!raw) throw new Error('RESEND_REPLY_TO is required');
  const recipients = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (!recipients.length) throw new Error('RESEND_REPLY_TO does not contain any valid email addresses');
  return Array.from(new Set(recipients.map((item) => item.toLowerCase())));
}

function replyToRecipient() {
  const raw = process.env.RESEND_REPLY_TO?.trim();
  if (!raw) return business.email;
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)[0] || business.email;
}

function unsubscribeToken(email: string) {
  return encodeURIComponent(createEmailToken(email, UNSUBSCRIBE_TOKEN_TTL_SECONDS));
}

/** Human-facing confirmation page (footer link). */
function unsubscribeUrl(email: string) {
  return `${SITE_URL}/unsubscribe?token=${unsubscribeToken(email)}`;
}

/** RFC 8058 one-click endpoint + mailto fallback for bulk mail. */
function listUnsubscribeHeaders(email: string): Record<string, string> {
  const oneClick = `${SITE_URL}/api/unsubscribe?token=${unsubscribeToken(email)}`;
  const mailto = `mailto:${replyToRecipient()}?subject=unsubscribe`;
  return {
    'List-Unsubscribe': `<${oneClick}>, <${mailto}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
  };
}

function uniqEmails(input: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of input) {
    const email = raw.trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    result.push(email);
  }
  return result;
}

function parseLeadMessageForEmail(message?: string | null) {
  const summaryPart = stripMetaBlock(message);
  const lines = summaryPart
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const summaryMap = new Map<string, string>();
  let additionalNotes = '';

  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx <= 0) continue;
    const label = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!value) continue;
    const lower = label.toLowerCase();
    if (lower === 'notes' || lower === 'message') {
      if (!additionalNotes) additionalNotes = value;
      continue;
    }
    summaryMap.set(label, value);
  }

  if (!additionalNotes) {
    const notesMatch = summaryPart.match(/(?:^|\n)Notes:\s*([\s\S]*)$/i);
    if (notesMatch?.[1]) additionalNotes = notesMatch[1].trim().slice(0, 600);
  }

  return { summaryMap, additionalNotes };
}

function leadSummaryRows(lead: LocalLead) {
  const { summaryMap, additionalNotes } = parseLeadMessageForEmail(lead.message);
  parseLeadMeta(lead.message);

  const rows = [
    { label: 'Name', value: lead.contact_name || '' },
    { label: 'Email', value: lead.contact_email || '' },
    { label: 'Phone', value: lead.contact_phone || '' },
    { label: 'Request Type', value: leadTypeLabel(lead.lead_type) },
    { label: 'Service of Interest', value: summaryMap.get('Service of Interest') || '' },
    { label: 'Inquiry For', value: summaryMap.get('Inquiry For') || '' },
    { label: 'Preferred Contact Time', value: summaryMap.get('Preferred Contact Time') || '' },
    { label: 'Preferred Dates/Times', value: summaryMap.get('Preferred Dates/Times') || '' },
    { label: 'Submitted', value: formatEmailDateTime(lead.created_at) || '' },
    { label: 'Additional notes', value: additionalNotes }
  ];

  return rows.filter((row) => row.value.trim());
}

export async function buildLeadDetailEmailDraft(input: {
  leadId: string;
  type: 'confirmation' | 'followup';
  subjectOverride?: string;
  bodyOverride?: string;
  sendAgain?: boolean;
}) {
  const lead = await getLocalLeadById(input.leadId);
  if (!lead) throw new Error('Lead not found');
  if (!lead.contact_email) throw new Error('Lead does not have an email address');

  if (!input.sendAgain) {
    if (input.type === 'confirmation' && lead.confirmation_sent_at) {
      throw new Error('Confirmation was already sent for this lead');
    }
    if (input.type === 'followup' && lead.followup_sent_at) {
      throw new Error('Follow-up was already sent for this lead');
    }
  }

  const subscriber = await getSubscriberByEmail(lead.contact_email);
  if (subscriber && subscriber.status !== 'active') {
    throw new Error('Email blocked — this contact is unsubscribed or suppressed');
  }

  const defaultSubject =
    input.type === 'confirmation'
      ? `${leadTypeLabel(lead.lead_type)} Received`
      : `Following up on your ${leadTypeLabel(lead.lead_type)}`;
  const defaultIntro =
    input.type === 'confirmation'
      ? 'Thank you for reaching out to Beyon Vital, LLC. We received your request and will follow up.'
      : `We wanted to follow up on your request. Reply to this email or call us at ${business.phone}.`;

  const subject = input.subjectOverride?.trim() || defaultSubject;
  const body = input.bodyOverride?.trim() || '';
  const rendered = renderLeadResponseEmail({
    title: subject,
    intro: defaultIntro,
    body,
    summary: leadSummaryRows(lead),
    unsubscribeUrl: unsubscribeUrl(lead.contact_email),
    footerNote: 'You are receiving this email because you contacted Beyon Vital, LLC through our website.',
    replyToEmail: replyToRecipient()
  });

  return { lead, subject, html: rendered.html, text: rendered.text };
}

export async function sendNewsletterConfirmEmail(input: { email: string; confirmUrl: string; idempotencyKey: string }) {
  const { html, text } = renderSubscribeConfirmEmail({ confirmUrl: input.confirmUrl });
  return sendResendEmail({
    to: input.email,
    subject: 'Confirm your subscription to Beyon Vital updates',
    html,
    text,
    replyTo: replyToRecipient(),
    idempotencyKey: input.idempotencyKey
  });
}

export async function sendTestBlastEmail(input: { subject: string; previewText?: string; body: string }) {
  const to = adminRecipient();
  const { html, text } = renderMarketingEmail({
    subject: input.subject,
    previewText: input.previewText,
    body: input.body,
    unsubscribeUrl: unsubscribeUrl(to)
  });
  const res = await sendResendEmail({
    to,
    subject: `[TEST] ${input.subject}`,
    html,
    text,
    replyTo: replyToRecipient(),
    headers: listUnsubscribeHeaders(to)
  });
  await logEmailEvent({ email: to, type: 'sent', meta: { kind: 'campaign_test', resend_id: res.id || null } });
  return res;
}

export async function sendBlastCampaign(input: {
  subject: string;
  previewText?: string;
  body: string;
  audienceSource?: string;
  idempotencyKey: string;
}) {
  const existing = await getEmailCampaignByIdempotencyKey(input.idempotencyKey);
  if (existing && (existing.status === 'sending' || existing.status === 'sent')) {
    return { campaign: existing, alreadyProcessed: true };
  }

  const campaign = await createEmailCampaign(input);
  const subscribers = await listSubscribersForBlast(input.audienceSource);
  const recipients = uniqEmails(subscribers.map((item) => item.email));
  // A retried (previously failed) campaign must not re-send to anyone who already got it.
  const alreadySent = new Set(await listCampaignRecipientEmails(campaign.id, 'sent'));

  let sentCount = alreadySent.size;
  let skippedCount = 0;
  let failedCount = 0;
  let lastSendAt = 0;

  try {
    for (const email of recipients) {
      if (alreadySent.has(email)) continue;

      const subscriber = subscribers.find((item) => item.email.toLowerCase() === email);
      if (!subscriber || subscriber.status !== 'active') {
        skippedCount += 1;
        await recordEmailCampaignRecipient({ campaignId: campaign.id, email, status: 'skipped', reason: subscriber?.status || 'missing' });
        continue;
      }

      const wait = lastSendAt + BLAST_SEND_INTERVAL_MS - Date.now();
      if (wait > 0) await sleep(wait);
      lastSendAt = Date.now();

      try {
        const { html, text } = renderMarketingEmail({
          subject: input.subject,
          previewText: input.previewText,
          body: input.body,
          unsubscribeUrl: unsubscribeUrl(email)
        });
        const resend = await sendResendEmail({
          to: email,
          subject: input.subject,
          html,
          text,
          replyTo: replyToRecipient(),
          headers: listUnsubscribeHeaders(email),
          idempotencyKey: `campaign:${campaign.id}:${email}`
        });
        sentCount += 1;
        await recordEmailCampaignRecipient({ campaignId: campaign.id, email, status: 'sent' });
        await logEmailEvent({ email, type: 'sent', meta: { campaign_id: campaign.id, resend_id: resend.id || null } });
      } catch (error) {
        skippedCount += 1;
        failedCount += 1;
        const reason = error instanceof Error ? error.message.slice(0, 200) : 'send_failed';
        await recordEmailCampaignRecipient({ campaignId: campaign.id, email, status: 'skipped', reason });
        await logEmailEvent({ email, type: 'send_failed', meta: { campaign_id: campaign.id, reason } });
      }
    }
  } catch (error) {
    await finalizeEmailCampaign({
      campaignId: campaign.id,
      status: 'failed',
      totalRecipients: recipients.length,
      sentCount,
      skippedCount
    });
    throw error;
  }

  // Any failed send leaves the campaign 'failed' so a retry with the same
  // idempotency key re-attempts the unsent recipients instead of returning
  // alreadyProcessed for a blast nobody received.
  const status = failedCount > 0 ? 'failed' : 'sent';
  await finalizeEmailCampaign({
    campaignId: campaign.id,
    status,
    totalRecipients: recipients.length,
    sentCount,
    skippedCount
  });

  return { campaign: { ...campaign, status, total_recipients: recipients.length, sent_count: sentCount, skipped_count: skippedCount }, alreadyProcessed: false, failedCount };
}

function leadTypeLabel(leadType?: string) {
  if (leadType === 'placement') return 'Inquiry';
  if (leadType === 'community_engagement') return 'Community Engagement Inquiry';
  if (leadType === 'tour') return 'Tour Request';
  return 'Contact Form';
}

export async function sendLeadTransactionalEmails(lead: LocalLead) {
  const currentLead = await getLocalLeadById(lead.id);
  if (!currentLead) throw new Error('Lead not found');
  if (currentLead.admin_notified_at) {
    return { ok: true, skipped: true };
  }

  const recipients = adminNotificationRecipients();
  const typeLabel = leadTypeLabel(currentLead.lead_type);
  const summary = leadSummaryRows(currentLead);
  const leadName = currentLead.contact_name?.trim() || 'New Lead';
  const subject = `New ${typeLabel} Submitted — ${leadName}`;
  const adminUrl = `${SITE_URL}/admin?leadId=${encodeURIComponent(currentLead.id)}`;
  const { html, text } = renderLeadResponseEmail({
    title: subject,
    intro: 'A new request was submitted on the website.',
    summary,
    replyToEmail: replyToRecipient(),
    footerNote: 'Internal notification from the Beyon Vital website.',
    ctaButtons: [{ label: 'Open Lead in Admin', href: adminUrl, bgColor: '#1F1A17' }]
  });

  try {
    for (const recipient of recipients) {
      await sendResendEmail({
        to: recipient,
        subject,
        html,
        text,
        replyTo: replyToRecipient()
      });
      await logEmailEvent({ email: recipient, type: 'sent', meta: { kind: 'lead_admin_notification', lead_id: currentLead.id } });
    }
    await markLeadAdminNotified(currentLead.id);
    return { ok: true, skipped: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Admin notification failed';
    await markLeadAdminNotifyError(currentLead.id, message);
    throw error;
  }
}

export async function sendLeadDetailEmail(input: {
  leadId: string;
  type: 'confirmation' | 'followup';
  subjectOverride?: string;
  bodyOverride?: string;
  sendAgain?: boolean;
}) {
  const draft = await buildLeadDetailEmailDraft(input);
  const lead = draft.lead;

  try {
    const resend = await sendResendEmail({
      to: lead.contact_email,
      subject: draft.subject,
      html: draft.html,
      text: draft.text,
      replyTo: replyToRecipient()
    });
    await markLeadEmailSent(lead.id, input.type);
    await logEmailEvent({
      email: lead.contact_email,
      type: input.type === 'confirmation' ? 'lead_confirmation_sent' : 'lead_followup_sent',
      meta: { lead_id: lead.id }
    });
    return { ok: true, resendId: resend.id || null, to: lead.contact_email, type: input.type };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Email send failed';
    await markLeadEmailError(lead.id, message);
    throw error;
  }
}
