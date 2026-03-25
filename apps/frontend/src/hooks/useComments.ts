import { useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  BonusRollWithComments,
  SkillRollWithComments,
} from "../lib/api-service"
import { commentService } from "../lib/api-service"
import type { Comment, CommentColor } from "../types/comment-types"

export function useCommentMutations(
  trackerId: string | undefined,
  weaponId: string | undefined,
  rollId: string | undefined,
  rollType: "skill" | "bonus",
) {
  const qc = useQueryClient()

  function patchComments(updater: (comments: Comment[]) => Comment[]) {
    if (rollType === "skill") {
      qc.setQueryData<SkillRollWithComments[]>(
        ["skill-rolls", trackerId, weaponId],
        (old) =>
          old?.map((r) =>
            r.id === rollId ? { ...r, comments: updater(r.comments) } : r,
          ),
      )
    } else {
      qc.setQueryData<BonusRollWithComments[]>(
        ["bonus-rolls", trackerId, weaponId],
        (old) =>
          old?.map((r) =>
            r.id === rollId ? { ...r, comments: updater(r.comments) } : r,
          ),
      )
    }
  }

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
    onSuccess: (newComment) =>
      patchComments((comments) => [...comments, newComment]),
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
    onSuccess: (updatedComment) =>
      patchComments((comments) =>
        comments.map((c) => (c.id === updatedComment.id ? updatedComment : c)),
      ),
  })

  const remove = useMutation({
    mutationFn: (id: string) => {
      if (!trackerId) throw new Error("trackerId required")
      return commentService.delete(trackerId, id)
    },
    onSuccess: (_, commentId) =>
      patchComments((comments) => comments.filter((c) => c.id !== commentId)),
  })

  return { create, update, remove }
}
