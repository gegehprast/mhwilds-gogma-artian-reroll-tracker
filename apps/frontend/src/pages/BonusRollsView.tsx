import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { AddBonusCell } from "../components/AddBonusCell"
import { BonusDataCell } from "../components/BonusDataCell"
import { BonusFilterBar } from "../components/BonusFilterBar"
import { VirtualizedTrackerTable } from "../components/VirtualizedTrackerTable"
import { useAllBonusRolls } from "../hooks/useAllBonusRolls"
import { useWeapons } from "../hooks/useWeapons"
import type { Tracker, Weapon } from "../lib/api-service"
import { bonusRollService } from "../lib/api-service"
import { addToast } from "../lib/toast"

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
    <div className="flex flex-col flex-1 min-h-0 min-w-0">
      <BonusFilterBar
        filterBonus={filterBonus}
        filledOnly={filledOnly}
        matchCount={(overrideIndices ?? []).length}
        isFiltered={isFiltered}
        onBonusChange={setFilterBonus}
        onFilledOnlyChange={setFilledOnly}
        onClear={() => {
          setFilterBonus("")
          setFilledOnly(false)
        }}
      />

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
          onDeletePast={async (beforeIndex) => {
            await bonusRollService.deletePast(tracker.id, beforeIndex)
            qc.invalidateQueries({ queryKey: ["bonus-rolls", tracker.id] })
            qc.invalidateQueries({ queryKey: ["tracker"] })
            addToast("Past rolls deleted", "success")
          }}
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
                filterBonus={filterBonus || undefined}
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
