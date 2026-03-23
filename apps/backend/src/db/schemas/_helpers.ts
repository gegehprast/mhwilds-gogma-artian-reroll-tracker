import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core"
import { integer, text } from "drizzle-orm/sqlite-core"

export function primaryId() {
  return text("id").primaryKey()
}

export function timestamps() {
  return {
    createdAt: integer("created_at", { mode: "number" })
      .notNull()
      .$defaultFn(() => Date.now()),
    updatedAt: integer("updated_at", { mode: "number" })
      .notNull()
      .$defaultFn(() => Date.now())
      .$onUpdateFn(() => Date.now()),
  }
}

export function foreignId(
  columnName: string,
  reference: () => AnySQLiteColumn,
  options?: {
    onDelete?: "cascade" | "set null" | "restrict" | "no action"
    onUpdate?: "cascade" | "set null" | "restrict" | "no action"
  },
) {
  return text(columnName).references(reference, options)
}
