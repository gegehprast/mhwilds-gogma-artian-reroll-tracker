import { useMutation, useQueryClient } from "@tanstack/react-query"
import { commentService } from "../lib/api-service"
import type { CommentColor } from "../types/comment-types"

export function useCommentMutations(
  trackerId: string | undefined,
  rollId: string | undefined,
  rollType: "skill" | "bonus",
) {
  const qc = useQueryClient()
  const rollQueryKey =
    rollType === "skill"
      ? ["skill-rolls", trackerId]
      : ["bonus-rolls", trackerId]

  const create = useMutation({
    mutationFn: ({
      content,
      color,
    }: {
      content: string
      color: CommentColor
    }) => {
      if (!trackerId || !rollId)
        throw new Error("trackerId and rollId required")
      return commentService.create(trackerId, rollId, rollType, content, color)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: rollQueryKey }),
  })

  const update = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: { content?: string; color?: CommentColor }
    }) => {
      if (!trackerId) throw new Error("trackerId required")
      return commentService.update(trackerId, id, data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: rollQueryKey }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => {
      if (!trackerId) throw new Error("trackerId required")
      return commentService.delete(trackerId, id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: rollQueryKey }),
  })

  return { create, update, remove }
}
