import type { Result } from "@bunkit/result"
import { err, ok } from "@bunkit/result"
import type { DatabaseError } from "@/core/errors"
import { ForbiddenError, NotFoundError } from "@/core/errors"
import {
  type BonusRollRepository,
  getBonusRollRepository,
} from "@/db/repositories/bonus-rolls.repository"
import {
  getWeaponRepository,
  type WeaponRepository,
} from "@/db/repositories/weapons.repository"
import type { BonusRoll, NewBonusRoll } from "@/db/schemas"

export interface ImportBonusRollEntry {
  readonly attemptNum: number
  readonly bonus1: string
  readonly bonus2: string
  readonly bonus3: string
  readonly bonus4: string
  readonly bonus5: string
}

export class BonusRollService {
  private readonly repo: BonusRollRepository
  private readonly weaponRepo: WeaponRepository

  public constructor() {
    this.repo = getBonusRollRepository()
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
    Result<BonusRoll[], NotFoundError | ForbiddenError | DatabaseError>
  > {
    const check = await this.assertWeaponOwnership(weaponId, trackerId)
    if (check.isErr()) return err(check.error)
    return this.repo.findByWeaponId(weaponId)
  }

  public async create(
    trackerId: string,
    weaponId: string,
    bonus1: string,
    bonus2: string,
    bonus3: string,
    bonus4: string,
    bonus5: string,
    atIndex?: number,
  ): Promise<
    Result<BonusRoll, NotFoundError | ForbiddenError | DatabaseError>
  > {
    const check = await this.assertWeaponOwnership(weaponId, trackerId)
    if (check.isErr()) return err(check.error)

    const maxIndex = await this.repo.findMaxIndexByTrackerId(trackerId)
    if (maxIndex.isErr()) return err(maxIndex.error)

    const created = await this.repo.create({
      weaponId,
      index: atIndex ?? maxIndex.value + 1,
      bonus1,
      bonus2,
      bonus3,
      bonus4,
      bonus5,
    })
    if (created.isErr()) return err(created.error)

    return ok(created.value)
  }

  public async update(
    id: string,
    weaponId: string,
    trackerId: string,
    data: {
      bonus1?: string
      bonus2?: string
      bonus3?: string
      bonus4?: string
      bonus5?: string
    },
  ): Promise<
    Result<BonusRoll, NotFoundError | ForbiddenError | DatabaseError>
  > {
    const check = await this.assertWeaponOwnership(weaponId, trackerId)
    if (check.isErr()) return err(check.error)

    const roll = await this.repo.findById(id)
    if (roll.isErr()) return err(roll.error)
    if (!roll.value)
      return err(new NotFoundError(`Bonus roll '${id}' not found`))
    if (roll.value.weaponId !== weaponId)
      return err(
        new ForbiddenError("Bonus roll does not belong to this weapon"),
      )

    const updated = await this.repo.update(id, data)
    if (updated.isErr()) return err(updated.error)
    if (!updated.value)
      return err(new NotFoundError(`Bonus roll '${id}' not found after update`))
    return ok(updated.value)
  }

  public async delete(
    id: string,
    weaponId: string,
    trackerId: string,
  ): Promise<Result<void, NotFoundError | ForbiddenError | DatabaseError>> {
    const check = await this.assertWeaponOwnership(weaponId, trackerId)
    if (check.isErr()) return err(check.error)

    const roll = await this.repo.findById(id)
    if (roll.isErr()) return err(roll.error)
    if (!roll.value)
      return err(new NotFoundError(`Bonus roll '${id}' not found`))
    if (roll.value.weaponId !== weaponId)
      return err(
        new ForbiddenError("Bonus roll does not belong to this weapon"),
      )

    return this.repo.delete(id)
  }

  /**
   * Import rolls into a weapon at a specific position.
   *
   * Deletes existing rolls where index > selectedIndex AND index <= selectedIndex + entries.length,
   * then inserts new rolls starting at selectedIndex + 1.
   *
   * The tracker's bonusIndex counter is NOT modified.
   */
  public async importRolls(
    trackerId: string,
    weaponId: string,
    selectedIndex: number,
    entries: ImportBonusRollEntry[],
  ): Promise<
    Result<BonusRoll[], NotFoundError | ForbiddenError | DatabaseError>
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
    const newRolls: NewBonusRoll[] = sorted.map((entry, i) => ({
      weaponId,
      index: selectedIndex + 1 + i,
      bonus1: entry.bonus1,
      bonus2: entry.bonus2,
      bonus3: entry.bonus3,
      bonus4: entry.bonus4,
      bonus5: entry.bonus5,
    }))

    if (newRolls.length === 0) return ok([])
    return this.repo.bulkCreate(newRolls)
  }
}

let instance: BonusRollService | null = null

export function getBonusRollService(): BonusRollService {
  if (!instance) instance = new BonusRollService()
  return instance
}
