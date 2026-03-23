import type { Result } from "@bunkit/result"
import { and, eq } from "drizzle-orm"
import type { Element, WeaponType } from "@/config/game-constants"
import type { DatabaseError } from "@/core/errors"
import { type NewWeapon, type Weapon, weapons } from "@/db/schemas"
import { BaseRepository } from "./base-repository"

export class WeaponRepository extends BaseRepository {
  public async findById(
    id: string,
  ): Promise<Result<Weapon | null, DatabaseError>> {
    return this.wrapQuery(
      async () =>
        this.db.select().from(weapons).where(eq(weapons.id, id)).get() ?? null,
      "Failed to find weapon by ID",
    )
  }

  public async findByTrackerId(
    trackerId: string,
  ): Promise<Result<Weapon[], DatabaseError>> {
    return this.wrapQuery(
      async () =>
        this.db
          .select()
          .from(weapons)
          .where(eq(weapons.trackerId, trackerId))
          .all(),
      "Failed to find weapons by tracker ID",
    )
  }

  public async findByTrackerAndTypeAndElement(
    trackerId: string,
    weaponType: WeaponType,
    element: Element,
  ): Promise<Result<Weapon | null, DatabaseError>> {
    return this.wrapQuery(
      async () =>
        this.db
          .select()
          .from(weapons)
          .where(
            and(
              eq(weapons.trackerId, trackerId),
              eq(weapons.weaponType, weaponType),
              eq(weapons.element, element),
            ),
          )
          .get() ?? null,
      "Failed to find weapon by tracker, type and element",
    )
  }

  public async create(data: NewWeapon): Promise<Result<Weapon, DatabaseError>> {
    return this.wrapQuery(async () => {
      const result = this.db.insert(weapons).values(data).returning().get()
      if (!result) throw new Error("Insert returned no row")
      return result
    }, "Failed to create weapon")
  }

  public async delete(id: string): Promise<Result<void, DatabaseError>> {
    return this.wrapQuery(async () => {
      await this.db.delete(weapons).where(eq(weapons.id, id))
    }, "Failed to delete weapon")
  }
}

let instance: WeaponRepository | null = null

export function getWeaponRepository(): WeaponRepository {
  if (!instance) instance = new WeaponRepository()
  return instance
}
