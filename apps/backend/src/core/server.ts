import { createServer } from "@bunkit/server"
import { config } from "@/config"
import { loggingMiddleware } from "@/middlewares/logging.middleware"
import { trackerMiddleware } from "@/middlewares/tracker.middleware"

export const server = createServer({
  port: config.PORT,
  host: config.HOST,
  maxRequestBodySize: config.HTTP_MAX_REQUEST_BODY_SIZE,
  globalMiddlewares: [loggingMiddleware(), trackerMiddleware()],
  openapi: {
    title: "Gogma Reroll Tracker API",
    version: "1.0.0",
    description: "API for tracking MHWilds Gogma reroll results",
    servers: [
      {
        url: `http://localhost:${config.PORT}`,
        description: "Development server",
      },
      {
        url: config.APP_URL,
        description: "Production server",
      },
    ],
  },
  cors: {
    origin: (origin) => {
      const allowedOrigins = config.CORS_ORIGIN.split(",").map((o) => o.trim())
      return allowedOrigins.includes(origin)
    },
    allowedHeaders: ["Content-Type", "Authorization", "X-Tracker-Id"],
    credentials: true,
  },
})
