import { useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useCloseOnEscape } from "../hooks/useCloseOnEscape"
import { useCloseOnOutsideClick } from "../hooks/useCloseOnOutsideClick"
import type { Comment, CommentColor } from "../types/comment-types"
import { COMMENT_COLOR_CLASSES, COMMENT_COLORS } from "../types/comment-types"

const MAX_COMMENTS = 5
const POPOVER_WIDTH = 288

interface CommentPopoverProps {
  comments: Comment[]
  isLoading: boolean
  anchorRect: DOMRect
  onClose: () => void
  onCreate: (content: string, color: CommentColor) => void
  onDelete: (id: string) => void
  onUpdate: (
    id: string,
    data: { content?: string; color?: CommentColor },
  ) => void
  isPending: boolean
}

function getPopoverPosition(anchorRect: DOMRect): {
  top: number
  left: number
} {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const estimatedHeight = 360

  // Prefer opening to the left of the anchor
  let left = anchorRect.left - POPOVER_WIDTH - 8
  if (left < 8) {
    left = anchorRect.right + 8
  }
  // Clamp to viewport
  left = Math.max(8, Math.min(left, viewportWidth - POPOVER_WIDTH - 8))

  let top = anchorRect.top
  if (top + estimatedHeight > viewportHeight - 8) {
    top = viewportHeight - estimatedHeight - 8
  }
  top = Math.max(8, top)

  return { top, left }
}

export function CommentPopover({
  comments,
  isLoading,
  anchorRect,
  onClose,
  onCreate,
  onDelete,
  onUpdate,
  isPending,
}: CommentPopoverProps) {
  const { top, left } = getPopoverPosition(anchorRect)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [newContent, setNewContent] = useState("")
  const [newColor, setNewColor] = useState<CommentColor>("red")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [editColor, setEditColor] = useState<CommentColor>("red")

  useCloseOnOutsideClick(popoverRef, onClose)
  useCloseOnEscape(onClose)

  function handleCreate() {
    const trimmed = newContent.trim()
    if (!trimmed) return
    onCreate(trimmed, newColor)
    setNewContent("")
    setNewColor("red")
  }

  function startEdit(comment: Comment) {
    setEditingId(comment.id)
    setEditContent(comment.content)
    setEditColor(comment.color)
  }

  function handleUpdate(id: string) {
    const trimmed = editContent.trim()
    if (!trimmed) return
    onUpdate(id, { content: trimmed, color: editColor })
    setEditingId(null)
  }

  const canAdd = comments.length < MAX_COMMENTS

  return createPortal(
    <div
      ref={popoverRef}
      style={{ position: "fixed", top, left, width: POPOVER_WIDTH, zIndex: 50 }}
      className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Comments ({comments.length}/{MAX_COMMENTS})
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 leading-none transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Comment list */}
      <div className="flex flex-col gap-1 p-2 max-h-52 overflow-y-auto">
        {isLoading && (
          <div className="flex justify-center py-4">
            <div className="w-4 h-4 border-2 border-gray-600 border-t-gray-300 rounded-full animate-spin" />
          </div>
        )}
        {!isLoading && comments.length === 0 && (
          <p className="text-xs text-gray-500 text-center py-3">
            No comments yet.
          </p>
        )}
        {comments.map((c) =>
          editingId === c.id ? (
            <div
              key={c.id}
              className="bg-gray-800 rounded p-2 flex flex-col gap-1.5"
            >
              <textarea
                autoFocus
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={2}
                className="w-full bg-gray-700 text-gray-100 text-xs rounded px-2 py-1 resize-none border border-gray-600 focus:outline-none focus:border-gray-400"
              />
              <div className="flex items-center gap-1 flex-wrap">
                {COMMENT_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setEditColor(col)}
                    className={`w-4 h-4 rounded-full ${COMMENT_COLOR_CLASSES[col].bg} transition-transform ${editColor === col ? "ring-2 ring-white ring-offset-1 ring-offset-gray-800 scale-110" : ""}`}
                    aria-label={col}
                  />
                ))}
              </div>
              <div className="flex gap-1 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="text-xs text-gray-400 hover:text-gray-200 transition-colors px-2 py-0.5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdate(c.id)}
                  disabled={isPending || !editContent.trim()}
                  className="text-xs bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-white rounded px-2 py-0.5 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div
              key={c.id}
              className="flex items-start gap-2 bg-gray-800/60 hover:bg-gray-800 rounded px-2 py-1.5 group/comment"
            >
              <div
                className={`w-2.5 h-2.5 rounded-full shrink-0 mt-0.5 ${COMMENT_COLOR_CLASSES[c.color].bg}`}
              />
              <span className="flex-1 text-xs text-gray-200 leading-snug wrap-break-word min-w-0">
                {c.content}
              </span>
              <div className="flex gap-1 opacity-0 group-hover/comment:opacity-100 transition-opacity shrink-0">
                <button
                  type="button"
                  onClick={() => startEdit(c)}
                  className="text-gray-500 hover:text-gray-300 leading-none transition-colors"
                  aria-label="Edit"
                >
                  ✏
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(c.id)}
                  disabled={isPending}
                  className="text-gray-500 hover:text-red-400 disabled:opacity-50 leading-none transition-colors"
                  aria-label="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          ),
        )}
      </div>

      {/* Add form */}
      {canAdd && (
        <div className="border-t border-gray-700 p-2 flex flex-col gap-2">
          <div className="flex items-center gap-1">
            {COMMENT_COLORS.map((col) => (
              <button
                key={col}
                type="button"
                onClick={() => setNewColor(col)}
                className={`w-4 h-4 rounded-full ${COMMENT_COLOR_CLASSES[col].bg} transition-transform ${newColor === col ? "ring-2 ring-white ring-offset-1 ring-offset-gray-900 scale-110" : ""}`}
                aria-label={col}
              />
            ))}
          </div>

          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleCreate()
              }
            }}
            placeholder="Add a comment… (Enter to save)"
            rows={2}
            className="w-full bg-gray-800 text-gray-100 text-xs rounded px-2 py-1.5 resize-none border border-gray-700 focus:outline-none focus:border-gray-500 placeholder:text-gray-600"
          />

          <button
            type="button"
            onClick={handleCreate}
            disabled={isPending || !newContent.trim()}
            className="text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-gray-200 rounded px-2.5 py-1 transition-colors"
          >
            Add
          </button>
        </div>
      )}
    </div>,
    document.body,
  )
}
