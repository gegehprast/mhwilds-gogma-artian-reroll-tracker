import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"
import type { Weapon } from "../lib/api-service"
import { bonusRollService } from "../lib/api-service"
import { addToast } from "../lib/toast"
import type { BonusData } from "../types/bonus-roll-types"
import { BONUS_KEYS } from "../types/bonus-roll-types"

interface Props {
  weapon: Weapon
  trackerId: string
}

export function AddBonusCell({ weapon, trackerId }: Props) {
  const qc = useQueryClient()
  const emptyBonuses: BonusData = {
    bonus1: "",
    bonus2: "",
    bonus3: "",
    bonus4: "",
    bonus5: "",
  }
  const [values, setValues] = useState<BonusData>(emptyBonuses)
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  const create = useMutation({
    mutationFn: (bonuses: BonusData) =>
      bonusRollService.create(trackerId, weapon.id, bonuses),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bonus-rolls", trackerId, weapon.id] })
      qc.invalidateQueries({ queryKey: ["tracker"] })
      setValues(emptyBonuses)
      addToast("Roll added", "success")
    },
  })

  function submit() {
    if (BONUS_KEYS.every((k) => !values[k].trim())) return
    create.mutate({
      bonus1: values.bonus1.trim(),
      bonus2: values.bonus2.trim(),
      bonus3: values.bonus3.trim(),
      bonus4: values.bonus4.trim(),
      bonus5: values.bonus5.trim(),
    })
  }

  return (
    <div className="flex flex-col gap-1 py-1">
      {BONUS_KEYS.map((key, i) => (
        <input
          key={key}
          ref={inputRefs[i]}
          className="w-full bg-gray-800 text-gray-100 text-xs rounded px-2 py-1 border border-gray-700 focus:border-red-500 outline-none placeholder-gray-600"
          value={values[key]}
          onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
          placeholder={`Bonus ${i + 1}`}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              if (i < 4) inputRefs[i + 1].current?.focus()
              else submit()
            }
          }}
        />
      ))}
      <button
        type="button"
        onClick={submit}
        disabled={
          create.isPending || BONUS_KEYS.every((k) => !values[k].trim())
        }
        className="w-full bg-red-500/20 hover:bg-red-500/40 disabled:opacity-40 text-red-300 text-xs font-semibold rounded py-1 transition-colors"
      >
        {create.isPending ? "…" : "Add roll"}
      </button>
    </div>
  )
}
