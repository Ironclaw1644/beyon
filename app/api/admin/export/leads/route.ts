import { requireAdminApi } from '@/lib/api-auth';
import { exportLocalLeads } from '@/lib/storage';

function csvEscape(value: unknown) {
  const s = String(value ?? '');
  return `"${s.split('"').join('""')}"`;
}

export async function GET(req: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const items = await exportLocalLeads();
  const headers = [
    'id',
    'created_at',
    'status',
    'lead_type',
    'contact_name',
    'contact_email',
    'contact_phone',
    'company_name',
    'page_path',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'referrer',
    'forwarded_to_leadops',
    'leadops_forwarded_at',
    'leadops_error',
    'notes_count',
    'message'
  ];
  const rows = [headers.join(',')];
  for (const item of items as Record<string, unknown>[]) {
    rows.push(headers.map((h) => csvEscape(item[h])).join(','));
  }
  return new Response(rows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="leads.csv"'
    }
  });
}
