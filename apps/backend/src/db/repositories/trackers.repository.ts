import type { Result } from "@bunkit/result"
import { eq, sql } from "drizzle-orm"
import type { DatabaseError } from "@/core/errors"
import { type NewTracker, type Tracker, trackers } from "@/db/schemas"
import { BaseRepository } from "./base-repository"

export class TrackerRepository extends BaseRepository {
  public async findById(
    id: string,
  ): Promise<Result<Tracker | null, DatabaseError>> {
    return this.wrapQuery(
      async () =>
        this.db.select().from(trackers).where(eq(trackers.id, id)).get() ??
        null,
      "Failed to find tracker by ID",
    )
  }

  public async create(name?: string): Promise<Result<Tracker, DatabaseError>> {
    const values: NewTracker = { name: name ?? "My Tracker" }
    return this.wrapQuery(async () => {
      const result = this.db.insert(trackers).values(values).returning().get()
      if (!result) throw new Error("Insert returned no row")
      return result
    }, "Failed to create tracker")
  }

  public async updateName(
    id: string,
    name: string,
  ): Promise<Result<Tracker | null, DatabaseError>> {
    return this.wrapQuery(
      async () =>
        this.db
          .update(trackers)
          .set({ name })
          .where(eq(trackers.id, id))
          .returning()
          .get() ?? null,
      "Failed to update tracker name",
    )
  }

  public async setSkillIndex(
    id: string,
    index: number,
  ): Promise<Result<Tracker | null, DatabaseError>> {
    return this.wrapQuery(
      async () =>
        this.db
          .update(trackers)
          .set({ skillIndex: index })
          .where(eq(trackers.id, id))
          .returning()
          .get() ?? null,
      "Failed to set skill index",
    )
  }

  public async setBonusIndex(
    id: string,
    index: number,
  ): Promise<Result<Tracker | null, DatabaseError>> {
    return this.wrapQuery(
      async () =>
        this.db
          .update(trackers)
          .set({ bonusIndex: index })
          .where(eq(trackers.id, id))
          .returning()
          .get() ?? null,
      "Failed to set bonus index",
    )
  }

  public async incrementSkillIndex(
    id: string,
  ): Promise<Result<Tracker | null, DatabaseError>> {
    return this.wrapQuery(
      async () =>
        this.db
          .update(trackers)
          .set({ skillIndex: sql`${trackers.skillIndex} + 1` })
          .where(eq(trackers.id, id))
          .returning()
          .get() ?? null,
      "Failed to increment skill index",
    )
  }

  public async incrementBonusIndex(
    id: string,
  ): Promise<Result<Tracker | null, DatabaseError>> {
    return this.wrapQuery(
      async () =>
        this.db
          .update(trackers)
          .set({ bonusIndex: sql`${trackers.bonusIndex} + 1` })
          .where(eq(trackers.id, id))
          .returning()
          .get() ?? null,
      "Failed to increment bonus index",
    )
  }
}

let instance: TrackerRepository | null = null

export function getTrackerRepository(): TrackerRepository {
  if (!instance) instance = new TrackerRepository()
  return instance
}
