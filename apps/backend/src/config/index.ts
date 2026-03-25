import { z } from "zod"
import packageJson from "../../package.json"

const configSchema = z.object({
  // Application
  APP_NAME: z.string().default("Gogma Reroll Tracker"),
  APP_URL: z.string().default("http://localhost:3001"),
  VERSION: z.string(),

  // Server
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default("0.0.0.0"),

  // HTTP Server
  HTTP_MAX_REQUEST_BODY_SIZE: z.coerce.number().default(10485760), // 10MB in bytes

  // CORS
  CORS_ORIGIN: z
    .string()
    .default(
      "http://localhost:3000,http://localhost:3001,http://localhost:5173,http://localhost:4173,http://localhost:8080",
    ),

  // Database (SQLite file path)
  DATABASE_URL: z.string().default("./data/tracker.db"),

  // Logging
  LOG_LEVEL: z
    .enum(["none", "error", "warn", "info", "debug", "trace"])
    .default("info"),
  LOG_DISABLED_COMPONENTS: z.string().default(""),

  // Shutdown
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().default(10000), // 10 seconds
})

export type Config = z.infer<typeof configSchema>

function parseConfig(): Config {
  try {
    return configSchema.parse({
      ...process.env,
      VERSION: packageJson.version,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Invalid environment configuration:")
      for (const issue of error.issues) {
        console.error(`  - ${issue.path.join(".")}: ${issue.message}`)
      }
      process.exit(1)
    }
    throw error
  }
}

export const config = parseConfig()
export const isDevelopment = config.NODE_ENV === "development"
export const isProduction = config.NODE_ENV === "production"
export const isTest = config.NODE_ENV === "test"
