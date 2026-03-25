import { useMutation, useQueryClient } from "@tanstack/react-query"
import { MessageSquare, Trash2, Upload } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useComments } from "../hooks/useComments"
import type { BonusRoll, Weapon } from "../lib/api-service"
import { bonusRollService } from "../lib/api-service"
import { BONUSES } from "../lib/constants"
import { addToast } from "../lib/toast"
import type { BonusData } from "../types/bonus-roll-types"
import { BONUS_KEYS } from "../types/bonus-roll-types"
import { COMMENT_COLOR_CLASSES } from "../types/comment-types"
import { ComboBox } from "./ComboBox"
import { CommentPopover } from "./CommentPopover"
import { ImportPreviewModal } from "./ImportPreviewModal"

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

      <div ref={gutterRef} className="w-4 shrink-0 relative">
        {/* Comment dots — always visible, fade on hover */}
        <div className="absolute inset-0 flex flex-col items-center gap-0.5 py-1 transition-opacity opacity-100 group-hover/cell:opacity-0 pointer-events-none">
          {roll &&
            comments.map((c) => (
              <div
                key={c.id}
                className={`w-2 h-2 rounded-full shrink-0 ${COMMENT_COLOR_CLASSES[c.color].bg}`}
              />
            ))}
        </div>

        {/* Action buttons — revealed on hover */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-y-1.5 py-0.5 transition-opacity opacity-0 group-hover/cell:opacity-100 pointer-events-none group-hover/cell:pointer-events-auto">
          {roll && (
            <button
              type="button"
              title={
                comments.length > 0
                  ? `${comments.length} comment(s)`
                  : "Add comment"
              }
              onClick={() => setPopoverOpen((v) => !v)}
              className="relative flex items-center justify-center text-gray-500 hover:text-gray-200 transition-colors"
            >
              <MessageSquare size={11} />
              {comments.length > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full flex items-center justify-center text-white"
                  style={{ fontSize: "7px" }}
                >
                  {comments.length}
                </span>
              )}
            </button>
          )}
          <button
            type="button"
            title="Import rolls from this index"
            onClick={() => setImportOpen(true)}
            className="flex items-center justify-center text-gray-500 hover:text-gray-200 transition-colors"
          >
            <Upload size={11} />
          </button>
          {roll && (
            <button
              type="button"
              title="Delete roll"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors disabled:opacity-40"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>

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
