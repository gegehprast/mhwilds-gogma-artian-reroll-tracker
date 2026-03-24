import { createRoute } from "@bunkit/server"
import { z } from "zod"
import { getBonusRollService } from "@/services/bonus-rolls.service"
import { mapError } from "./_helpers"

const BonusRollSchema = z
  .object({
    id: z.string(),
    index: z.number().int(),
    weaponId: z.string(),
    bonus1: z.string(),
    bonus2: z.string(),
    bonus3: z.string(),
    bonus4: z.string(),
    bonus5: z.string(),
    createdAt: z.number().int(),
    updatedAt: z.number().int(),
  })
  .meta({ id: "BonusRoll", title: "Bonus Roll" })

const CreateBonusRollBodySchema = z
  .object({
    bonus1: z.string().min(1),
    bonus2: z.string().min(1),
    bonus3: z.string().min(1),
    bonus4: z.string().min(1),
    bonus5: z.string().min(1),
    atIndex: z.number().int().min(1).optional(),
  })
  .meta({ id: "CreateBonusRollBody" })

const ImportBonusRollsBodySchema = z
  .object({
    selectedIndex: z.number().int().min(0),
    rolls: z.array(
      z.object({
        attemptNum: z.number().int().min(1),
        bonus1: z.string().min(1),
        bonus2: z.string().min(1),
        bonus3: z.string().min(1),
        bonus4: z.string().min(1),
        bonus5: z.string().min(1),
      }),
    ),
  })
  .meta({ id: "ImportBonusRollsBody" })

const UpdateBonusRollBodySchema = z
  .object({
    bonus1: z.string().min(1).optional(),
    bonus2: z.string().min(1).optional(),
    bonus3: z.string().min(1).optional(),
    bonus4: z.string().min(1).optional(),
    bonus5: z.string().min(1).optional(),
  })
  .meta({ id: "UpdateBonusRollBody" })

const BASE = "/api/trackers/:trackerId/weapons/:weaponId/bonus-rolls"

createRoute("GET", BASE)
  .openapi({
    operationId: "listBonusRolls",
    summary: "List bonus rolls",
    description: "Returns all bonus rolls for a weapon, ordered by index.",
    tags: ["Bonus Rolls"],
  })
  .response(z.array(BonusRollSchema))
  .errors([403, 404])
  .handler(async ({ params, res }) => {
    const service = getBonusRollService()
    const result = await service.list(params.weaponId, params.trackerId)
    if (result.isErr()) return mapError(result.error, res)
    return res.ok(result.value)
  })

createRoute("POST", BASE)
  .openapi({
    operationId: "createBonusRoll",
    summary: "Create bonus roll",
    description:
      "Creates a new bonus roll at the tracker's current bonus index, then increments the counter.",
    tags: ["Bonus Rolls"],
  })
  .body(CreateBonusRollBodySchema)
  .response(BonusRollSchema, { status: 201 })
  .errors([400, 403, 404])
  .handler(async ({ params, body, res }) => {
    const service = getBonusRollService()
    const result = await service.create(
      params.trackerId,
      params.weaponId,
      body.bonus1,
      body.bonus2,
      body.bonus3,
      body.bonus4,
      body.bonus5,
      body.atIndex,
    )
    if (result.isErr()) return mapError(result.error, res)
    return res.created(result.value)
  })

createRoute("PATCH", `${BASE}/:id`)
  .openapi({
    operationId: "updateBonusRoll",
    summary: "Update bonus roll",
    description:
      "Correct any of the five bonus stat columns. The index is not editable.",
    tags: ["Bonus Rolls"],
  })
  .body(UpdateBonusRollBodySchema)
  .response(BonusRollSchema)
  .errors([400, 403, 404])
  .handler(async ({ params, body, res }) => {
    const service = getBonusRollService()
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
    operationId: "deleteBonusRoll",
    summary: "Delete bonus roll",
    description: "Deletes a single bonus roll by ID.",
    tags: ["Bonus Rolls"],
  })
  .errors([403, 404])
  .handler(async ({ params, res }) => {
    const service = getBonusRollService()
    const result = await service.delete(
      params.id,
      params.weaponId,
      params.trackerId,
    )
    if (result.isErr()) return mapError(result.error, res)
    return res.noContent()
  })

createRoute("POST", `${BASE}/import`)
  .openapi({
    operationId: "importBonusRolls",
    summary: "Import bonus rolls",
    description:
      "Replaces a range of bonus rolls starting at selectedIndex+1 with the provided entries. Does not affect the tracker's bonus index counter.",
    tags: ["Bonus Rolls"],
  })
  .body(ImportBonusRollsBodySchema)
  .response(z.array(BonusRollSchema))
  .errors([400, 403, 404])
  .handler(async ({ params, body, res }) => {
    const service = getBonusRollService()
    const result = await service.importRolls(
      params.trackerId,
      params.weaponId,
      body.selectedIndex,
      body.rolls,
    )
    if (result.isErr()) return mapError(result.error, res)
    return res.ok(result.value)
  })
