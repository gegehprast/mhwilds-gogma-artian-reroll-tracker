import type { Result } from "@bunkit/result"
import { and, asc, eq, gte, inArray, lt, lte, max } from "drizzle-orm"
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

  public async findIdsByWeaponId(
    weaponId: string,
  ): Promise<Result<string[], DatabaseError>> {
    return this.wrapQuery(
      async () =>
        this.db
          .select({ id: skillRolls.id })
          .from(skillRolls)
          .where(eq(skillRolls.weaponId, weaponId))
          .all()
          .map((r) => r.id),
      "Failed to find skill roll IDs by weapon ID",
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
   * Delete rolls where fromIndex <= index <= toIndex.
   * Returns the IDs of deleted rows.
   */
  public async deleteRange(
    weaponId: string,
    fromIndex: number,
    toIndex: number,
  ): Promise<Result<string[], DatabaseError>> {
    return this.wrapQuery(async () => {
      const deleted = await this.db
        .delete(skillRolls)
        .where(
          and(
            eq(skillRolls.weaponId, weaponId),
            gte(skillRolls.index, fromIndex),
            lte(skillRolls.index, toIndex),
          ),
        )
        .returning({ id: skillRolls.id })
      return deleted.map((r) => r.id)
    }, "Failed to delete skill roll range")
  }

  /**
   * Delete all rolls with index < beforeIndex across all weapons belonging to the tracker,
   * then shift surviving rolls down by offset = beforeIndex - 1.
   * Returns { deleted, offset }.
   */
  public async deleteAndShiftByTrackerId(
    trackerId: string,
    beforeIndex: number,
  ): Promise<
    Result<
      { deleted: number; offset: number; deletedIds: string[] },
      DatabaseError
    >
  > {
    return this.wrapQuery(async () => {
      const offset = beforeIndex - 1

      const weaponIds = this.db
        .select({ id: weapons.id })
        .from(weapons)
        .where(eq(weapons.trackerId, trackerId))
        .all()
        .map((w) => w.id)

      if (weaponIds.length === 0) return { deleted: 0, offset, deletedIds: [] }

      // Delete past rolls
      const deletedRows = await this.db
        .delete(skillRolls)
        .where(
          and(
            inArray(skillRolls.weaponId, weaponIds),
            lt(skillRolls.index, beforeIndex),
          ),
        )
        .returning({ id: skillRolls.id })

      const deletedIds = deletedRows.map((r) => r.id)

      if (offset === 0)
        return { deleted: deletedIds.length, offset, deletedIds }

      // Fetch surviving rolls, delete them, then re-insert with shifted indices
      // (in-place UPDATE violates the UNIQUE(weapon_id, index) constraint in SQLite
      // because rows are updated in arbitrary order)
      const survivors = this.db
        .select()
        .from(skillRolls)
        .where(
          and(
            inArray(skillRolls.weaponId, weaponIds),
            gte(skillRolls.index, beforeIndex),
          ),
        )
        .all()

      if (survivors.length > 0) {
        await this.db.delete(skillRolls).where(
          inArray(
            skillRolls.id,
            survivors.map((r) => r.id),
          ),
        )

        await this.db
          .insert(skillRolls)
          .values(survivors.map((r) => ({ ...r, index: r.index - offset })))
      }

      return { deleted: deletedIds.length, offset, deletedIds }
    }, "Failed to delete and shift skill rolls")
  }

  public async update(
    id: string,
    data: { setSkill?: string; groupSkill?: string },
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
