import { z } from "zod"
import { COMMENT_COLORS, COMMENT_ROLL_TYPES } from "@/db/schemas"

export const CommentSchema = z
  .object({
    id: z.string(),
    rollId: z.string(),
    rollType: z.enum(COMMENT_ROLL_TYPES),
    content: z.string(),
    color: z.enum(COMMENT_COLORS),
    createdAt: z.number().int(),
    updatedAt: z.number().int(),
  })
  .meta({ id: "Comment", title: "Comment" })
