import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdminApi } from '@/lib/api-auth';
import { dbGet, deleteAnnouncement, upsertAnnouncement } from '@/lib/storage';

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  return NextResponse.json(await dbGet('announcements'));
}

export async function POST(req: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const text = typeof body?.body === 'string' ? body.body.trim() : '';
  if (!body || !title || !text) {
    return NextResponse.json({ error: 'title and body are required' }, { status: 400 });
  }
  try {
    const item = await upsertAnnouncement({ ...body, title, body: text } as Parameters<typeof upsertAnnouncement>[0]);
    revalidatePath('/');
    revalidatePath('/announcements');
    return NextResponse.json(item);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save announcement';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await deleteAnnouncement(id);
  revalidatePath('/');
  revalidatePath('/announcements');
  return NextResponse.json({ ok: true });
}
