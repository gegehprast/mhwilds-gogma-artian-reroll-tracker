import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { nanoid } from "nanoid"
import { timestamps } from "./_helpers"

export const trackers = sqliteTable("trackers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid(12)),
  name: text("name").notNull().default("My Tracker"),
  skillIndex: integer("skill_index", { mode: "number" }).notNull().default(1),
  bonusIndex: integer("bonus_index", { mode: "number" }).notNull().default(1),
  ...timestamps(),
})

export type Tracker = typeof trackers.$inferSelect
export type NewTracker = typeof trackers.$inferInsert
