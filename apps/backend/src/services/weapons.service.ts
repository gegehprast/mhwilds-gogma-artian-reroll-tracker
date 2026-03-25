import type { Result } from "@bunkit/result"
import { err, ok } from "@bunkit/result"
import type { Element, WeaponType } from "@/config/game-constants"
import type { DatabaseError } from "@/core/errors"
import { ForbiddenError, NotFoundError } from "@/core/errors"
import {
  type BonusRollRepository,
  getBonusRollRepository,
} from "@/db/repositories/bonus-rolls.repository"
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
import type { Weapon } from "@/db/schemas"

export class WeaponService {
  private readonly repo: WeaponRepository
  private readonly skillRollRepo: SkillRollRepository
  private readonly bonusRollRepo: BonusRollRepository
  private readonly commentRepo: CommentRepository

  public constructor() {
    this.repo = getWeaponRepository()
    this.skillRollRepo = getSkillRollRepository()
    this.bonusRollRepo = getBonusRollRepository()
    this.commentRepo = getCommentRepository()
  }

  public async listByTracker(
    trackerId: string,
  ): Promise<Result<Weapon[], DatabaseError>> {
    return this.repo.findByTrackerId(trackerId)
  }

  public async getById(
    id: string,
    trackerId: string,
  ): Promise<Result<Weapon, NotFoundError | ForbiddenError | DatabaseError>> {
    const result = await this.repo.findById(id)
    if (result.isErr()) return err(result.error)
    if (!result.value) return err(new NotFoundError(`Weapon '${id}' not found`))
    if (result.value.trackerId !== trackerId)
      return err(new ForbiddenError("Weapon does not belong to this tracker"))
    return ok(result.value)
  }

  public async findOrCreate(
    trackerId: string,
    weaponType: WeaponType,
    element: Element,
  ): Promise<Result<Weapon, DatabaseError>> {
    const existing = await this.repo.findByTrackerAndTypeAndElement(
      trackerId,
      weaponType,
      element,
    )
    if (existing.isErr()) return err(existing.error)
    if (existing.value) return ok(existing.value)
    return this.repo.create({ trackerId, weaponType, element })
  }

  public async delete(
    id: string,
    trackerId: string,
  ): Promise<Result<void, NotFoundError | ForbiddenError | DatabaseError>> {
    const check = await this.getById(id, trackerId)
    if (check.isErr()) return err(check.error)

    // Clean up comments for all rolls on this weapon before cascade deletes them
    const skillIds = await this.skillRollRepo.findIdsByWeaponId(id)
    if (skillIds.isErr()) return err(skillIds.error)
    const bonusIds = await this.bonusRollRepo.findIdsByWeaponId(id)
    if (bonusIds.isErr()) return err(bonusIds.error)
    const commentCleanup = await this.commentRepo.deleteByRollIds([
      ...skillIds.value,
      ...bonusIds.value,
    ])
    if (commentCleanup.isErr()) return err(commentCleanup.error)

    return this.repo.delete(id)
  }

  public async reorder(
    trackerId: string,
    ids: string[],
  ): Promise<Result<void, ForbiddenError | DatabaseError>> {
    const existing = await this.repo.findByTrackerId(trackerId)
    if (existing.isErr()) return err(existing.error)
    const validIds = new Set(existing.value.map((w) => w.id))
    for (const id of ids) {
      if (!validIds.has(id))
        return err(
          new ForbiddenError(`Weapon '${id}' does not belong to this tracker`),
        )
    }
    return this.repo.reorderAll(ids)
  }
}

let instance: WeaponService | null = null

export function getWeaponService(): WeaponService {
  if (!instance) instance = new WeaponService()
  return instance
}
