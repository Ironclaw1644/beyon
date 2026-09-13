const subscribers = [
  { email: 'a@example.com', status: 'active' },
  { email: 'b@example.com', status: 'unsubscribed' },
  { email: 'c@example.com', status: 'bounced' },
  { email: 'a@example.com', status: 'active' }
];

const seen = new Set();
const result = [];
for (const item of subscribers) {
  const email = item.email.toLowerCase();
  if (seen.has(email)) continue;
  seen.add(email);
  if (item.status !== 'active') {
    result.push({ email, send: false, reason: item.status });
    continue;
  }
  result.push({ email, send: true });
}

console.log(JSON.stringify(result, null, 2));
