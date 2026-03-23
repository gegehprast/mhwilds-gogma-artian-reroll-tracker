import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"
import { nanoid } from "nanoid"
import { timestamps } from "./_helpers"
import { weapons } from "./weapons.schema"

export const skillRolls = sqliteTable(
  "skill_rolls",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    index: integer("index", { mode: "number" }).notNull(),
    weaponId: text("weapon_id")
      .notNull()
      .references(() => weapons.id, { onDelete: "cascade" }),
    groupSkill: text("group_skill").notNull(),
    seriesSkill: text("series_skill").notNull(),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("skill_rolls_weapon_index_idx").on(table.weaponId, table.index),
  ],
)

export type SkillRoll = typeof skillRolls.$inferSelect
export type NewSkillRoll = typeof skillRolls.$inferInsert
