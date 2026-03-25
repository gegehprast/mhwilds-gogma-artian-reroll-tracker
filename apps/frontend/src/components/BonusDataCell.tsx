import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { useComments } from "../hooks/useComments"
import type { BonusRoll, Weapon } from "../lib/api-service"
import { bonusRollService } from "../lib/api-service"
import { BONUSES } from "../lib/constants"
import { addToast } from "../lib/toast"
import type { BonusData } from "../types/bonus-roll-types"
import { BONUS_KEYS } from "../types/bonus-roll-types"
import { ComboBox } from "./ComboBox"
import { CommentPopover } from "./CommentPopover"
import { ImportPreviewModal } from "./ImportPreviewModal"
import { RollGutter } from "./RollGutter"

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
  const comboRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ]
  const gutterRef = useRef<HTMLDivElement>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const {
    comments,
    isLoading: commentsLoading,
    create: createComment,
    update: updateComment,
    remove: removeComment,
  } = useComments(trackerId, roll?.id, "bonus")

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

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!roll) return Promise.resolve()
      return bonusRollService.delete(trackerId, weapon.id, roll.id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bonus-rolls", trackerId, weapon.id] })
      qc.invalidateQueries({ queryKey: ["tracker"] })
      addToast("Roll deleted", "success")
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

  function save(latest: BonusData) {
    if (BONUS_KEYS.every((k) => !latest[k].trim())) return
    if (roll) {
      const changed: Partial<BonusData> = {}
      for (const key of BONUS_KEYS) {
        if (latest[key].trim() !== roll[key]) changed[key] = latest[key].trim()
      }
      if (Object.keys(changed).length > 0) {
        updateRoll(weapon.id, roll.id, changed)
      }
    } else {
      createMutation.mutate({
        bonuses: {
          bonus1: latest.bonus1.trim(),
          bonus2: latest.bonus2.trim(),
          bonus3: latest.bonus3.trim(),
          bonus4: latest.bonus4.trim(),
          bonus5: latest.bonus5.trim(),
        },
        idx: index,
      })
    }
  }

  const inputBg = roll ? "bg-gray-700" : "bg-gray-800"

  return (
    <div
      className="relative group/cell flex flex-row gap-1 py-1"
      data-bonus-row={`${weapon.id}-${index}`}
    >
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        {BONUS_KEYS.map((key, i) => (
          <div key={key} ref={comboRefs[i]}>
            <ComboBox
              value={values[key]}
              onCommit={(value) => {
                const newValues = { ...values, [key]: value }
                setValues(newValues)
                save(newValues)
                if (i < 4) {
                  comboRefs[i + 1].current
                    ?.querySelector<HTMLInputElement>("input")
                    ?.focus()
                } else {
                  document
                    .querySelector<HTMLInputElement>(
                      `[data-bonus-row="${weapon.id}-${index + 1}"] input`,
                    )
                    ?.focus()
                }
              }}
              options={BONUSES}
              placeholder={`Bonus ${i + 1}`}
              inputBg={inputBg}
            />
          </div>
        ))}
      </div>

      <RollGutter
        gutterRef={gutterRef}
        comments={comments}
        hasRoll={!!roll}
        onCommentClick={() => setPopoverOpen((v) => !v)}
        onImportClick={() => setImportOpen(true)}
        onDeleteClick={() => deleteMutation.mutate()}
        deleteDisabled={deleteMutation.isPending}
      />

      {importOpen && (
        <ImportPreviewModal
          weapon={weapon}
          rollType="bonus"
          fromIndex={roll?.index ?? index}
          trackerId={trackerId}
          onClose={() => setImportOpen(false)}
        />
      )}

      {popoverOpen && roll && gutterRef.current && (
        <CommentPopover
          comments={comments}
          isLoading={commentsLoading}
          anchorRect={gutterRef.current.getBoundingClientRect()}
          onClose={() => setPopoverOpen(false)}
          onCreate={(content, color) =>
            createComment.mutate({ content, color })
          }
          onDelete={(id) => removeComment.mutate(id)}
          onUpdate={(id, data) => updateComment.mutate({ id, data })}
          isPending={
            createComment.isPending ||
            removeComment.isPending ||
            updateComment.isPending
          }
        />
      )}
    </div>
  )
}
