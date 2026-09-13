const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM;
const to = process.env.RESEND_TO;

if (!apiKey || !from || !to) {
  console.error('Missing RESEND_API_KEY, RESEND_FROM, or RESEND_TO');
  process.exit(1);
}

const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    from,
    to: [to],
    subject: 'Beyon Vital Resend test',
    html: '<p>This is a test email from Beyon Vital.</p>',
    text: 'This is a test email from Beyon Vital.'
  })
});

const data = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error('Send failed', res.status, data);
  process.exit(1);
}

console.log('Sent test email', data);
