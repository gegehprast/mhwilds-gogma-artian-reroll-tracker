import { createRoute } from "@bunkit/server"
import { z } from "zod"
import { ELEMENTS, WEAPON_TYPES } from "@/config/game-constants"
import { getWeaponService } from "@/services/weapons.service"
import { mapError } from "./_helpers"

const WeaponTypeSchema = z
  .enum(WEAPON_TYPES)
  .meta({ id: "WeaponType", title: "WeaponType" })
const ElementSchema = z.enum(ELEMENTS).meta({ id: "Element", title: "Element" })

const WeaponSchema = z
  .object({
    id: z.string(),
    trackerId: z.string(),
    weaponType: WeaponTypeSchema,
    element: ElementSchema,
    sortOrder: z.number().int(),
    createdAt: z.number().int(),
    updatedAt: z.number().int(),
  })
  .meta({ id: "Weapon", title: "Weapon" })

const CreateWeaponBodySchema = z
  .object({
    weaponType: WeaponTypeSchema,
    element: ElementSchema,
  })
  .meta({ id: "CreateWeaponBody" })

const ReorderWeaponsBodySchema = z
  .object({ ids: z.array(z.string()) })
  .meta({ id: "ReorderWeaponsBody" })

createRoute("GET", "/api/trackers/:trackerId/weapons")
  .openapi({
    operationId: "listWeapons",
    summary: "List weapons",
    description: "Returns all weapons for a tracker.",
    tags: ["Weapons"],
  })
  .response(z.array(WeaponSchema))
  .handler(async ({ params, res }) => {
    const service = getWeaponService()
    const result = await service.listByTracker(params.trackerId)
    if (result.isErr()) return mapError(result.error, res)
    return res.ok(result.value)
  })

createRoute("POST", "/api/trackers/:trackerId/weapons")
  .openapi({
    operationId: "findOrCreateWeapon",
    summary: "Find or create weapon",
    description:
      "Returns an existing weapon matching the type+element within the tracker, or creates one.",
    tags: ["Weapons"],
  })
  .body(CreateWeaponBodySchema)
  .response(WeaponSchema, { status: 200 })
  .errors([400])
  .handler(async ({ params, body, res }) => {
    const service = getWeaponService()
    const result = await service.findOrCreate(
      params.trackerId,
      body.weaponType,
      body.element,
    )
    if (result.isErr()) return mapError(result.error, res)
    return res.ok(result.value)
  })

createRoute("DELETE", "/api/trackers/:trackerId/weapons/:id")
  .openapi({
    operationId: "deleteWeapon",
    summary: "Delete weapon",
    description: "Deletes a weapon and all its rolls.",
    tags: ["Weapons"],
  })
  .errors([403, 404])
  .handler(async ({ params, res }) => {
    const service = getWeaponService()
    const result = await service.delete(params.id, params.trackerId)
    if (result.isErr()) return mapError(result.error, res)
    return res.noContent()
  })

createRoute("PUT", "/api/trackers/:trackerId/weapons/reorder")
  .openapi({
    operationId: "reorderWeapons",
    summary: "Reorder weapons",
    description:
      "Sets the display order of weapons by providing an ordered list of IDs.",
    tags: ["Weapons"],
  })
  .body(ReorderWeaponsBodySchema)
  .errors([403])
  .handler(async ({ params, body, res }) => {
    const service = getWeaponService()
    const result = await service.reorder(params.trackerId, body.ids)
    if (result.isErr()) return mapError(result.error, res)
    return res.noContent()
  })
