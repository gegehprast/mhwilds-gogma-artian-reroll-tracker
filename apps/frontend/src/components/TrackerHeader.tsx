import { useState } from "react"
import { useTracker } from "../hooks/useTracker"
import type { Tracker } from "../lib/api-service"

interface Props {
  tracker: Tracker
  onSwitchTracker: () => void
}

export function TrackerHeader({ tracker, onSwitchTracker }: Props) {
  const { updateName, setSkillIndex, setBonusIndex } = useTracker()
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(tracker.name)
  const [editingSkillIdx, setEditingSkillIdx] = useState(false)
  const [skillIdxInput, setSkillIdxInput] = useState(String(tracker.skillIndex))
  const [editingBonusIdx, setEditingBonusIdx] = useState(false)
  const [bonusIdxInput, setBonusIdxInput] = useState(String(tracker.bonusIndex))
  const [copied, setCopied] = useState(false)

  function handleCopyId() {
    navigator.clipboard.writeText(tracker.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleNameSave() {
    const name = nameInput.trim()
    if (name && name !== tracker.name) {
      updateName.mutate({ id: tracker.id, name })
    }
    setEditingName(false)
  }

  function handleSkillIdxSave() {
    const v = Number.parseInt(skillIdxInput, 10)
    if (!Number.isNaN(v) && v >= 1 && v !== tracker.skillIndex) {
      setSkillIndex.mutate({ id: tracker.id, skillIndex: v })
    }
    setEditingSkillIdx(false)
  }

  function handleBonusIdxSave() {
    const v = Number.parseInt(bonusIdxInput, 10)
    if (!Number.isNaN(v) && v >= 1 && v !== tracker.bonusIndex) {
      setBonusIndex.mutate({ id: tracker.id, bonusIndex: v })
    }
    setEditingBonusIdx(false)
  }

  return (
    <header className="bg-gray-900 border-b border-gray-800 px-4 py-3">
      <div className="flex items-center gap-4 flex-wrap">
        <h1 className="text-xl font-bold text-amber-400 shrink-0">
          🦎 Gogma Reroll Tracker
        </h1>

        {/* Tracker name — click to edit */}
        <div className="flex items-center gap-1 min-w-0">
          {editingName ? (
            <input
              autoFocus
              className="bg-gray-800 text-gray-100 text-sm rounded px-2 py-1 border border-amber-500 w-44"
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
              className="text-sm font-medium text-gray-200 hover:text-amber-300 truncate max-w-48"
              title="Click to rename"
            >
              {tracker.name}
            </button>
          )}
        </div>

        {/* Index counters */}
        <div className="flex items-center gap-3 shrink-0 ml-2">
          <div className="flex flex-col items-center bg-gray-800 border border-gray-700 rounded px-3 py-1 min-w-18">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide leading-none mb-0.5">
              Skill Idx
            </span>
            {editingSkillIdx ? (
              <input
                autoFocus
                type="number"
                min={1}
                className="bg-transparent text-amber-300 font-mono text-sm rounded w-14 text-center border-b border-amber-500 outline-none"
                value={skillIdxInput}
                onChange={(e) => setSkillIdxInput(e.target.value)}
                onBlur={handleSkillIdxSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSkillIdxSave()
                  else if (e.key === "Escape") setEditingSkillIdx(false)
                }}
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSkillIdxInput(String(tracker.skillIndex))
                  setEditingSkillIdx(true)
                }}
                className="text-amber-300 font-mono text-sm font-bold hover:text-amber-200 leading-none"
                title="Click to edit next skill roll index"
              >
                {tracker.skillIndex}
              </button>
            )}
          </div>
          <div className="flex flex-col items-center bg-gray-800 border border-gray-700 rounded px-3 py-1 min-w-18">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide leading-none mb-0.5">
              Bonus Idx
            </span>
            {editingBonusIdx ? (
              <input
                autoFocus
                type="number"
                min={1}
                className="bg-transparent text-amber-300 font-mono text-sm rounded w-14 text-center border-b border-amber-500 outline-none"
                value={bonusIdxInput}
                onChange={(e) => setBonusIdxInput(e.target.value)}
                onBlur={handleBonusIdxSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleBonusIdxSave()
                  else if (e.key === "Escape") setEditingBonusIdx(false)
                }}
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setBonusIdxInput(String(tracker.bonusIndex))
                  setEditingBonusIdx(true)
                }}
                className="text-amber-300 font-mono text-sm font-bold hover:text-amber-200 leading-none"
                title="Click to edit next bonus roll index"
              >
                {tracker.bonusIndex}
              </button>
            )}
          </div>
        </div>

        {/* Tracker ID + copy + switch */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <span className="text-xs text-gray-500">ID:</span>
          <span className="font-mono text-xs text-amber-300 select-all bg-gray-800 px-2 py-1 rounded">
            {tracker.id}
          </span>
          <button
            type="button"
            onClick={handleCopyId}
            className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded transition-colors"
            title="Copy tracker ID to clipboard"
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={onSwitchTracker}
            className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded transition-colors"
            title="Switch to a different tracker"
          >
            Switch
          </button>
        </div>
      </div>
    </header>
  )
}
