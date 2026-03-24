import type { Comment } from "../types/comment-types"
import { COMMENT_COLOR_CLASSES } from "../types/comment-types"

interface CommentPinProps {
  comments: Comment[]
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
}

export function CommentPin({ comments, onClick }: CommentPinProps) {
  return (
    <button
      type="button"
      aria-label={
        comments.length > 0 ? `${comments.length} comment(s)` : "Add comment"
      }
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-0.5 w-3 min-w-3 h-full cursor-pointer select-none group bg-transparent border-0 p-0"
    >
      {comments.length === 0 ? (
        <span className="font-mono leading-none text-gray-500 group-hover:text-gray-400 transition-colors">
          +
        </span>
      ) : (
        comments.map((c) => (
          <div
            key={c.id}
            className={`w-2 h-2 rounded-full shrink-0 ${COMMENT_COLOR_CLASSES[c.color].bg}`}
          />
        ))
      )}
    </button>
  )
}
