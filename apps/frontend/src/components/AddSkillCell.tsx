import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"
import type { Weapon } from "../lib/api-service"
import { skillRollService } from "../lib/api-service"
import { addToast } from "../lib/toast"

interface Props {
  weapon: Weapon
  trackerId: string
}

export function AddSkillCell({ weapon, trackerId }: Props) {
  const qc = useQueryClient()
  const [groupSkill, setGroupSkill] = useState("")
  const [seriesSkill, setSeriesSkill] = useState("")
  const seriesRef = useRef<HTMLInputElement>(null)

  const create = useMutation({
    mutationFn: ({ g, s }: { g: string; s: string }) =>
      skillRollService.create(trackerId, weapon.id, g, s),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skill-rolls", trackerId, weapon.id] })
      qc.invalidateQueries({ queryKey: ["tracker"] })
      setGroupSkill("")
      setSeriesSkill("")
      addToast("Roll added", "success")
    },
  })

  function submit() {
    const g = groupSkill.trim()
    const s = seriesSkill.trim()
    if (!g && !s) return
    create.mutate({ g, s })
  }

  return (
    <div className="flex flex-col gap-1 py-1">
      <input
        className="w-full bg-gray-800 text-gray-100 text-xs rounded px-2 py-1 border border-gray-700 focus:border-amber-500 outline-none placeholder-gray-600"
        value={groupSkill}
        onChange={(e) => setGroupSkill(e.target.value)}
        placeholder="Group skill"
        disabled={create.isPending}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            seriesRef.current?.focus()
          }
        }}
      />
      <input
        ref={seriesRef}
        className="w-full bg-gray-800 text-gray-100 text-xs rounded px-2 py-1 border border-gray-700 focus:border-amber-500 outline-none placeholder-gray-600"
        value={seriesSkill}
        onChange={(e) => setSeriesSkill(e.target.value)}
        placeholder="Series skill"
        disabled={create.isPending}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            submit()
          }
        }}
      />
      <button
        type="button"
        onClick={submit}
        disabled={
          create.isPending || (!groupSkill.trim() && !seriesSkill.trim())
        }
        className="w-full bg-amber-500/20 hover:bg-amber-500/40 disabled:opacity-40 text-amber-300 text-xs font-semibold rounded py-1 transition-colors"
      >
        {create.isPending ? "…" : "Add roll"}
      </button>
    </div>
  )
}
