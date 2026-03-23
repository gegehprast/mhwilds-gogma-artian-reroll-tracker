import type { MiddlewareArgs, MiddlewareFn } from "@bunkit/server"
import { HEADERS } from "@/config/constants"

/**
 * Extracts the Tracker ID from the X-Tracker-Id request header and
 * attaches it to the context for downstream handlers.
 */
export function trackerMiddleware(): MiddlewareFn {
  return async ({ req, ctx, next }: MiddlewareArgs) => {
    const trackerId = req.headers.get(HEADERS.X_TRACKER_ID)
    if (trackerId) {
      ctx.trackerId = trackerId
    }
    return next()
  }
}
