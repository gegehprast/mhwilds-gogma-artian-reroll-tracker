import type { ResponseBuilder } from "@bunkit/server"
import type { AppError } from "@/core/errors"

/**
 * Maps an AppError to the appropriate HTTP error response.
 */
export function mapError(
  error: AppError,
  // biome-ignore lint/suspicious/noExplicitAny: ResponseBuilder is generic on TResponse
  res: ResponseBuilder<any>,
): Response {
  switch (error.statusCode) {
    case 400:
      return res.badRequest(error.message, error.code)
    case 401:
      return res.unauthorized(error.message, error.code)
    case 403:
      return res.forbidden(error.message, error.code)
    case 404:
      return res.notFound(error.message, error.code)
    case 409:
      return res.conflict(error.message, error.code)
    default:
      return res.internalError(error.message, error.code)
  }
}
