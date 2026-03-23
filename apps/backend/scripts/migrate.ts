#!/usr/bin/env bun

/**
 * Database Migration Script (SQLite)
 *
 * Creates the data directory if needed and applies all pending Drizzle
 * migrations against the SQLite database file.
 */

import { Database as BunSQLite } from "bun:sqlite"
import { mkdir } from "node:fs/promises"
import path from "node:path"
import { drizzle } from "drizzle-orm/bun-sqlite"
import { migrate } from "drizzle-orm/bun-sqlite/migrator"

const dbUrl = process.env.DATABASE_URL ?? "./data/tracker.db"
const backendDir = path.resolve(import.meta.dir, "..")
const dbPath = path.isAbsolute(dbUrl) ? dbUrl : path.resolve(backendDir, dbUrl)
const migrationsFolder = path.resolve(backendDir, "drizzle")

console.info(`📊 Migrating SQLite database: ${dbPath}`)

await mkdir(path.dirname(dbPath), { recursive: true })

const sqlite = new BunSQLite(dbPath)
const db = drizzle(sqlite, { casing: "snake_case" })

migrate(db, { migrationsFolder })

console.info("✅ Migrations applied successfully")
sqlite.close()
