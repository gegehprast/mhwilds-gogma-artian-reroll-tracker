import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/db/schemas/index.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "./data/tracker.db",
  },
  verbose: true,
  strict: true,
  casing: "snake_case",
})
