import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"
import { nanoid } from "nanoid"
import { timestamps } from "./_helpers"
import { weapons } from "./weapons.schema"

export const bonusRolls = sqliteTable(
  "bonus_rolls",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    index: integer("index", { mode: "number" }).notNull(),
    weaponId: text("weapon_id")
      .notNull()
      .references(() => weapons.id, { onDelete: "cascade" }),
    bonus1: text("bonus_1").notNull(),
    bonus2: text("bonus_2").notNull(),
    bonus3: text("bonus_3").notNull(),
    bonus4: text("bonus_4").notNull(),
    bonus5: text("bonus_5").notNull(),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("bonus_rolls_weapon_index_idx").on(table.weaponId, table.index),
  ],
)

export type BonusRoll = typeof bonusRolls.$inferSelect
export type NewBonusRoll = typeof bonusRolls.$inferInsert
