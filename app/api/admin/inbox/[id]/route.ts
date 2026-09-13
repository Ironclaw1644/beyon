import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/api-auth';
import { countUnreadThreads, getInboxThread, getMissingInboxEnvVars } from '@/lib/inbox/service';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: 'Invalid conversation id' }, { status: 400 });

  try {
    const allowRemoteImages = new URL(req.url).searchParams.get('images') === '1';
    const result = await getInboxThread(id, { allowRemoteImages });
    if (!result) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    const missing = getMissingInboxEnvVars();
    return NextResponse.json({ connected: missing.length === 0, missing, unreadCount: await countUnreadThreads(), ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to load conversation' }, { status: 500 });
  }
}
