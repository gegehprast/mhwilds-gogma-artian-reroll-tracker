import { createRoute } from "@bunkit/server"
import { z } from "zod"
import { getSkillRollService } from "@/services/skill-rolls.service"
import { getTrackerService } from "@/services/trackers.service"
import { mapError } from "./_helpers"

const SkillRollSchema = z
  .object({
    id: z.string(),
    index: z.number().int(),
    weaponId: z.string(),
    setSkill: z.string(),
    groupSkill: z.string(),
    createdAt: z.number().int(),
    updatedAt: z.number().int(),
  })
  .meta({ id: "SkillRoll", title: "Skill Roll" })

const CreateSkillRollBodySchema = z
  .object({
    setSkill: z.string(),
    groupSkill: z.string(),
    atIndex: z.number().int().min(1).optional(),
  })
  .meta({ id: "CreateSkillRollBody" })

const UpdateSkillRollBodySchema = z
  .object({
    setSkill: z.string().optional(),
    groupSkill: z.string().optional(),
  })
  .meta({ id: "UpdateSkillRollBody" })

const BASE = "/api/trackers/:trackerId/weapons/:weaponId/skill-rolls"

const ImportSkillRollsBodySchema = z
  .object({
    fromIndex: z.number().int().min(1),
    rolls: z
      .array(
        z.object({
          setSkill: z.string(),
          groupSkill: z.string(),
        }),
      )
      .min(1),
  })
  .meta({ id: "ImportSkillRollsBody" })

createRoute("POST", `${BASE}/import`)
  .openapi({
    operationId: "importSkillRolls",
    summary: "Import skill rolls",
    description:
      "Deletes existing rolls in the target index range and inserts uploaded data starting at fromIndex + 1.",
    tags: ["Skill Rolls"],
  })
  .body(ImportSkillRollsBodySchema)
  .response(z.array(SkillRollSchema), { status: 201 })
  .errors([400, 403, 404])
  .handler(async ({ params, body, res }) => {
    const service = getSkillRollService()
    const result = await service.import(
      params.trackerId,
      params.weaponId,
      body.fromIndex,
      body.rolls,
    )
    if (result.isErr()) return mapError(result.error, res)
    return res.created(result.value)
  })

createRoute("GET", BASE)
  .openapi({
    operationId: "listSkillRolls",
    summary: "List skill rolls",
    description: "Returns all skill rolls for a weapon, ordered by index.",
    tags: ["Skill Rolls"],
  })
  .response(z.array(SkillRollSchema))
  .errors([403, 404])
  .handler(async ({ params, res }) => {
    const service = getSkillRollService()
    const result = await service.list(params.weaponId, params.trackerId)
    if (result.isErr()) return mapError(result.error, res)
    return res.ok(result.value)
  })

createRoute("POST", BASE)
  .openapi({
    operationId: "createSkillRoll",
    summary: "Create skill roll",
    description:
      "Creates a new skill roll at the tracker's current skill index, then increments the counter.",
    tags: ["Skill Rolls"],
  })
  .body(CreateSkillRollBodySchema)
  .response(SkillRollSchema, { status: 201 })
  .errors([400, 403, 404])
  .handler(async ({ params, body, res }) => {
    const service = getSkillRollService()
    const result = await service.create(
      params.trackerId,
      params.weaponId,
      body.setSkill,
      body.groupSkill,
      body.atIndex,
    )
    if (result.isErr()) return mapError(result.error, res)
    return res.created(result.value)
  })

createRoute("PATCH", `${BASE}/:id`)
  .openapi({
    operationId: "updateSkillRoll",
    summary: "Update skill roll",
    description: "Correct set_skill or group_skill. The index is not editable.",
    tags: ["Skill Rolls"],
  })
  .body(UpdateSkillRollBodySchema)
  .response(SkillRollSchema)
  .errors([400, 403, 404])
  .handler(async ({ params, body, res }) => {
    const service = getSkillRollService()
    const result = await service.update(
      params.id,
      params.weaponId,
      params.trackerId,
      body,
    )
    if (result.isErr()) return mapError(result.error, res)
    return res.ok(result.value)
  })

createRoute("DELETE", `${BASE}/:id`)
  .openapi({
    operationId: "deleteSkillRoll",
    summary: "Delete skill roll",
    description: "Deletes a single skill roll by ID.",
    tags: ["Skill Rolls"],
  })
  .errors([403, 404])
  .handler(async ({ params, res }) => {
    const service = getSkillRollService()
    const result = await service.delete(
      params.id,
      params.weaponId,
      params.trackerId,
    )
    if (result.isErr()) return mapError(result.error, res)
    return res.noContent()
  })

const DeletePastSkillRollsBodySchema = z
  .object({
    beforeIndex: z.number().int().min(2),
  })
  .meta({ id: "DeletePastSkillRollsBody" })

const DeletePastSkillRollsResponseSchema = z
  .object({ deleted: z.number().int(), newSkillIndex: z.number().int() })
  .meta({ id: "DeletePastSkillRollsResponse" })

createRoute("DELETE", "/api/trackers/:trackerId/skill-rolls/past")
  .openapi({
    operationId: "deletePastSkillRolls",
    summary: "Delete past skill rolls",
    description:
      "Deletes all skill rolls with index < beforeIndex across every weapon, shifts surviving roll indices down, and updates the tracker's skillIndex accordingly.",
    tags: ["Skill Rolls"],
  })
  .body(DeletePastSkillRollsBodySchema)
  .response(DeletePastSkillRollsResponseSchema)
  .errors([400, 404])
  .handler(async ({ params, body, res }) => {
    const rollService = getSkillRollService()
    const trackerService = getTrackerService()

    const tracker = await trackerService.getById(params.trackerId)
    if (tracker.isErr()) return mapError(tracker.error, res)

    const result = await rollService.deletePastRolls(
      params.trackerId,
      body.beforeIndex,
    )
    if (result.isErr()) return mapError(result.error, res)

    const { deleted, offset } = result.value
    const newSkillIndex = Math.max(1, tracker.value.skillIndex - offset)

    const updated = await trackerService.setSkillIndex(
      params.trackerId,
      newSkillIndex,
    )
    if (updated.isErr()) return mapError(updated.error, res)

    return res.ok({ deleted, newSkillIndex })
  })
