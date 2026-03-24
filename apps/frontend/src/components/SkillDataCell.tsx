import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import type { SkillRoll, Weapon } from "../lib/api-service"
import { skillRollService } from "../lib/api-service"
import { addToast } from "../lib/toast"

export interface SkillDataCellProps {
  roll: SkillRoll | null
  index: number
  weapon: Weapon
  trackerId: string
  updateRoll: (
    weaponId: string,
    rollId: string,
    data: { groupSkill?: string; seriesSkill?: string },
  ) => void
  updating: boolean
  onNavigateToNext?: () => void
}

export function SkillDataCell({
  roll,
  index,
  weapon,
  trackerId,
  updateRoll,
  updating,
  onNavigateToNext,
}: SkillDataCellProps) {
  const qc = useQueryClient()
  const [groupSkill, setGroupSkill] = useState(roll?.groupSkill ?? "")
  const [seriesSkill, setSeriesSkill] = useState(roll?.seriesSkill ?? "")
  const seriesRef = useRef<HTMLInputElement>(null)

  const createMutation = useMutation({
    mutationFn: ({ g, s, idx }: { g: string; s: string; idx: number }) =>
      skillRollService.create(trackerId, weapon.id, g, s, idx),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skill-rolls", trackerId, weapon.id] })
      qc.invalidateQueries({ queryKey: ["tracker"] })
      setGroupSkill("")
      setSeriesSkill("")
      addToast("Roll saved", "success")
    },
  })

  useEffect(() => {
    setGroupSkill(roll?.groupSkill ?? "")
    setSeriesSkill(roll?.seriesSkill ?? "")
  }, [roll?.groupSkill, roll?.seriesSkill])

  function save() {
    const g = groupSkill.trim()
    const s = seriesSkill.trim()
    if (!g && !s) return
    if (roll) {
      if (g !== roll.groupSkill || s !== roll.seriesSkill) {
        updateRoll(weapon.id, roll.id, { groupSkill: g, seriesSkill: s })
      }
    } else {
      createMutation.mutate({ g, s, idx: index })
    }
  }

  function reset() {
    setGroupSkill(roll?.groupSkill ?? "")
    setSeriesSkill(roll?.seriesSkill ?? "")
  }

  const isPending = roll ? updating : createMutation.isPending
  const inputBg = roll ? "bg-gray-700" : "bg-gray-800"

  return (
    <div className="flex flex-col gap-1 py-1" data-skill-row={index}>
      <input
        className={`w-full ${inputBg} text-gray-100 text-xs rounded px-2 py-1 border border-gray-700 focus:border-amber-500 outline-none placeholder-gray-600`}
        value={groupSkill}
        onChange={(e) => setGroupSkill(e.target.value)}
        placeholder="Group skill"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            save()
            seriesRef.current?.focus()
          }
          if (e.key === "Escape") reset()
        }}
      />
      <input
        ref={seriesRef}
        className={`w-full ${inputBg} text-gray-100 text-xs rounded px-2 py-1 border border-gray-700 focus:border-amber-500 outline-none placeholder-gray-600`}
        value={seriesSkill}
        onChange={(e) => setSeriesSkill(e.target.value)}
        placeholder="Series skill"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            save()
            onNavigateToNext?.()
          }
          if (e.key === "Escape") reset()
        }}
        onBlur={roll ? save : undefined}
      />
      {isPending && (
        <span className="text-[10px] text-gray-500 text-center">saving…</span>
      )}
    </div>
  )
}
