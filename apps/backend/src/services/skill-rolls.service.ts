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
import type { NewSkillRoll, SkillRoll } from "@/db/schemas"

export interface ImportSkillRollEntry {
  readonly attemptNum: number
  readonly groupSkill: string
  readonly seriesSkill: string
}

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
  ): Promise<
    Result<SkillRoll, NotFoundError | ForbiddenError | DatabaseError>
  > {
    const check = await this.assertWeaponOwnership(weaponId, trackerId)
    if (check.isErr()) return err(check.error)

    const maxIndex = await this.repo.findMaxIndexByTrackerId(trackerId)
    if (maxIndex.isErr()) return err(maxIndex.error)

    const created = await this.repo.create({
      weaponId,
      index: maxIndex.value + 1,
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

  /**
   * Import rolls into a weapon at a specific position.
   *
   * Deletes existing rolls where index > selectedIndex AND index <= selectedIndex + entries.length,
   * then inserts new rolls starting at selectedIndex + 1.
   *
   * The tracker's skillIndex counter is NOT modified.
   */
  public async importRolls(
    trackerId: string,
    weaponId: string,
    selectedIndex: number,
    entries: ImportSkillRollEntry[],
  ): Promise<
    Result<SkillRoll[], NotFoundError | ForbiddenError | DatabaseError>
  > {
    const check = await this.assertWeaponOwnership(weaponId, trackerId)
    if (check.isErr()) return err(check.error)

    const toIndex = selectedIndex + entries.length
    const deleteResult = await this.repo.deleteRange(
      weaponId,
      selectedIndex,
      toIndex,
    )
    if (deleteResult.isErr()) return err(deleteResult.error)

    const sorted = [...entries].sort((a, b) => a.attemptNum - b.attemptNum)
    const newRolls: NewSkillRoll[] = sorted.map((entry, i) => ({
      weaponId,
      index: selectedIndex + 1 + i,
      groupSkill: entry.groupSkill,
      seriesSkill: entry.seriesSkill,
    }))

    if (newRolls.length === 0) return ok([])
    return this.repo.bulkCreate(newRolls)
  }
}

let instance: SkillRollService | null = null

export function getSkillRollService(): SkillRollService {
  if (!instance) instance = new SkillRollService()
  return instance
}
