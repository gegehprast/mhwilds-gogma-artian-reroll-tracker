import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"
import { nanoid } from "nanoid"
import {
  ELEMENTS,
  type Element,
  WEAPON_TYPES,
  type WeaponType,
} from "@/config/game-constants"
import { timestamps } from "./_helpers"
import { trackers } from "./trackers.schema"

export const weapons = sqliteTable(
  "weapons",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    trackerId: text("tracker_id")
      .notNull()
      .references(() => trackers.id, { onDelete: "cascade" }),
    weaponType: text("weapon_type", { enum: WEAPON_TYPES })
      .$type<WeaponType>()
      .notNull(),
    element: text("element", { enum: ELEMENTS }).$type<Element>().notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("weapons_tracker_type_element_idx").on(
      table.trackerId,
      table.weaponType,
      table.element,
    ),
  ],
)

export type Weapon = typeof weapons.$inferSelect
export type NewWeapon = typeof weapons.$inferInsert
