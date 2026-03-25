import type { Comment } from "../types/comment-types"
import { COMMENT_COLOR_CLASSES } from "../types/comment-types"
import { PinIconButton } from "./PinIconButton"

interface CommentPinProps {
  comments: Comment[]
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
}

export function CommentPin({ comments, onClick }: CommentPinProps) {
  const label =
    comments.length > 0 ? `${comments.length} comment(s)` : "Add comment"

  return (
    <PinIconButton label={label} onClick={onClick} fullHeight>
      {comments.length === 0 ? (
        <span className="font-mono leading-none">+</span>
      ) : (
        <div className="flex flex-col gap-y-1">
          {comments.map((c) => (
            <div
              key={c.id}
              className={`w-2 h-2 rounded-full shrink-0 ${COMMENT_COLOR_CLASSES[c.color].bg}`}
            />
          ))}
        </div>
      )}
    </PinIconButton>
  )
}
