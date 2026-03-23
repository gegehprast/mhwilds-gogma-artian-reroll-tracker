import { useState } from "react"
import type { BonusRoll } from "../lib/api-service"

type BonusKey = "bonus1" | "bonus2" | "bonus3" | "bonus4" | "bonus5"
const BONUS_KEYS: BonusKey[] = [
  "bonus1",
  "bonus2",
  "bonus3",
  "bonus4",
  "bonus5",
]

interface Props {
  roll: BonusRoll
  onClose: () => void
  onSave: (bonuses: {
    bonus1: string
    bonus2: string
    bonus3: string
    bonus4: string
    bonus5: string
  }) => void
  saving?: boolean
}

export function EditBonusRollModal({ roll, onClose, onSave, saving }: Props) {
  const [bonuses, setBonuses] = useState({
    bonus1: roll.bonus1,
    bonus2: roll.bonus2,
    bonus3: roll.bonus3,
    bonus4: roll.bonus4,
    bonus5: roll.bonus5,
  })

  const allFilled = BONUS_KEYS.every((k) => bonuses[k].trim())

  function handleSave() {
    if (!allFilled) return
    onSave({
      bonus1: bonuses.bonus1.trim(),
      bonus2: bonuses.bonus2.trim(),
      bonus3: bonuses.bonus3.trim(),
      bonus4: bonuses.bonus4.trim(),
      bonus5: bonuses.bonus5.trim(),
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-sm flex flex-col gap-4 p-5">
        <h2 className="text-white font-semibold">
          Edit Bonus Roll{" "}
          <span className="text-amber-300 font-mono">#{roll.index}</span>
        </h2>
        <div className="flex flex-col gap-2">
          {BONUS_KEYS.map((key, i) => (
            <input
              key={key}
              autoFocus={i === 0}
              className="bg-gray-800 text-gray-100 text-sm rounded px-2 py-1.5 border border-gray-600 placeholder-gray-600"
              placeholder={`Bonus ${i + 1}`}
              value={bonuses[key]}
              onChange={(e) =>
                setBonuses((prev) => ({ ...prev, [key]: e.target.value }))
              }
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          ))}
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
            disabled={saving || !allFilled}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm font-semibold px-4 py-2 rounded"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}
