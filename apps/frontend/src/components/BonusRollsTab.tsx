import { useState } from "react"
import { useBonusRolls } from "../hooks/useBonusRolls"
import type { BonusRoll, Tracker } from "../lib/api-service"
import { EditBonusRollModal } from "./EditBonusRollModal"
import { ImportModal } from "./ImportModal"

interface Props {
  tracker: Tracker
  weaponId: string
}

const BONUS_LABELS = [
  "Bonus 1",
  "Bonus 2",
  "Bonus 3",
  "Bonus 4",
  "Bonus 5",
] as const

export function BonusRollsTab({ tracker, weaponId }: Props) {
  const { query, create, remove, update, importRolls } = useBonusRolls(
    tracker.id,
    weaponId,
  )
  const [bonuses, setBonuses] = useState(["", "", "", "", ""])
  const [importOpen, setImportOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [editRoll, setEditRoll] = useState<BonusRoll | null>(null)

  const rolls = query.data ?? []

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (bonuses.some((b) => !b.trim())) return
    const [bonus1, bonus2, bonus3, bonus4, bonus5] = bonuses.map((b) =>
      b.trim(),
    )
    create.mutate(
      { bonus1, bonus2, bonus3, bonus4, bonus5 } as {
        bonus1: string
        bonus2: string
        bonus3: string
        bonus4: string
        bonus5: string
      },
      {
        onSuccess: () => setBonuses(["", "", "", "", ""]),
      },
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-3 border-b border-gray-800 flex items-center gap-3">
        <span className="text-xs text-gray-500">
          Next index:{" "}
          <span className="text-amber-300 font-mono">{tracker.bonusIndex}</span>
        </span>
        <button
          type="button"
          onClick={() => setImportOpen(true)}
          className="ml-auto text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded"
        >
          Import
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 sticky top-0">
            <tr>
              <th className="text-left px-3 py-2 text-gray-400 font-medium w-16">
                #
              </th>
              {BONUS_LABELS.map((l) => (
                <th
                  key={l}
                  className="text-left px-3 py-2 text-gray-400 font-medium"
                >
                  {l}
                </th>
              ))}
              <th className="w-20" />
            </tr>
          </thead>
          <tbody>
            {rolls.map((roll) => (
              <tr
                key={roll.id}
                className="group border-t border-gray-800/50 hover:bg-gray-800/40 transition-colors"
              >
                <td className="px-3 py-2 font-mono text-gray-500">
                  {roll.index}
                </td>
                <td className="px-3 py-2 text-gray-200">{roll.bonus1}</td>
                <td className="px-3 py-2 text-gray-200">{roll.bonus2}</td>
                <td className="px-3 py-2 text-gray-200">{roll.bonus3}</td>
                <td className="px-3 py-2 text-gray-200">{roll.bonus4}</td>
                <td className="px-3 py-2 text-gray-200">{roll.bonus5}</td>
                <td className="px-2 py-2">
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedIndex(roll.index)
                        setImportOpen(true)
                      }}
                      className="text-gray-400 hover:text-blue-400 text-xs px-1"
                      title="Upload from here"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditRoll(roll)
                      }}
                      className="text-gray-400 hover:text-amber-400 text-xs px-1"
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        remove.mutate(roll.id)
                      }}
                      className="text-red-500 hover:text-red-400 text-xs"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add form */}
      <form
        onSubmit={handleCreate}
        className="p-3 border-t border-gray-800 flex gap-2 flex-wrap"
      >
        {BONUS_LABELS.map((label, i) => (
          <input
            key={label}
            className="flex-1 min-w-24 bg-gray-800 text-gray-100 text-sm rounded px-2 py-1.5 border border-gray-600 placeholder-gray-600"
            placeholder={label}
            value={bonuses[i]}
            onChange={(e) => {
              const next = [...bonuses]
              next[i] = e.target.value
              setBonuses(next)
            }}
          />
        ))}
        <button
          type="submit"
          disabled={create.isPending}
          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm font-semibold px-4 rounded"
        >
          {create.isPending ? "…" : "Add"}
        </button>
      </form>

      {importOpen && (
        <ImportModal
          type="bonuses"
          selectedIndex={
            selectedIndex ??
            (rolls.length > 0 ? rolls[rolls.length - 1].index : 0)
          }
          onClose={() => setImportOpen(false)}
          onImport={(idx, rawRows) => {
            const rows = rawRows as Array<{
              attemptNum: number
              bonus1: string
              bonus2: string
              bonus3: string
              bonus4: string
              bonus5: string
            }>
            importRolls.mutate(
              { selectedIndex: idx, rolls: rows },
              { onSuccess: () => setImportOpen(false) },
            )
          }}
        />
      )}

      {editRoll && (
        <EditBonusRollModal
          roll={editRoll}
          saving={update.isPending}
          onClose={() => setEditRoll(null)}
          onSave={(bonusData) => {
            update.mutate(
              { id: editRoll.id, data: bonusData },
              { onSuccess: () => setEditRoll(null) },
            )
          }}
        />
      )}
    </div>
  )
}
