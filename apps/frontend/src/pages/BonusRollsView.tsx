import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AddBonusCell } from "../components/AddBonusCell"
import { BonusDataCell } from "../components/BonusDataCell"
import { VirtualizedTrackerTable } from "../components/VirtualizedTrackerTable"
import { useAllBonusRolls } from "../hooks/useAllBonusRolls"
import { useWeapons } from "../hooks/useWeapons"
import type { Tracker, Weapon } from "../lib/api-service"
import { bonusRollService } from "../lib/api-service"
import { addToast } from "../lib/toast"
import type { BonusData } from "../types/bonus-roll-types"

interface Props {
  tracker: Tracker
}

export function BonusRollsView({ tracker }: Props) {
  const qc = useQueryClient()
  const { query: weaponsQuery } = useWeapons(tracker.id)
  const weapons: Weapon[] = weaponsQuery.data ?? []
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

  const existingIndices: number[] = Array.from(
    new Set(
      Array.from(rollsByWeapon.values()).flatMap((rolls) =>
        rolls.map((r) => r.index),
      ),
    ),
  ).sort((a, b) => a - b)

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
    <VirtualizedTrackerTable
      weapons={weapons}
      rowHeight={148}
      existingIndices={existingIndices}
      currentIndex={tracker.bonusIndex ?? undefined}
      renderCell={(w, idx) => {
        const roll =
          (rollsByWeapon.get(w.id) ?? []).find((r) => r.index === idx) ?? null
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
      renderAddCell={(w) => <AddBonusCell weapon={w} trackerId={tracker.id} />}
    />
  )
}
