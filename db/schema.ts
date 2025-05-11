import { text, uuid, pgTable } from 'drizzle-orm/pg-core';

export const note = pgTable('note', {
  id: uuid('id').primaryKey(),
  text: text('text').notNull(),
});
