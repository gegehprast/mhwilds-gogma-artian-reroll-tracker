import type { Result } from "@bunkit/result"
import { err, ok } from "@bunkit/result"
import { MAX_ROLL_INDEX } from "@/config/game-constants"
import type { DatabaseError } from "@/core/errors"
import { ForbiddenError, NotFoundError, ValidationError } from "@/core/errors"
import {
  type CommentRepository,
  getCommentRepository,
} from "@/db/repositories/comments.repository"
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
  private readonly commentRepo: CommentRepository

  public constructor() {
    this.repo = getSkillRollRepository()
    this.weaponRepo = getWeaponRepository()
    this.commentRepo = getCommentRepository()
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
    setSkill: string,
    groupSkill: string,
    atIndex?: number,
  ): Promise<
    Result<
      SkillRoll,
      NotFoundError | ForbiddenError | ValidationError | DatabaseError
    >
  > {
    const check = await this.assertWeaponOwnership(weaponId, trackerId)
    if (check.isErr()) return err(check.error)

    const maxIndex = await this.repo.findMaxIndexByTrackerId(trackerId)
    if (maxIndex.isErr()) return err(maxIndex.error)

    const targetIndex = atIndex ?? maxIndex.value + 1
    if (targetIndex > MAX_ROLL_INDEX) {
      return err(
        new ValidationError(`Roll index cannot exceed ${MAX_ROLL_INDEX}`),
      )
    }

    const created = await this.repo.create({
      weaponId,
      index: targetIndex,
      setSkill,
      groupSkill,
    })
    if (created.isErr()) return err(created.error)

    return ok(created.value)
  }

  public async update(
    id: string,
    weaponId: string,
    trackerId: string,
    data: { setSkill?: string; groupSkill?: string },
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
    const cleanup = await this.commentRepo.deleteByRollIds([id])
    if (cleanup.isErr()) return err(cleanup.error)
    return this.repo.delete(id)
  }

  public async deletePastRolls(
    trackerId: string,
    beforeIndex: number,
  ): Promise<Result<{ deleted: number; offset: number }, DatabaseError>> {
    const result = await this.repo.deleteAndShiftByTrackerId(
      trackerId,
      beforeIndex,
    )
    if (result.isErr()) return err(result.error)
    const { deleted, offset, deletedIds } = result.value
    const cleanup = await this.commentRepo.deleteByRollIds(deletedIds)
    if (cleanup.isErr()) return err(cleanup.error)
    return ok({ deleted, offset })
  }

  public async import(
    trackerId: string,
    weaponId: string,
    fromIndex: number,
    rolls: { setSkill: string; groupSkill: string }[],
  ): Promise<
    Result<SkillRoll[], NotFoundError | ForbiddenError | DatabaseError>
  > {
    const check = await this.assertWeaponOwnership(weaponId, trackerId)
    if (check.isErr()) return err(check.error)

    const toIndex = fromIndex + rolls.length - 1
    if (toIndex > MAX_ROLL_INDEX) {
      return err(
        new ValidationError(`Roll index cannot exceed ${MAX_ROLL_INDEX}`),
      )
    }
    const deleted = await this.repo.deleteRange(weaponId, fromIndex, toIndex)
    if (deleted.isErr()) return err(deleted.error)

    const cleanup = await this.commentRepo.deleteByRollIds(deleted.value)
    if (cleanup.isErr()) return err(cleanup.error)

    if (rolls.length === 0) return ok([])

    const toInsert = rolls.map((r, i) => ({
      weaponId,
      index: fromIndex + i,
      setSkill: r.setSkill,
      groupSkill: r.groupSkill,
    }))

    return this.repo.bulkCreate(toInsert)
  }
}

let instance: SkillRollService | null = null

export function getSkillRollService(): SkillRollService {
  if (!instance) instance = new SkillRollService()
  return instance
}
