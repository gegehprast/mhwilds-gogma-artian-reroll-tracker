import { ArrowLeftRight, Copy, Pencil } from "lucide-react"
import { useState } from "react"
import { useTracker } from "../hooks/useTracker"
import type { Tracker } from "../lib/api-service"
import { addToast } from "../lib/toast"

interface Props {
  tracker: Tracker
  onSwitchTracker: () => void
}

export function TrackerHeader({ tracker, onSwitchTracker }: Props) {
  const { updateName } = useTracker()
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(tracker.name)

  function handleCopyId() {
    navigator.clipboard.writeText(tracker.id)
    addToast("Tracker ID copied to clipboard", "success")
  }

  function handleNameSave() {
    const name = nameInput.trim()
    if (name && name !== tracker.name) {
      updateName.mutate({ id: tracker.id, name })
    }
    setEditingName(false)
  }

  return (
    <header className="flex flex-col md:flex-row md:justify-between bg-gray-900 border-b border-gray-800 px-2 md:px-4 py-2">
      {/* Row 1: title */}
      <h1 className="text-lg font-bold text-red-400 mb-1">
        🦎 Gogma Reroll Tracker
      </h1>

      {/* Row 2: name · id · copy · switch — all one line */}
      <div className="flex items-center gap-2 min-w-0 ml-auto mt-2 md:mt-0">
        {/* Tracker name */}
        <div className="flex items-center min-w-0 shrink">
          {editingName ? (
            <input
              autoFocus
              className="bg-gray-800 text-gray-100 text-xs rounded px-2 py-1 border border-red-500 w-32"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNameSave()
                else if (e.key === "Escape") setEditingName(false)
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setNameInput(tracker.name)
                setEditingName(true)
              }}
              className="flex items-center gap-1 text-xs font-medium text-gray-200 hover:text-red-300 truncate max-w-28"
              title="Click to rename"
            >
              {tracker.name}
              <Pencil size={10} className="shrink-0" />
            </button>
          )}
        </div>

        {/* ID */}
        <button
          type="button"
          className="flex items-center gap-1.5 font-mono text-xs text-red-300 select-all bg-gray-800 px-2 py-0.5 rounded truncate"
          onClick={handleCopyId}
          title="Click to copy to clipboard"
        >
          {tracker.id}
          <Copy size={10} className="shrink-0" />
        </button>

        <button
          type="button"
          onClick={onSwitchTracker}
          className="flex items-center gap-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-0.5 rounded transition-colors shrink-0"
          title="Switch to a different tracker"
        >
          <ArrowLeftRight size={11} />
          Switch
        </button>
      </div>
    </header>
  )
}
