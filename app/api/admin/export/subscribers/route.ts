import { requireAdminApi } from '@/lib/api-auth';
import { dbGet } from '@/lib/storage';

function csvEscape(value: unknown) {
  const s = String(value ?? '');
  return `"${s.split('"').join('""')}"`;
}

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const subscribers = await dbGet('subscribers');
  const headers = ['id', 'email', 'name', 'source', 'status', 'opted_in', 'unsubscribe_reason', 'unsubscribed_at', 'bounced_at', 'complaint_at', 'created_at'];
  const rows = [headers.join(',')].concat(subscribers.map((s) => headers.map((h) => csvEscape((s as Record<string, unknown>)[h])).join(',')));
  return new Response(rows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="subscribers.csv"'
    }
  });
}
