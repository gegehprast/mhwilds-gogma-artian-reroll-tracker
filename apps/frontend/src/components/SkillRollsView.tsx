import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAllSkillRolls } from "../hooks/useAllSkillRolls"
import { useWeapons } from "../hooks/useWeapons"
import type { Tracker, Weapon } from "../lib/api-service"
import { skillRollService } from "../lib/api-service"
import { addToast } from "../lib/toast"
import { AddSkillCell } from "./AddSkillCell"
import { SkillDataCell } from "./SkillDataCell"
import { VirtualizedTrackerTable } from "./VirtualizedTrackerTable"

interface Props {
  tracker: Tracker
}

export function SkillRollsView({ tracker }: Props) {
  const qc = useQueryClient()
  const { query: weaponsQuery } = useWeapons(tracker.id)
  const weapons: Weapon[] = weaponsQuery.data ?? []
  const { data: rollsByWeapon, isLoading } = useAllSkillRolls(
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
      data: { groupSkill?: string; seriesSkill?: string }
    }) => skillRollService.update(tracker.id, weaponId, rollId, data),
    onSuccess: (_, { weaponId }) => {
      qc.invalidateQueries({ queryKey: ["skill-rolls", tracker.id, weaponId] })
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
      rowHeight={64}
      existingIndices={existingIndices}
      currentIndex={tracker.skillIndex ?? undefined}
      renderCell={(w, idx) => {
        const roll =
          (rollsByWeapon.get(w.id) ?? []).find((r) => r.index === idx) ?? null
        return (
          <SkillDataCell
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
      renderAddCell={(w) => <AddSkillCell weapon={w} trackerId={tracker.id} />}
    />
  )
}
