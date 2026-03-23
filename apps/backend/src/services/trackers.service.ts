import type { Result } from "@bunkit/result"
import { err, ok } from "@bunkit/result"
import type { DatabaseError } from "@/core/errors"
import { NotFoundError } from "@/core/errors"
import {
  getTrackerRepository,
  type TrackerRepository,
} from "@/db/repositories/trackers.repository"
import type { Tracker } from "@/db/schemas"

export class TrackerService {
  private readonly repo: TrackerRepository

  public constructor() {
    this.repo = getTrackerRepository()
  }

  public async getById(
    id: string,
  ): Promise<Result<Tracker, NotFoundError | DatabaseError>> {
    const result = await this.repo.findById(id)
    if (result.isErr()) return err(result.error)
    if (!result.value)
      return err(new NotFoundError(`Tracker '${id}' not found`))
    return ok(result.value)
  }

  public async getOrCreate(
    id: string | undefined,
  ): Promise<Result<Tracker, DatabaseError>> {
    if (id) {
      const found = await this.repo.findById(id)
      if (found.isErr()) return err(found.error)
      if (found.value) return ok(found.value)
    }
    return this.repo.create()
  }

  public async updateName(
    id: string,
    name: string,
  ): Promise<Result<Tracker, NotFoundError | DatabaseError>> {
    const result = await this.repo.updateName(id, name)
    if (result.isErr()) return err(result.error)
    if (!result.value)
      return err(new NotFoundError(`Tracker '${id}' not found`))
    return ok(result.value)
  }

  public async setSkillIndex(
    id: string,
    index: number,
  ): Promise<Result<Tracker, NotFoundError | DatabaseError>> {
    const result = await this.repo.setSkillIndex(id, index)
    if (result.isErr()) return err(result.error)
    if (!result.value)
      return err(new NotFoundError(`Tracker '${id}' not found`))
    return ok(result.value)
  }

  public async setBonusIndex(
    id: string,
    index: number,
  ): Promise<Result<Tracker, NotFoundError | DatabaseError>> {
    const result = await this.repo.setBonusIndex(id, index)
    if (result.isErr()) return err(result.error)
    if (!result.value)
      return err(new NotFoundError(`Tracker '${id}' not found`))
    return ok(result.value)
  }
}

let instance: TrackerService | null = null

export function getTrackerService(): TrackerService {
  if (!instance) instance = new TrackerService()
  return instance
}
