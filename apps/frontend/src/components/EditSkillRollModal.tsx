import { useState } from "react"
import type { SkillRoll } from "../lib/api-service"

interface Props {
  roll: SkillRoll
  onClose: () => void
  onSave: (groupSkill: string, seriesSkill: string) => void
  saving?: boolean
}

export function EditSkillRollModal({ roll, onClose, onSave, saving }: Props) {
  const [groupSkill, setGroupSkill] = useState(roll.groupSkill)
  const [seriesSkill, setSeriesSkill] = useState(roll.seriesSkill)

  function handleSave() {
    if (!groupSkill.trim() || !seriesSkill.trim()) return
    onSave(groupSkill.trim(), seriesSkill.trim())
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-sm flex flex-col gap-4 p-5">
        <h2 className="text-white font-semibold">
          Edit Skill Roll{" "}
          <span className="text-amber-300 font-mono">#{roll.index}</span>
        </h2>
        <div className="flex flex-col gap-2">
          <input
            autoFocus
            className="bg-gray-800 text-gray-100 text-sm rounded px-2 py-1.5 border border-gray-600 placeholder-gray-600"
            placeholder="Group Skill"
            value={groupSkill}
            onChange={(e) => setGroupSkill(e.target.value)}
          />
          <input
            className="bg-gray-800 text-gray-100 text-sm rounded px-2 py-1.5 border border-gray-600 placeholder-gray-600"
            placeholder="Series Skill"
            value={seriesSkill}
            onChange={(e) => setSeriesSkill(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !groupSkill.trim() || !seriesSkill.trim()}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm font-semibold px-4 py-2 rounded"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}
