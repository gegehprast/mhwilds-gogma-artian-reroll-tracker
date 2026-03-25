import { createRoute } from "@bunkit/server"
import { z } from "zod"
import { COMMENT_COLORS, COMMENT_ROLL_TYPES } from "@/db/schemas"
import { getCommentService } from "@/services/comments.service"
import { mapError } from "./_helpers"
import { CommentSchema } from "./_schemas"

const CreateCommentBodySchema = z
  .object({
    rollId: z.string(),
    rollType: z.enum(COMMENT_ROLL_TYPES),
    content: z.string().min(1),
    color: z.enum(COMMENT_COLORS),
  })
  .meta({ id: "CreateCommentBody" })

const UpdateCommentBodySchema = z
  .object({
    content: z.string().min(1).optional(),
    color: z.enum(COMMENT_COLORS).optional(),
  })
  .meta({ id: "UpdateCommentBody" })

const BASE = "/api/trackers/:trackerId/comments"

createRoute("GET", BASE)
  .openapi({
    operationId: "listComments",
    summary: "List comments",
    description: "Returns all comments for a roll.",
    tags: ["Comments"],
  })
  .query(
    z.object({
      rollId: z.string(),
      rollType: z.enum(COMMENT_ROLL_TYPES),
    }),
  )
  .response(z.array(CommentSchema))
  .errors([403, 404])
  .handler(async ({ params, query, res }) => {
    const service = getCommentService()
    const result = await service.list(
      query.rollId,
      query.rollType,
      params.trackerId,
    )
    if (result.isErr()) return mapError(result.error, res)
    return res.ok(result.value)
  })

createRoute("POST", BASE)
  .openapi({
    operationId: "createComment",
    summary: "Create comment",
    description:
      "Creates a new comment on a roll. Maximum 5 comments per roll.",
    tags: ["Comments"],
  })
  .body(CreateCommentBodySchema)
  .response(CommentSchema, { status: 201 })
  .errors([400, 403, 404])
  .handler(async ({ params, body, res }) => {
    const service = getCommentService()
    const result = await service.create(
      body.rollId,
      body.rollType,
      params.trackerId,
      body.content,
      body.color,
    )
    if (result.isErr()) return mapError(result.error, res)
    return res.created(result.value)
  })

createRoute("DELETE", `${BASE}/dangling`)
  .openapi({
    operationId: "cleanupDanglingComments",
    summary: "Clean up dangling comments",
    description:
      "Deletes all comments whose roll no longer exists. Safe to call at any time.",
    tags: ["Comments"],
  })
  .response(z.object({ deleted: z.number().int() }))
  .handler(async ({ res }) => {
    const service = getCommentService()
    const result = await service.cleanupDangling()
    if (result.isErr())
      return res.internalError("Failed to clean up dangling comments")
    return res.ok({ deleted: result.value })
  })

createRoute("PATCH", `${BASE}/:id`)
  .openapi({
    operationId: "updateComment",
    summary: "Update comment",
    description: "Updates the content or color of a comment.",
    tags: ["Comments"],
  })
  .body(UpdateCommentBodySchema)
  .response(CommentSchema)
  .errors([400, 403, 404])
  .handler(async ({ params, body, res }) => {
    const service = getCommentService()
    const result = await service.update(params.id, params.trackerId, body)
    if (result.isErr()) return mapError(result.error, res)
    return res.ok(result.value)
  })

createRoute("DELETE", `${BASE}/:id`)
  .openapi({
    operationId: "deleteComment",
    summary: "Delete comment",
    description: "Deletes a comment.",
    tags: ["Comments"],
  })
  .errors([403, 404])
  .handler(async ({ params, res }) => {
    const service = getCommentService()
    const result = await service.delete(params.id, params.trackerId)
    if (result.isErr()) return mapError(result.error, res)
    return res.noContent()
  })
