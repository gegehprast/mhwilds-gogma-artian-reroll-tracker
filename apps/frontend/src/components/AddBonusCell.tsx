import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"
import type { Weapon } from "../lib/api-service"
import { bonusRollService } from "../lib/api-service"
import { BONUSES } from "../lib/constants"
import { addToast } from "../lib/toast"
import type { BonusData } from "../types/bonus-roll-types"
import { BONUS_KEYS } from "../types/bonus-roll-types"
import { ComboBox } from "./ComboBox"

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
  const comboRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
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
        <div key={key} ref={comboRefs[i]}>
          <ComboBox
            value={values[key]}
            onChange={(v) => setValues((prev) => ({ ...prev, [key]: v }))}
            onNextFocus={() => {
              if (i < 4)
                comboRefs[i + 1].current
                  ?.querySelector<HTMLInputElement>("input")
                  ?.focus()
              else submit()
            }}
            options={BONUSES}
            placeholder={`Bonus ${i + 1}`}
          />
        </div>
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
