import type { Result } from "@bunkit/result"
import { and, eq } from "drizzle-orm"
import type { DatabaseError } from "@/core/errors"
import {
  type Comment,
  type CommentColor,
  type CommentRollType,
  comments,
  type NewComment,
} from "@/db/schemas"
import { BaseRepository } from "./base-repository"

export class CommentRepository extends BaseRepository {
  public async findByRoll(
    rollId: string,
    rollType: CommentRollType,
  ): Promise<Result<Comment[], DatabaseError>> {
    return this.wrapQuery(
      async () =>
        this.db
          .select()
          .from(comments)
          .where(
            and(eq(comments.rollId, rollId), eq(comments.rollType, rollType)),
          )
          .all(),
      "Failed to find comments for roll",
    )
  }

  public async countByRoll(
    rollId: string,
    rollType: CommentRollType,
  ): Promise<Result<number, DatabaseError>> {
    return this.wrapQuery(
      async () =>
        this.db
          .select()
          .from(comments)
          .where(
            and(eq(comments.rollId, rollId), eq(comments.rollType, rollType)),
          )
          .all().length,
      "Failed to count comments for roll",
    )
  }

  public async findById(
    id: string,
  ): Promise<Result<Comment | null, DatabaseError>> {
    return this.wrapQuery(
      async () =>
        this.db.select().from(comments).where(eq(comments.id, id)).get() ??
        null,
      "Failed to find comment by ID",
    )
  }

  public async create(
    data: NewComment,
  ): Promise<Result<Comment, DatabaseError>> {
    return this.wrapQuery(async () => {
      const result = this.db.insert(comments).values(data).returning().get()
      if (!result) throw new Error("Insert returned no row")
      return result
    }, "Failed to create comment")
  }

  public async update(
    id: string,
    data: { content?: string; color?: CommentColor },
  ): Promise<Result<Comment | null, DatabaseError>> {
    return this.wrapQuery(
      async () =>
        this.db
          .update(comments)
          .set({ ...data, updatedAt: Date.now() })
          .where(eq(comments.id, id))
          .returning()
          .get() ?? null,
      "Failed to update comment",
    )
  }

  public async delete(id: string): Promise<Result<void, DatabaseError>> {
    return this.wrapQuery(async () => {
      await this.db.delete(comments).where(eq(comments.id, id))
    }, "Failed to delete comment")
  }
}

let instance: CommentRepository | null = null

export function getCommentRepository(): CommentRepository {
  if (!instance) instance = new CommentRepository()
  return instance
}
