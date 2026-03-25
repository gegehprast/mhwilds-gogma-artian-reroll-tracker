import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { commentService } from "../lib/api-service"
import type { CommentColor } from "../types/comment-types"

export function useComments(
  trackerId: string | undefined,
  rollId: string | undefined,
  rollType: "skill" | "bonus",
  enabled = true,
) {
  const qc = useQueryClient()
  const key = ["comments", trackerId, rollId]

  const query = useQuery({
    queryKey: key,
    queryFn: () => {
      if (!trackerId || !rollId)
        throw new Error("trackerId and rollId required")
      return commentService.list(trackerId, rollId, rollType)
    },
    enabled: enabled && !!trackerId && !!rollId,
    staleTime: Infinity,
  })

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
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => {
      if (!trackerId) throw new Error("trackerId required")
      return commentService.delete(trackerId, id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return {
    comments: query.data ?? [],
    isLoading: query.isLoading,
    create,
    update,
    remove,
  }
}
