import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/api-auth';
import { getInboxAttachmentUrl, InboxNotConnectedError } from '@/lib/inbox/service';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Redirects to a fresh, short-lived Resend download URL. Attachment bytes are never stored here.
export async function GET(req: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const url = new URL(req.url);
  const messageId = url.searchParams.get('messageId') || '';
  const attachmentId = url.searchParams.get('attachmentId') || '';
  if (!UUID.test(messageId) || !/^[\w-]{1,100}$/.test(attachmentId)) {
    return NextResponse.json({ error: 'Invalid attachment' }, { status: 400 });
  }

  try {
    const downloadUrl = await getInboxAttachmentUrl(messageId, attachmentId);
    if (!downloadUrl) return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    const res = NextResponse.redirect(downloadUrl, 302);
    res.headers.set('Cache-Control', 'no-store');
    res.headers.set('Referrer-Policy', 'no-referrer');
    return res;
  } catch (error) {
    if (error instanceof InboxNotConnectedError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Download failed' }, { status: 502 });
  }
}
