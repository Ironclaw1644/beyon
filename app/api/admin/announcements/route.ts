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
  const body = await req.json();
  const item = await upsertAnnouncement(body);
  revalidatePath('/');
  revalidatePath('/announcements');
  return NextResponse.json(item);
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
