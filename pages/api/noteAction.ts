'user server';
import { db } from '@/db/drizzle';
import { note } from '@/db/schema';

export async function fetchAllNotesAsync() {
  const notes = await db.select().from(note);
  return notes;
}
