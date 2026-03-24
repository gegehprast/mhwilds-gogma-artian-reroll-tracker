import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"
import type { Weapon } from "../lib/api-service"
import { skillRollService } from "../lib/api-service"
import { GROUP_SKILLS, SET_SKILLS } from "../lib/constants"
import { addToast } from "../lib/toast"
import { ComboBox } from "./ComboBox"

interface Props {
  weapon: Weapon
  trackerId: string
}

export function AddSkillCell({ weapon, trackerId }: Props) {
  const qc = useQueryClient()
  const [setSkill, setSetSkill] = useState("")
  const [groupSkill, setGroupSkill] = useState("")
  const groupContainerRef = useRef<HTMLDivElement>(null)

  const create = useMutation({
    mutationFn: ({ g, s }: { g: string; s: string }) =>
      skillRollService.create(trackerId, weapon.id, s, g),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skill-rolls", trackerId, weapon.id] })
      qc.invalidateQueries({ queryKey: ["tracker"] })
      setGroupSkill("")
      setSetSkill("")
      addToast("Roll added", "success")
    },
  })

  function submit() {
    const g = groupSkill.trim()
    const s = setSkill.trim()
    if (!g && !s) return
    create.mutate({ g, s })
  }

  return (
    <div className="flex flex-col gap-1 py-1">
      <ComboBox
        value={setSkill}
        onChange={setSetSkill}
        options={SET_SKILLS}
        placeholder="Set skill"
        onNextFocus={() =>
          groupContainerRef.current
            ?.querySelector<HTMLInputElement>("input")
            ?.focus()
        }
      />
      <div ref={groupContainerRef}>
        <ComboBox
          value={groupSkill}
          onChange={setGroupSkill}
          options={GROUP_SKILLS}
          placeholder="Group skill"
          onNextFocus={submit}
        />
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={
          create.isPending || (!groupSkill.trim() && !setSkill.trim())
        }
        className="w-full bg-red-500/20 hover:bg-red-500/40 disabled:opacity-40 text-red-300 text-xs font-semibold rounded py-1 transition-colors"
      >
        {create.isPending ? "…" : "Add roll"}
      </button>
    </div>
  )
}
