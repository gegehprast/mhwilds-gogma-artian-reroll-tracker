import type { Result } from "@bunkit/result"
import { err, ok } from "@bunkit/result"
import type { DatabaseError } from "@/core/errors"
import { ForbiddenError, NotFoundError } from "@/core/errors"
import {
  getSkillRollRepository,
  type SkillRollRepository,
} from "@/db/repositories/skill-rolls.repository"
import {
  getWeaponRepository,
  type WeaponRepository,
} from "@/db/repositories/weapons.repository"
import type { SkillRoll } from "@/db/schemas"

export class SkillRollService {
  private readonly repo: SkillRollRepository
  private readonly weaponRepo: WeaponRepository

  public constructor() {
    this.repo = getSkillRollRepository()
    this.weaponRepo = getWeaponRepository()
  }

  private async assertWeaponOwnership(
    weaponId: string,
    trackerId: string,
  ): Promise<Result<void, NotFoundError | ForbiddenError | DatabaseError>> {
    const weapon = await this.weaponRepo.findById(weaponId)
    if (weapon.isErr()) return err(weapon.error)
    if (!weapon.value)
      return err(new NotFoundError(`Weapon '${weaponId}' not found`))
    if (weapon.value.trackerId !== trackerId)
      return err(new ForbiddenError("Weapon does not belong to this tracker"))
    return ok(undefined)
  }

  public async list(
    weaponId: string,
    trackerId: string,
  ): Promise<
    Result<SkillRoll[], NotFoundError | ForbiddenError | DatabaseError>
  > {
    const check = await this.assertWeaponOwnership(weaponId, trackerId)
    if (check.isErr()) return err(check.error)
    return this.repo.findByWeaponId(weaponId)
  }

  public async create(
    trackerId: string,
    weaponId: string,
    groupSkill: string,
    seriesSkill: string,
    atIndex?: number,
  ): Promise<
    Result<SkillRoll, NotFoundError | ForbiddenError | DatabaseError>
  > {
    const check = await this.assertWeaponOwnership(weaponId, trackerId)
    if (check.isErr()) return err(check.error)

    const maxIndex = await this.repo.findMaxIndexByTrackerId(trackerId)
    if (maxIndex.isErr()) return err(maxIndex.error)

    const created = await this.repo.create({
      weaponId,
      index: atIndex ?? maxIndex.value + 1,
      groupSkill,
      seriesSkill,
    })
    if (created.isErr()) return err(created.error)

    return ok(created.value)
  }

  public async update(
    id: string,
    weaponId: string,
    trackerId: string,
    data: { groupSkill?: string; seriesSkill?: string },
  ): Promise<
    Result<SkillRoll, NotFoundError | ForbiddenError | DatabaseError>
  > {
    const check = await this.assertWeaponOwnership(weaponId, trackerId)
    if (check.isErr()) return err(check.error)

    const roll = await this.repo.findById(id)
    if (roll.isErr()) return err(roll.error)
    if (!roll.value)
      return err(new NotFoundError(`Skill roll '${id}' not found`))
    if (roll.value.weaponId !== weaponId)
      return err(
        new ForbiddenError("Skill roll does not belong to this weapon"),
      )

    const updated = await this.repo.update(id, data)
    if (updated.isErr()) return err(updated.error)
    if (!updated.value)
      return err(new NotFoundError(`Skill roll '${id}' not found after update`))
    return ok(updated.value)
  }

  public async delete(
    id: string,
    _weaponId: string,
    _trackerId: string,
  ): Promise<Result<void, NotFoundError | ForbiddenError | DatabaseError>> {
    return this.repo.delete(id)
  }

  public async import(
    trackerId: string,
    weaponId: string,
    fromIndex: number,
    rolls: { groupSkill: string; seriesSkill: string }[],
  ): Promise<
    Result<SkillRoll[], NotFoundError | ForbiddenError | DatabaseError>
  > {
    const check = await this.assertWeaponOwnership(weaponId, trackerId)
    if (check.isErr()) return err(check.error)

    const toIndex = fromIndex + rolls.length - 1
    const deleted = await this.repo.deleteRange(weaponId, fromIndex, toIndex)
    if (deleted.isErr()) return err(deleted.error)

    if (rolls.length === 0) return ok([])

    const toInsert = rolls.map((r, i) => ({
      weaponId,
      index: fromIndex + i,
      groupSkill: r.groupSkill,
      seriesSkill: r.seriesSkill,
    }))

    return this.repo.bulkCreate(toInsert)
  }
}

let instance: SkillRollService | null = null

export function getSkillRollService(): SkillRollService {
  if (!instance) instance = new SkillRollService()
  return instance
}
