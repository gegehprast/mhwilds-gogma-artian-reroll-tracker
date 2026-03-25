import { MessageSquare, Trash2, Upload } from "lucide-react"
import type { Comment } from "../types/comment-types"
import { COMMENT_COLOR_CLASSES } from "../types/comment-types"

interface RollGutterProps {
  gutterRef: React.RefObject<HTMLDivElement | null>
  comments: Comment[]
  hasRoll: boolean
  onCommentClick: () => void
  onImportClick: () => void
  onDeleteClick: () => void
  deleteDisabled: boolean
}

export function RollGutter({
  gutterRef,
  comments,
  hasRoll,
  onCommentClick,
  onImportClick,
  onDeleteClick,
  deleteDisabled,
}: RollGutterProps) {
  return (
    <div ref={gutterRef} className="w-4 shrink-0 relative">
      {/* Comment dots — always visible, fade on hover */}
      <div className="absolute inset-0 flex flex-col items-center gap-0.5 py-1 transition-opacity opacity-100 group-hover/cell:opacity-0 pointer-events-none">
        {hasRoll &&
          comments.map((c) => (
            <div
              key={c.id}
              className={`w-2 h-2 rounded-full shrink-0 ${COMMENT_COLOR_CLASSES[c.color].bg}`}
            />
          ))}
      </div>

      {/* Action buttons — revealed on hover */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-y-1.5 py-0.5 transition-opacity opacity-0 group-hover/cell:opacity-100 pointer-events-none group-hover/cell:pointer-events-auto">
        {hasRoll && (
          <button
            type="button"
            title={
              comments.length > 0
                ? `${comments.length} comment(s)`
                : "Add comment"
            }
            onClick={onCommentClick}
            className="relative flex items-center justify-center text-gray-500 hover:text-gray-200 transition-colors"
          >
            <MessageSquare size={11} />
            {comments.length > 0 && (
              <span
                className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full flex items-center justify-center text-white"
                style={{ fontSize: "7px" }}
              >
                {comments.length}
              </span>
            )}
          </button>
        )}
        <button
          type="button"
          title="Import rolls from this index"
          onClick={onImportClick}
          className="flex items-center justify-center text-gray-500 hover:text-gray-200 transition-colors"
        >
          <Upload size={11} />
        </button>
        {hasRoll && (
          <button
            type="button"
            title="Delete roll"
            onClick={onDeleteClick}
            disabled={deleteDisabled}
            className="flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors disabled:opacity-40"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
    </div>
  )
}
