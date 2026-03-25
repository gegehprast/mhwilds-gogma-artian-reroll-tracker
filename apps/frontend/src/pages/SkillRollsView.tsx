import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { AddSkillCell } from "../components/AddSkillCell"
import { SkillDataCell } from "../components/SkillDataCell"
import { SkillFilterBar } from "../components/SkillFilterBar"
import { VirtualizedTrackerTable } from "../components/VirtualizedTrackerTable"
import { useAllSkillRolls } from "../hooks/useAllSkillRolls"
import { useWeapons } from "../hooks/useWeapons"
import type { Tracker, Weapon } from "../lib/api-service"
import { skillRollService } from "../lib/api-service"
import { addToast } from "../lib/toast"

interface Props {
  tracker: Tracker
}

export function SkillRollsView({ tracker }: Props) {
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
  const { data: rollsByWeapon, isLoading } = useAllSkillRolls(
    tracker.id,
    weapons,
  )

  const [filterSetSkill, setFilterSetSkill] = useState("")
  const [filterGroupSkill, setFilterGroupSkill] = useState("")
  const [filledOnly, setFilledOnly] = useState(false)
  const isFiltered = !!filterSetSkill || !!filterGroupSkill || filledOnly

  const existingIndices: number[] = Array.from(
    new Set(
      Array.from(rollsByWeapon.values()).flatMap((rolls) =>
        rolls.map((r) => r.index),
      ),
    ),
  ).sort((a, b) => a - b)

  const overrideIndices: number[] | undefined = isFiltered
    ? existingIndices.filter((idx) => {
        if (!filterSetSkill && !filterGroupSkill) return true
        return weapons.some((w) => {
          const roll = (rollsByWeapon.get(w.id) ?? []).find(
            (r) => r.index === idx,
          )
          if (!roll) return false
          if (filterSetSkill && roll.setSkill !== filterSetSkill) return false
          if (filterGroupSkill && roll.groupSkill !== filterGroupSkill)
            return false
          return true
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
      <SkillFilterBar
        filterSetSkill={filterSetSkill}
        filterGroupSkill={filterGroupSkill}
        filledOnly={filledOnly}
        matchCount={(overrideIndices ?? []).length}
        isFiltered={isFiltered}
        onSetSkillChange={setFilterSetSkill}
        onGroupSkillChange={setFilterGroupSkill}
        onFilledOnlyChange={setFilledOnly}
        onClear={() => {
          setFilterSetSkill("")
          setFilterGroupSkill("")
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
          rowHeight={64}
          existingIndices={existingIndices}
          currentIndex={tracker.skillIndex ?? undefined}
          overrideIndices={overrideIndices}
          onDeleteWeapon={handleDeleteWeapon}
          onReorderWeapons={handleReorderWeapons}
          onDeletePast={async (beforeIndex) => {
            await skillRollService.deletePast(tracker.id, beforeIndex)
            qc.invalidateQueries({ queryKey: ["skill-rolls", tracker.id] })
            qc.invalidateQueries({ queryKey: ["tracker"] })
            addToast("Past rolls deleted", "success")
          }}
          renderCell={(w, idx) => {
            const roll =
              (rollsByWeapon.get(w.id) ?? []).find((r) => r.index === idx) ??
              null
            return (
              <SkillDataCell
                roll={roll}
                index={idx}
                weapon={w}
                trackerId={tracker.id}
                filterSetSkill={filterSetSkill || undefined}
                filterGroupSkill={filterGroupSkill || undefined}
              />
            )
          }}
          renderAddCell={(w) => (
            <AddSkillCell weapon={w} trackerId={tracker.id} />
          )}
        />
      )}
    </div>
  )
}
