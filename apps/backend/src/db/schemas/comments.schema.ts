import { index, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { nanoid } from "nanoid"
import { timestamps } from "./_helpers"

export const COMMENT_COLORS = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "violet",
  "pink",
] as const

export type CommentColor = (typeof COMMENT_COLORS)[number]

export const COMMENT_ROLL_TYPES = ["skill", "bonus"] as const
export type CommentRollType = (typeof COMMENT_ROLL_TYPES)[number]

export const comments = sqliteTable(
  "comments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    rollId: text("roll_id").notNull(),
    rollType: text("roll_type", { enum: COMMENT_ROLL_TYPES }).notNull(),
    content: text("content").notNull(),
    color: text("color", { enum: COMMENT_COLORS }).notNull(),
    ...timestamps(),
  },
  (table) => [index("comments_roll_idx").on(table.rollId, table.rollType)],
)

export type Comment = typeof comments.$inferSelect
export type NewComment = typeof comments.$inferInsert
