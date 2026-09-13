import 'server-only';

import { business } from '@/lib/content';
import { SITE_URL } from '@/lib/utils';

// Email-safe rendering: nested tables, inline styles, bgcolor attributes, a 600px
// container, web-safe fonts, and bulletproof buttons. The logo sits on a baked-in
// white tile so it survives clients that force dark mode.

const LOGO_URL = 'https://beyonvital.com/brand/email-logo.png';

const C = {
  red: '#A8392A',
  ink: '#1F1A17',
  muted: '#5B524C',
  cream: '#F7F2EA',
  footer: '#FBF8F3',
  border: '#E6DDD0',
  white: '#FFFFFF'
};

const SANS = "Arial,Helvetica,sans-serif";
const SERIF = "Georgia,'Times New Roman',serif";

export type RenderedEmail = { html: string; text: string };

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function siteLabel() {
  return SITE_URL.replace(/^https?:\/\//, '');
}

function renderBodyHtml(body: string) {
  const lines = body.split(/\r?\n/);
  const chunks: string[] = [];
  let list: string[] = [];

  const flushList = () => {
    if (!list.length) return;
    chunks.push(
      `<ul style="margin:0 0 16px 0;padding:0 0 0 22px;font-family:${SANS};font-size:16px;line-height:26px;color:${C.ink};">${list
        .map((item) => `<li style="margin:0 0 8px 0;">${item}</li>`)
        .join('')}</ul>`
    );
    list = [];
  };

  for (const line of lines) {
    const text = line.trim();
    if (!text) {
      flushList();
      continue;
    }
    if (/^[-*]\s+/.test(text)) {
      list.push(escapeHtml(text.replace(/^[-*]\s+/, '')));
      continue;
    }
    flushList();
    chunks.push(
      `<p style="margin:0 0 16px 0;font-family:${SANS};font-size:16px;line-height:26px;color:${C.ink};word-break:break-word;">${escapeHtml(text)}</p>`
    );
  }
  flushList();

  return chunks.join('');
}

function renderButtons(buttons: Array<{ label: string; href: string; bgColor?: string }>) {
  if (!buttons.length) return '';
  const cells = buttons
    .map((button) => {
      const bg = escapeHtml(button.bgColor || C.red);
      return `<td style="padding:0 10px 10px 0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="${bg}" style="background-color:${bg};border-radius:8px;"><a href="${escapeHtml(
        button.href
      )}" style="display:inline-block;padding:12px 18px;font-family:${SANS};font-size:15px;line-height:20px;font-weight:bold;color:${C.white};text-decoration:none;border-radius:8px;">${escapeHtml(
        button.label
      )}</a></td></tr></table></td>`;
    })
    .join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 0 0;"><tr>${cells}</tr></table>`;
}

function renderEmailShell(input: {
  title: string;
  previewText?: string;
  contentHtml: string;
  unsubscribeUrl?: string;
  footerNote?: string;
}) {
  // Invisible preheader padded so clients don't pull body text into the preview.
  const preview = input.previewText
    ? `<div style="display:none;max-height:0;max-width:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${C.cream};opacity:0;">${escapeHtml(
        input.previewText
      )}${'&#847;&zwnj;&nbsp;'.repeat(40)}</div>`
    : '';

  const unsubscribe = input.unsubscribeUrl
    ? `<br /><br />${escapeHtml(input.footerNote || 'You are receiving this email because you asked Beyon Vital, LLC for updates.')} <a href="${escapeHtml(
        input.unsubscribeUrl
      )}" style="color:${C.red};text-decoration:underline;">Unsubscribe</a>`
    : input.footerNote
      ? `<br /><br />${escapeHtml(input.footerNote)}`
      : '';

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light only" />
<meta name="format-detection" content="telephone=no,address=no,email=no" />
<title>${escapeHtml(input.title)}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  :root { color-scheme: light only; supported-color-schemes: light only; }
  body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { -ms-interpolation-mode: bicubic; }
  @media only screen and (max-width: 620px) {
    .bv-container { width: 100% !important; }
    .bv-px { padding-left: 20px !important; padding-right: 20px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${C.cream};" bgcolor="${C.cream}">
${preview}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.cream}" style="background-color:${C.cream};">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
      <table role="presentation" class="bv-container" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.white}" style="width:600px;max-width:600px;background-color:${C.white};border:1px solid ${C.border};border-radius:12px;">
        <tr>
          <td class="bv-px" bgcolor="${C.red}" style="background-color:${C.red};padding:18px 28px;border-radius:12px 12px 0 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="56" valign="middle" style="width:56px;">
                  <a href="${SITE_URL}" style="text-decoration:none;"><img src="${LOGO_URL}" width="56" height="56" alt="Beyon Vital logo" style="display:block;width:56px;height:56px;border:0;outline:none;text-decoration:none;" /></a>
                </td>
                <td valign="middle" style="padding:0 0 0 14px;font-family:${SERIF};font-size:22px;line-height:26px;font-weight:bold;letter-spacing:1px;color:${C.white};">
                  BEYON VITAL<br />
                  <span style="font-family:${SANS};font-size:11px;line-height:16px;font-weight:normal;letter-spacing:3px;color:${C.white};">COMMUNITY SERVICES</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="bv-px" bgcolor="${C.white}" style="background-color:${C.white};padding:28px 28px 20px 28px;">
            <h1 style="margin:0 0 16px 0;font-family:${SERIF};font-size:24px;line-height:30px;font-weight:bold;color:${C.ink};word-break:break-word;">${escapeHtml(input.title)}</h1>
            ${input.contentHtml}
          </td>
        </tr>
        <tr>
          <td class="bv-px" bgcolor="${C.footer}" style="background-color:${C.footer};border-top:1px solid ${C.border};padding:20px 28px;border-radius:0 0 12px 12px;font-family:${SANS};font-size:13px;line-height:20px;color:${C.muted};">
            <strong style="color:${C.ink};">${escapeHtml(business.name)}</strong><br />
            <a href="${business.phoneHref}" style="color:${C.red};text-decoration:underline;">${escapeHtml(business.phone)}</a>
            &nbsp;&middot;&nbsp;
            <a href="mailto:${escapeHtml(business.email)}" style="color:${C.red};text-decoration:underline;">${escapeHtml(business.email)}</a><br />
            ${escapeHtml(business.address)}<br />
            <a href="${SITE_URL}" style="color:${C.red};text-decoration:underline;">${escapeHtml(siteLabel())}</a>
            ${unsubscribe}
          </td>
        </tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td>
  </tr>
</table>
</body>
</html>`;
}

function textFooter(unsubscribeUrl?: string, footerNote?: string) {
  const lines = ['--', business.name, `${business.phone} · ${business.email}`, business.address, SITE_URL];
  if (footerNote) lines.push('', footerNote);
  if (unsubscribeUrl) lines.push('', `Unsubscribe: ${unsubscribeUrl}`);
  return lines.join('\n');
}

export function renderMarketingEmail(input: {
  subject: string;
  previewText?: string;
  body: string;
  unsubscribeUrl: string;
}): RenderedEmail {
  const footerNote = 'You are receiving this email because you asked Beyon Vital, LLC for updates.';
  const html = renderEmailShell({
    title: input.subject,
    previewText: input.previewText,
    contentHtml: renderBodyHtml(input.body),
    unsubscribeUrl: input.unsubscribeUrl,
    footerNote
  });
  const text = [input.subject, '', input.body.trim(), '', textFooter(input.unsubscribeUrl, footerNote)].join('\n');
  return { html, text };
}

/** Double opt-in confirmation. Transactional: no unsubscribe link, no user-supplied text. */
export function renderSubscribeConfirmEmail(input: { confirmUrl: string }): RenderedEmail {
  const title = 'Confirm your subscription';
  const intro = `Please confirm that you would like to receive news, community engagement updates and announcements from ${business.name} by email.`;
  const expiry = 'This link expires in 7 days.';
  const ignore = "If you didn't sign up, you can ignore this email. You won't be subscribed and we won't email you again.";
  const footerNote = `You are receiving this one-time email because this address was entered in the newsletter sign-up form at ${siteLabel()}.`;
  const small = `margin:0 0 12px 0;font-family:${SANS};font-size:13px;line-height:20px;color:${C.muted};word-break:break-word;`;

  const html = renderEmailShell({
    title,
    previewText: 'One click to confirm your Beyon Vital email updates.',
    contentHtml: `<p style="margin:0 0 16px 0;font-family:${SANS};font-size:16px;line-height:26px;color:${C.ink};">Hello,</p>
            <p style="margin:0 0 16px 0;font-family:${SANS};font-size:16px;line-height:26px;color:${C.ink};">${escapeHtml(intro)}</p>
            ${renderButtons([{ label: 'Confirm subscription', href: input.confirmUrl }])}
            <p style="${small}margin-top:12px;">${escapeHtml(expiry)} If the button doesn't work, copy this link into your browser:<br /><a href="${escapeHtml(
              input.confirmUrl
            )}" style="color:${C.red};text-decoration:underline;">${escapeHtml(input.confirmUrl)}</a></p>
            <p style="${small}">${escapeHtml(ignore)}</p>`,
    footerNote
  });

  const text = [
    title,
    '',
    'Hello,',
    '',
    intro,
    '',
    `Confirm your subscription: ${input.confirmUrl}`,
    '',
    expiry,
    '',
    ignore,
    '',
    textFooter(undefined, footerNote)
  ].join('\n');

  return { html, text };
}

export function renderLeadResponseEmail(input: {
  title: string;
  intro: string;
  body?: string;
  summary: Array<{ label: string; value: string }>;
  unsubscribeUrl?: string;
  replyToEmail: string;
  footerNote?: string;
  ctaButtons?: Array<{ label: string; href: string; bgColor?: string }>;
}): RenderedEmail {
  const rows = input.summary.filter((item) => item.value.trim());
  const summaryRows = rows
    .map(
      (item) =>
        `<tr><td valign="top" style="padding:8px 12px 8px 0;border-bottom:1px solid ${C.border};font-family:${SANS};font-size:14px;line-height:20px;font-weight:bold;color:${C.muted};white-space:nowrap;">${escapeHtml(
          item.label
        )}</td><td valign="top" style="padding:8px 0;border-bottom:1px solid ${C.border};font-family:${SANS};font-size:14px;line-height:20px;color:${C.ink};word-break:break-word;">${escapeHtml(item.value)}</td></tr>`
    )
    .join('');

  const bodyHtml = input.body?.trim()
    ? `<p style="margin:0 0 16px 0;font-family:${SANS};font-size:16px;line-height:26px;color:${C.ink};white-space:pre-wrap;word-break:break-word;">${escapeHtml(input.body.trim())}</p>`
    : '';

  const buttons = [
    ...(input.ctaButtons || []),
    { label: `Call ${business.phone}`, href: business.phoneHref, bgColor: C.red },
    { label: 'Reply by Email', href: `mailto:${input.replyToEmail}`, bgColor: C.ink }
  ];

  const html = renderEmailShell({
    title: input.title,
    contentHtml: `<p style="margin:0 0 16px 0;font-family:${SANS};font-size:16px;line-height:26px;color:${C.ink};">${escapeHtml(input.intro)}</p>
            ${bodyHtml}
            ${summaryRows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;">${summaryRows}</table>` : ''}
            ${renderButtons(buttons)}`,
    unsubscribeUrl: input.unsubscribeUrl,
    footerNote: input.footerNote
  });

  const text = [
    input.title,
    '',
    input.intro,
    ...(input.body?.trim() ? ['', input.body.trim()] : []),
    ...(rows.length ? ['', ...rows.map((row) => `${row.label}: ${row.value}`)] : []),
    '',
    ...buttons.map((button) => `${button.label}: ${button.href}`),
    '',
    textFooter(input.unsubscribeUrl, input.footerNote)
  ].join('\n');

  return { html, text };
}
