import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { AddBonusCell } from "../components/AddBonusCell"
import { BonusDataCell } from "../components/BonusDataCell"
import { VirtualizedTrackerTable } from "../components/VirtualizedTrackerTable"
import { useAllBonusRolls } from "../hooks/useAllBonusRolls"
import { useWeapons } from "../hooks/useWeapons"
import type { Tracker, Weapon } from "../lib/api-service"
import { bonusRollService } from "../lib/api-service"
import { BONUSES } from "../lib/constants"
import { addToast } from "../lib/toast"
import type { BonusData } from "../types/bonus-roll-types"

interface Props {
  tracker: Tracker
}

export function BonusRollsView({ tracker }: Props) {
  const qc = useQueryClient()
  const {
    query: weaponsQuery,
    remove: removeWeapon,
    reorder: reorderWeapon,
  } = useWeapons(tracker.id)
  const weapons: Weapon[] = weaponsQuery.data ?? []

  function handleDeleteWeapon(weaponId: string) {
    removeWeapon.mutate(weaponId, {
      onSuccess: () => addToast("Weapon deleted", "success"),
    })
  }

  function handleReorderWeapons(ids: string[]) {
    reorderWeapon.mutate(ids)
  }
  const { data: rollsByWeapon, isLoading } = useAllBonusRolls(
    tracker.id,
    weapons,
  )

  const updateRollMutation = useMutation({
    mutationFn: ({
      weaponId,
      rollId,
      data,
    }: {
      weaponId: string
      rollId: string
      data: Partial<BonusData>
    }) => bonusRollService.update(tracker.id, weaponId, rollId, data),
    onSuccess: (_, { weaponId }) => {
      qc.invalidateQueries({ queryKey: ["bonus-rolls", tracker.id, weaponId] })
      addToast("Roll updated", "success")
    },
  })

  const [filterBonus, setFilterBonus] = useState("")
  const [filledOnly, setFilledOnly] = useState(false)
  const isFiltered = !!filterBonus || filledOnly

  const existingIndices: number[] = Array.from(
    new Set(
      Array.from(rollsByWeapon.values()).flatMap((rolls) =>
        rolls.map((r) => r.index),
      ),
    ),
  ).sort((a, b) => a - b)

  const overrideIndices: number[] | undefined = isFiltered
    ? existingIndices.filter((idx) => {
        if (!filterBonus) return true
        return weapons.some((w) => {
          const roll = (rollsByWeapon.get(w.id) ?? []).find(
            (r) => r.index === idx,
          )
          if (!roll) return false
          return (
            roll.bonus1 === filterBonus ||
            roll.bonus2 === filterBonus ||
            roll.bonus3 === filterBonus ||
            roll.bonus4 === filterBonus ||
            roll.bonus5 === filterBonus
          )
        })
      })
    : undefined

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-400" />
      </div>
    )
  }

  if (weapons.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
        No weapons added yet — use the button above to add one.
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-800 bg-gray-900/50 shrink-0 flex-wrap">
        <span className="text-xs text-gray-500 font-medium">Filter:</span>
        <select
          value={filterBonus}
          onChange={(e) => setFilterBonus(e.target.value)}
          className="text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-300 focus:outline-none focus:border-gray-500"
        >
          <option value="">Any bonus</option>
          {BONUSES.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filledOnly}
            onChange={(e) => setFilledOnly(e.target.checked)}
            className="accent-red-500"
          />
          Filled rows only
        </label>
        {isFiltered && (
          <>
            <span className="text-xs text-gray-600">
              {(overrideIndices ?? []).length} row
              {(overrideIndices ?? []).length !== 1 ? "s" : ""}
            </span>
            <button
              type="button"
              onClick={() => {
                setFilterBonus("")
                setFilledOnly(false)
              }}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Clear
            </button>
          </>
        )}
      </div>

      {isFiltered && (overrideIndices ?? []).length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
          No rolls match your filter.
        </div>
      ) : (
        <VirtualizedTrackerTable
          weapons={weapons}
          rowHeight={148}
          existingIndices={existingIndices}
          currentIndex={tracker.bonusIndex ?? undefined}
          overrideIndices={overrideIndices}
          onDeleteWeapon={handleDeleteWeapon}
          onReorderWeapons={handleReorderWeapons}
          renderCell={(w, idx) => {
            const roll =
              (rollsByWeapon.get(w.id) ?? []).find((r) => r.index === idx) ??
              null
            return (
              <BonusDataCell
                roll={roll}
                index={idx}
                weapon={w}
                trackerId={tracker.id}
                updateRoll={(weaponId, rollId, data) =>
                  updateRollMutation.mutate({ weaponId, rollId, data })
                }
                updating={updateRollMutation.isPending}
              />
            )
          }}
          renderAddCell={(w) => (
            <AddBonusCell weapon={w} trackerId={tracker.id} />
          )}
        />
      )}
    </div>
  )
}
