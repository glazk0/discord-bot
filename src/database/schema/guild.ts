import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const guilds = pgTable(
  "guilds",
  {
    id: text().primaryKey(),

    locale: text(),

    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [index().on(table.createdAt)],
);

export type Guild = typeof guilds.$inferSelect;

export type NewGuild = typeof guilds.$inferInsert;
