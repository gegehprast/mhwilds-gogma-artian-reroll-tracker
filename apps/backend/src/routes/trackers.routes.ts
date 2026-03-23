import { createRoute } from "@bunkit/server"
import { z } from "zod"
import { getTrackerService } from "@/services/trackers.service"
import { mapError } from "./_helpers"

const TrackerSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    skillIndex: z.number().int(),
    bonusIndex: z.number().int(),
    createdAt: z.number().int(),
    updatedAt: z.number().int(),
  })
  .meta({ id: "Tracker", title: "Tracker" })

const CreateTrackerBodySchema = z
  .object({
    name: z.string().optional(),
  })
  .meta({ id: "CreateTrackerBody" })

const UpdateTrackerBodySchema = z
  .object({
    name: z.string().min(1).optional(),
    skillIndex: z.number().int().min(1).optional(),
    bonusIndex: z.number().int().min(1).optional(),
  })
  .meta({ id: "UpdateTrackerBody" })

createRoute("POST", "/api/trackers")
  .openapi({
    operationId: "createTracker",
    summary: "Create tracker",
    description: "Creates a new tracker and returns it with its generated ID.",
    tags: ["Trackers"],
  })
  .body(CreateTrackerBodySchema)
  .response(TrackerSchema, { status: 201 })
  .handler(async ({ body, res }) => {
    const service = getTrackerService()
    const result = await service.getOrCreate(undefined)
    if (result.isErr()) return mapError(result.error, res)
    // Override name if provided
    if (body?.name) {
      const updated = await service.updateName(result.value.id, body.name)
      if (updated.isErr()) return mapError(updated.error, res)
      return res.created(updated.value)
    }
    return res.created(result.value)
  })

createRoute("GET", "/api/trackers/:id")
  .openapi({
    operationId: "getTracker",
    summary: "Get tracker",
    description: "Returns a tracker by its ID.",
    tags: ["Trackers"],
  })
  .response(TrackerSchema)
  .errors([404])
  .handler(async ({ params, res }) => {
    const service = getTrackerService()
    const result = await service.getById(params.id)
    if (result.isErr()) return mapError(result.error, res)
    return res.ok(result.value)
  })

createRoute("PATCH", "/api/trackers/:id")
  .openapi({
    operationId: "updateTracker",
    summary: "Update tracker",
    description: "Update the tracker's name or skill/bonus index counters.",
    tags: ["Trackers"],
  })
  .body(UpdateTrackerBodySchema)
  .response(TrackerSchema)
  .errors([400, 404])
  .handler(async ({ params, body, res }) => {
    const service = getTrackerService()

    let tracker = await service.getById(params.id)
    if (tracker.isErr()) return mapError(tracker.error, res)

    if (body.name !== undefined) {
      const r = await service.updateName(params.id, body.name)
      if (r.isErr()) return mapError(r.error, res)
      tracker = r
    }
    if (body.skillIndex !== undefined) {
      const r = await service.setSkillIndex(params.id, body.skillIndex)
      if (r.isErr()) return mapError(r.error, res)
      tracker = r
    }
    if (body.bonusIndex !== undefined) {
      const r = await service.setBonusIndex(params.id, body.bonusIndex)
      if (r.isErr()) return mapError(r.error, res)
      tracker = r
    }

    return res.ok(tracker.value)
  })
