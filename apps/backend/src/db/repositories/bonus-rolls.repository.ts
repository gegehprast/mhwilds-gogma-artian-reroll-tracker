import type { Result } from "@bunkit/result"
import { and, asc, eq, gte, lt, lte, max } from "drizzle-orm"
import type { DatabaseError } from "@/core/errors"
import { type BonusRoll, bonusRolls, type NewBonusRoll } from "@/db/schemas"
import { weapons } from "@/db/schemas/weapons.schema"
import { BaseRepository } from "./base-repository"

export class BonusRollRepository extends BaseRepository {
  public async findById(
    id: string,
  ): Promise<Result<BonusRoll | null, DatabaseError>> {
    return this.wrapQuery(
      async () =>
        this.db.select().from(bonusRolls).where(eq(bonusRolls.id, id)).get() ??
        null,
      "Failed to find bonus roll by ID",
    )
  }

  public async findMaxIndexByTrackerId(
    trackerId: string,
  ): Promise<Result<number, DatabaseError>> {
    return this.wrapQuery(async () => {
      const row = this.db
        .select({ maxIndex: max(bonusRolls.index) })
        .from(bonusRolls)
        .innerJoin(weapons, eq(bonusRolls.weaponId, weapons.id))
        .where(eq(weapons.trackerId, trackerId))
        .get()
      return row?.maxIndex ?? 0
    }, "Failed to find max bonus roll index")
  }

  public async findByWeaponId(
    weaponId: string,
  ): Promise<Result<BonusRoll[], DatabaseError>> {
    return this.wrapQuery(
      async () =>
        this.db
          .select()
          .from(bonusRolls)
          .where(eq(bonusRolls.weaponId, weaponId))
          .orderBy(asc(bonusRolls.index))
          .all(),
      "Failed to find bonus rolls by weapon ID",
    )
  }

  public async create(
    data: NewBonusRoll,
  ): Promise<Result<BonusRoll, DatabaseError>> {
    return this.wrapQuery(async () => {
      const result = this.db.insert(bonusRolls).values(data).returning().get()
      if (!result) throw new Error("Insert returned no row")
      return result
    }, "Failed to create bonus roll")
  }

  public async bulkCreate(
    data: NewBonusRoll[],
  ): Promise<Result<BonusRoll[], DatabaseError>> {
    return this.wrapQuery(
      async () => this.db.insert(bonusRolls).values(data).returning().all(),
      "Failed to bulk create bonus rolls",
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
        .delete(bonusRolls)
        .where(
          and(
            eq(bonusRolls.weaponId, weaponId),
            gte(bonusRolls.index, fromIndex),
            lte(bonusRolls.index, toIndex),
          ),
        )
        .returning()
      return deleted.length
    }, "Failed to delete bonus roll range")
  }

  /**
   * Delete all rolls with index < beforeIndex across all weapons belonging to the tracker.
   * Returns the number of deleted rows.
   */
  public async deleteBeforeIndexByTrackerId(
    trackerId: string,
    beforeIndex: number,
  ): Promise<Result<number, DatabaseError>> {
    return this.wrapQuery(async () => {
      const weaponsSubquery = this.db
        .select({ id: weapons.id })
        .from(weapons)
        .where(eq(weapons.trackerId, trackerId))
        .all()

      const weaponIds = weaponsSubquery.map((w) => w.id)
      if (weaponIds.length === 0) return 0

      let total = 0
      for (const weaponId of weaponIds) {
        const deleted = await this.db
          .delete(bonusRolls)
          .where(
            and(
              eq(bonusRolls.weaponId, weaponId),
              lt(bonusRolls.index, beforeIndex),
            ),
          )
          .returning()
        total += deleted.length
      }
      return total
    }, "Failed to delete past bonus rolls")
  }

  public async update(
    id: string,
    data: {
      bonus1?: string
      bonus2?: string
      bonus3?: string
      bonus4?: string
      bonus5?: string
    },
  ): Promise<Result<BonusRoll | null, DatabaseError>> {
    return this.wrapQuery(
      async () =>
        this.db
          .update(bonusRolls)
          .set({ ...data, updatedAt: Date.now() })
          .where(eq(bonusRolls.id, id))
          .returning()
          .get() ?? null,
      "Failed to update bonus roll",
    )
  }

  public async delete(id: string): Promise<Result<void, DatabaseError>> {
    return this.wrapQuery(async () => {
      await this.db.delete(bonusRolls).where(eq(bonusRolls.id, id))
    }, "Failed to delete bonus roll")
  }
}

let instance: BonusRollRepository | null = null

export function getBonusRollRepository(): BonusRollRepository {
  if (!instance) instance = new BonusRollRepository()
  return instance
}
