import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import type { BonusRoll, Weapon } from "../lib/api-service"
import { bonusRollService } from "../lib/api-service"
import { addToast } from "../lib/toast"
import type { BonusData } from "../types/bonus-roll-types"
import { BONUS_KEYS } from "../types/bonus-roll-types"

export interface BonusDataCellProps {
  roll: BonusRoll | null
  index: number
  weapon: Weapon
  trackerId: string
  updateRoll: (
    weaponId: string,
    rollId: string,
    data: Partial<BonusData>,
  ) => void
  updating: boolean
}

export function BonusDataCell({
  roll,
  index,
  weapon,
  trackerId,
  updateRoll,
  updating,
}: BonusDataCellProps) {
  const qc = useQueryClient()
  const emptyValues: BonusData = {
    bonus1: "",
    bonus2: "",
    bonus3: "",
    bonus4: "",
    bonus5: "",
  }
  const [values, setValues] = useState<BonusData>(
    roll
      ? {
          bonus1: roll.bonus1,
          bonus2: roll.bonus2,
          bonus3: roll.bonus3,
          bonus4: roll.bonus4,
          bonus5: roll.bonus5,
        }
      : emptyValues,
  )
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  const createMutation = useMutation({
    mutationFn: ({ bonuses, idx }: { bonuses: BonusData; idx: number }) =>
      bonusRollService.create(trackerId, weapon.id, bonuses, idx),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bonus-rolls", trackerId, weapon.id] })
      qc.invalidateQueries({ queryKey: ["tracker"] })
      setValues(emptyValues)
      addToast("Roll saved", "success")
    },
  })

  useEffect(() => {
    setValues(
      roll
        ? {
            bonus1: roll.bonus1,
            bonus2: roll.bonus2,
            bonus3: roll.bonus3,
            bonus4: roll.bonus4,
            bonus5: roll.bonus5,
          }
        : emptyValues,
    )
  }, [roll?.bonus1, roll?.bonus2, roll?.bonus3, roll?.bonus4, roll?.bonus5])

  function save() {
    if (BONUS_KEYS.every((k) => !values[k].trim())) return
    if (roll) {
      const changed: Partial<BonusData> = {}
      for (const key of BONUS_KEYS) {
        if (values[key].trim() !== roll[key]) changed[key] = values[key].trim()
      }
      if (Object.keys(changed).length > 0) {
        updateRoll(weapon.id, roll.id, changed)
      }
    } else {
      createMutation.mutate({
        bonuses: {
          bonus1: values.bonus1.trim(),
          bonus2: values.bonus2.trim(),
          bonus3: values.bonus3.trim(),
          bonus4: values.bonus4.trim(),
          bonus5: values.bonus5.trim(),
        },
        idx: index,
      })
    }
  }

  function reset() {
    setValues(
      roll
        ? {
            bonus1: roll.bonus1,
            bonus2: roll.bonus2,
            bonus3: roll.bonus3,
            bonus4: roll.bonus4,
            bonus5: roll.bonus5,
          }
        : emptyValues,
    )
  }

  const isPending = roll ? updating : createMutation.isPending
  const inputBg = roll ? "bg-gray-700" : "bg-gray-800"

  return (
    <div
      className="flex flex-col gap-1 py-1"
      data-bonus-row={`${weapon.id}-${index}`}
    >
      {BONUS_KEYS.map((key, i) => (
        <input
          key={key}
          ref={inputRefs[i]}
          className={`w-full ${inputBg} text-gray-100 text-xs rounded px-2 py-1 border border-gray-700 focus:border-red-500 outline-none placeholder-gray-600`}
          value={values[key]}
          onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
          placeholder={`Bonus ${i + 1}`}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              save()
              if (i < 4) inputRefs[i + 1].current?.focus()
              else
                document
                  .querySelector<HTMLInputElement>(
                    `[data-bonus-row="${weapon.id}-${index + 1}"] input`,
                  )
                  ?.focus()
            }
            if (e.key === "Escape") reset()
          }}
          onBlur={roll && i === 4 ? save : undefined}
        />
      ))}
      {isPending && (
        <span className="text-[10px] text-gray-500 text-center">saving…</span>
      )}
    </div>
  )
}
