import { createRoute } from "@bunkit/server"
import { z } from "zod"
import { getSkillRollService } from "@/services/skill-rolls.service"
import { mapError } from "./_helpers"

const SkillRollSchema = z
  .object({
    id: z.string(),
    index: z.number().int(),
    weaponId: z.string(),
    groupSkill: z.string(),
    seriesSkill: z.string(),
    createdAt: z.number().int(),
    updatedAt: z.number().int(),
  })
  .meta({ id: "SkillRoll", title: "Skill Roll" })

const CreateSkillRollBodySchema = z
  .object({
    groupSkill: z.string(),
    seriesSkill: z.string(),
    atIndex: z.number().int().min(1).optional(),
  })
  .meta({ id: "CreateSkillRollBody" })

const UpdateSkillRollBodySchema = z
  .object({
    groupSkill: z.string().optional(),
    seriesSkill: z.string().optional(),
  })
  .meta({ id: "UpdateSkillRollBody" })

const BASE = "/api/trackers/:trackerId/weapons/:weaponId/skill-rolls"

const ImportSkillRollsBodySchema = z
  .object({
    fromIndex: z.number().int().min(1),
    rolls: z
      .array(
        z.object({
          groupSkill: z.string(),
          seriesSkill: z.string(),
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
      body.groupSkill,
      body.seriesSkill,
      body.atIndex,
    )
    if (result.isErr()) return mapError(result.error, res)
    return res.created(result.value)
  })

createRoute("PATCH", `${BASE}/:id`)
  .openapi({
    operationId: "updateSkillRoll",
    summary: "Update skill roll",
    description:
      "Correct group_skill or series_skill. The index is not editable.",
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
