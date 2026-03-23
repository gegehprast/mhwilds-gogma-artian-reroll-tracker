import { Database as BunSQLite } from "bun:sqlite"
import { mkdir } from "node:fs/promises"
import path from "node:path"
import { err, ok, type Result } from "@bunkit/result"
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite"
import { drizzle } from "drizzle-orm/bun-sqlite"
import { config } from "@/config"
import { DatabaseError } from "@/core/errors"
import type { ILogger } from "@/core/logger"
import * as schema from "./schemas"

export type Database = BunSQLiteDatabase<typeof schema>

let db: Database | null = null
let sqliteClient: BunSQLite | null = null

export async function initDatabase(
  logger?: ILogger,
): Promise<Result<Database, DatabaseError>> {
  try {
    if (db) {
      logger?.warn("Database already initialized")
      return ok(db)
    }

    const dbPath = path.isAbsolute(config.DATABASE_URL)
      ? config.DATABASE_URL
      : path.resolve(process.cwd(), config.DATABASE_URL)

    logger?.debug("Initializing SQLite database", { path: dbPath })

    await mkdir(path.dirname(dbPath), { recursive: true })

    sqliteClient = new BunSQLite(dbPath)
    db = drizzle(sqliteClient, { casing: "snake_case", schema })

    logger?.info("✅ Database connection established", { path: dbPath })
    return ok(db)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to connect to database"
    logger?.error("Database initialization failed", { error: message })
    return err(
      new DatabaseError("Failed to initialize database connection", {
        error: message,
      }),
    )
  }
}

export function getDatabase(): Result<Database, DatabaseError> {
  if (!db) {
    return err(
      new DatabaseError("Database not initialized. Call initDatabase() first."),
    )
  }
  return ok(db)
}

export async function closeDatabase(
  logger?: ILogger,
): Promise<Result<void, DatabaseError>> {
  try {
    if (!sqliteClient) {
      logger?.warn("Database connection already closed or not initialized")
      return ok(undefined)
    }
    logger?.info("Closing database connection")
    sqliteClient.close()
    sqliteClient = null
    db = null
    logger?.info("Database connection closed")
    return ok(undefined)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to close database"
    return err(
      new DatabaseError("Failed to close database connection", {
        error: message,
      }),
    )
  }
}
