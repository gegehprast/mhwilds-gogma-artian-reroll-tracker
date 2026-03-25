import type { Result } from "@bunkit/result"
import { err, ok } from "@bunkit/result"
import type { DatabaseError } from "@/core/errors"
import { ForbiddenError, NotFoundError, ValidationError } from "@/core/errors"
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
import type { Comment, CommentColor, CommentRollType } from "@/db/schemas"

const MAX_COMMENTS_PER_ROLL = 5

export class CommentService {
  private readonly repo: CommentRepository
  private readonly skillRollRepo: SkillRollRepository
  private readonly bonusRollRepo: BonusRollRepository
  private readonly weaponRepo: WeaponRepository

  public constructor() {
    this.repo = getCommentRepository()
    this.skillRollRepo = getSkillRollRepository()
    this.bonusRollRepo = getBonusRollRepository()
    this.weaponRepo = getWeaponRepository()
  }

  private async assertRollOwnership(
    rollId: string,
    rollType: CommentRollType,
    trackerId: string,
  ): Promise<Result<void, NotFoundError | ForbiddenError | DatabaseError>> {
    let weaponId: string

    if (rollType === "skill") {
      const roll = await this.skillRollRepo.findById(rollId)
      if (roll.isErr()) return err(roll.error)
      if (!roll.value)
        return err(new NotFoundError(`Skill roll '${rollId}' not found`))
      weaponId = roll.value.weaponId
    } else {
      const roll = await this.bonusRollRepo.findById(rollId)
      if (roll.isErr()) return err(roll.error)
      if (!roll.value)
        return err(new NotFoundError(`Bonus roll '${rollId}' not found`))
      weaponId = roll.value.weaponId
    }

    const weapon = await this.weaponRepo.findById(weaponId)
    if (weapon.isErr()) return err(weapon.error)
    if (!weapon.value) return err(new NotFoundError(`Weapon not found`))
    if (weapon.value.trackerId !== trackerId)
      return err(new ForbiddenError("Roll does not belong to this tracker"))

    return ok(undefined)
  }

  private async assertCommentOwnership(
    commentId: string,
    trackerId: string,
  ): Promise<Result<Comment, NotFoundError | ForbiddenError | DatabaseError>> {
    const comment = await this.repo.findById(commentId)
    if (comment.isErr()) return err(comment.error)
    if (!comment.value)
      return err(new NotFoundError(`Comment '${commentId}' not found`))

    const ownership = await this.assertRollOwnership(
      comment.value.rollId,
      comment.value.rollType,
      trackerId,
    )
    if (ownership.isErr()) return err(ownership.error)

    return ok(comment.value)
  }

  public async list(
    rollId: string,
    rollType: CommentRollType,
    trackerId: string,
  ): Promise<
    Result<Comment[], NotFoundError | ForbiddenError | DatabaseError>
  > {
    const check = await this.assertRollOwnership(rollId, rollType, trackerId)
    if (check.isErr()) return err(check.error)
    return this.repo.findByRoll(rollId, rollType)
  }

  public async create(
    rollId: string,
    rollType: CommentRollType,
    trackerId: string,
    content: string,
    color: CommentColor,
  ): Promise<
    Result<
      Comment,
      NotFoundError | ForbiddenError | ValidationError | DatabaseError
    >
  > {
    const check = await this.assertRollOwnership(rollId, rollType, trackerId)
    if (check.isErr()) return err(check.error)

    const count = await this.repo.countByRoll(rollId, rollType)
    if (count.isErr()) return err(count.error)
    if (count.value >= MAX_COMMENTS_PER_ROLL)
      return err(
        new ValidationError(
          `Maximum of ${MAX_COMMENTS_PER_ROLL} comments per roll allowed`,
        ),
      )

    return this.repo.create({ rollId, rollType, content, color })
  }

  public async update(
    id: string,
    trackerId: string,
    data: { content?: string; color?: CommentColor },
  ): Promise<Result<Comment, NotFoundError | ForbiddenError | DatabaseError>> {
    const existing = await this.assertCommentOwnership(id, trackerId)
    if (existing.isErr()) return err(existing.error)

    const updated = await this.repo.update(id, data)
    if (updated.isErr()) return err(updated.error)
    if (!updated.value)
      return err(new NotFoundError(`Comment '${id}' not found after update`))

    return ok(updated.value)
  }

  public async delete(
    id: string,
    trackerId: string,
  ): Promise<Result<void, NotFoundError | ForbiddenError | DatabaseError>> {
    const existing = await this.assertCommentOwnership(id, trackerId)
    if (existing.isErr()) return err(existing.error)

    return this.repo.delete(id)
  }

  public async cleanupDangling(): Promise<Result<number, DatabaseError>> {
    return this.repo.deleteOrphaned()
  }
}

let instance: CommentService | null = null

export function getCommentService(): CommentService {
  if (!instance) instance = new CommentService()
  return instance
}
