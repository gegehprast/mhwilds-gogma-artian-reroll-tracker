import type { Result } from "@bunkit/result"
import { and, asc, eq, gte, inArray, lt, lte, max } from "drizzle-orm"
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
   * Delete all rolls with index < beforeIndex across all weapons belonging to the tracker,
   * then shift surviving rolls down by offset = beforeIndex - 1.
   * Returns { deleted, offset }.
   */
  public async deleteAndShiftByTrackerId(
    trackerId: string,
    beforeIndex: number,
  ): Promise<Result<{ deleted: number; offset: number }, DatabaseError>> {
    return this.wrapQuery(async () => {
      const offset = beforeIndex - 1

      const weaponIds = this.db
        .select({ id: weapons.id })
        .from(weapons)
        .where(eq(weapons.trackerId, trackerId))
        .all()
        .map((w) => w.id)

      if (weaponIds.length === 0) return { deleted: 0, offset }

      // Delete past rolls
      const deletedRows = await this.db
        .delete(bonusRolls)
        .where(
          and(
            inArray(bonusRolls.weaponId, weaponIds),
            lt(bonusRolls.index, beforeIndex),
          ),
        )
        .returning()

      if (offset === 0) return { deleted: deletedRows.length, offset }

      // Fetch surviving rolls, delete them, then re-insert with shifted indices
      // (in-place UPDATE violates the UNIQUE(weapon_id, index) constraint in SQLite
      // because rows are updated in arbitrary order)
      const survivors = this.db
        .select()
        .from(bonusRolls)
        .where(
          and(
            inArray(bonusRolls.weaponId, weaponIds),
            gte(bonusRolls.index, beforeIndex),
          ),
        )
        .all()

      if (survivors.length > 0) {
        await this.db.delete(bonusRolls).where(
          inArray(
            bonusRolls.id,
            survivors.map((r) => r.id),
          ),
        )

        await this.db
          .insert(bonusRolls)
          .values(survivors.map((r) => ({ ...r, index: r.index - offset })))
      }

      return { deleted: deletedRows.length, offset }
    }, "Failed to delete and shift bonus rolls")
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
