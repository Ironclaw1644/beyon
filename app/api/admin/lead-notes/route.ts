import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/api-auth';
import { addLeadNote, dbGet, deleteLeadNote, getLeadNotesByLeadId, updateLeadNote } from '@/lib/storage';

export async function GET(req: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  try {
    const leadId = new URL(req.url).searchParams.get('leadId');
    if (leadId) {
      const notes = await getLeadNotesByLeadId(leadId);
      return NextResponse.json(notes);
    }
    const notes = await dbGet('leadNotes');
    return NextResponse.json(notes);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load notes';
    console.error('admin.lead_notes.list.error', { message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const leadId = String(body.leadId || body.lead_id || '').trim();
    const note = String(body.note || '').trim();
    if (!leadId || !note) {
      return NextResponse.json({ error: 'leadId (or lead_id) and note are required' }, { status: 400 });
    }
    const item = await addLeadNote(leadId, note);
    console.info('admin.lead_notes.create.success', { leadId, noteLength: note.length });
    return NextResponse.json(item);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save note';
    console.error('admin.lead_notes.create.error', { message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const body = await req.json();
  if (!body.id || !body.note) return NextResponse.json({ error: 'id and note required' }, { status: 400 });
  const item = await updateLeadNote(String(body.id), String(body.note));
  return NextResponse.json(item);
}

export async function DELETE(req: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await deleteLeadNote(id);
  return NextResponse.json({ ok: true });
}
