import type { Result } from "@bunkit/result"
import { and, asc, eq, gt, lte, max } from "drizzle-orm"
import type { DatabaseError } from "@/core/errors"
import { type NewSkillRoll, type SkillRoll, skillRolls } from "@/db/schemas"
import { weapons } from "@/db/schemas/weapons.schema"
import { BaseRepository } from "./base-repository"

export class SkillRollRepository extends BaseRepository {
  public async findById(
    id: string,
  ): Promise<Result<SkillRoll | null, DatabaseError>> {
    return this.wrapQuery(
      async () =>
        this.db.select().from(skillRolls).where(eq(skillRolls.id, id)).get() ??
        null,
      "Failed to find skill roll by ID",
    )
  }

  public async findMaxIndexByTrackerId(
    trackerId: string,
  ): Promise<Result<number, DatabaseError>> {
    return this.wrapQuery(async () => {
      const row = this.db
        .select({ maxIndex: max(skillRolls.index) })
        .from(skillRolls)
        .innerJoin(weapons, eq(skillRolls.weaponId, weapons.id))
        .where(eq(weapons.trackerId, trackerId))
        .get()
      return row?.maxIndex ?? 0
    }, "Failed to find max skill roll index")
  }

  public async findByWeaponId(
    weaponId: string,
  ): Promise<Result<SkillRoll[], DatabaseError>> {
    return this.wrapQuery(
      async () =>
        this.db
          .select()
          .from(skillRolls)
          .where(eq(skillRolls.weaponId, weaponId))
          .orderBy(asc(skillRolls.index))
          .all(),
      "Failed to find skill rolls by weapon ID",
    )
  }

  public async create(
    data: NewSkillRoll,
  ): Promise<Result<SkillRoll, DatabaseError>> {
    return this.wrapQuery(async () => {
      const result = this.db.insert(skillRolls).values(data).returning().get()
      if (!result) throw new Error("Insert returned no row")
      return result
    }, "Failed to create skill roll")
  }

  public async bulkCreate(
    data: NewSkillRoll[],
  ): Promise<Result<SkillRoll[], DatabaseError>> {
    return this.wrapQuery(
      async () => this.db.insert(skillRolls).values(data).returning().all(),
      "Failed to bulk create skill rolls",
    )
  }

  /**
   * Delete rolls where index > fromIndex AND index <= toIndex (exclusive start, inclusive end).
   * Returns the number of deleted rows.
   */
  public async deleteRange(
    weaponId: string,
    fromIndex: number,
    toIndex: number,
  ): Promise<Result<number, DatabaseError>> {
    return this.wrapQuery(async () => {
      const deleted = await this.db
        .delete(skillRolls)
        .where(
          and(
            eq(skillRolls.weaponId, weaponId),
            gt(skillRolls.index, fromIndex),
            lte(skillRolls.index, toIndex),
          ),
        )
        .returning()
      return deleted.length
    }, "Failed to delete skill roll range")
  }

  public async update(
    id: string,
    data: { groupSkill?: string; seriesSkill?: string },
  ): Promise<Result<SkillRoll | null, DatabaseError>> {
    return this.wrapQuery(
      async () =>
        this.db
          .update(skillRolls)
          .set({ ...data, updatedAt: Date.now() })
          .where(eq(skillRolls.id, id))
          .returning()
          .get() ?? null,
      "Failed to update skill roll",
    )
  }

  public async delete(id: string): Promise<Result<void, DatabaseError>> {
    return this.wrapQuery(async () => {
      await this.db.delete(skillRolls).where(eq(skillRolls.id, id))
    }, "Failed to delete skill roll")
  }
}

let instance: SkillRollRepository | null = null

export function getSkillRollRepository(): SkillRollRepository {
  if (!instance) instance = new SkillRollRepository()
  return instance
}
