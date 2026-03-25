import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { useComments } from "../hooks/useComments"
import type { SkillRoll, Weapon } from "../lib/api-service"
import { skillRollService } from "../lib/api-service"
import { GROUP_SKILLS, SET_SKILLS } from "../lib/constants"
import { addToast } from "../lib/toast"
import { ComboBox } from "./ComboBox"
import { CommentPin } from "./CommentPin"
import { CommentPopover } from "./CommentPopover"
import { ImportPreviewModal } from "./ImportPreviewModal"
import { PinIconButton } from "./PinIconButton"

export interface SkillDataCellProps {
  roll: SkillRoll | null
  index: number
  weapon: Weapon
  trackerId: string
  updateRoll: (
    weaponId: string,
    rollId: string,
    data: { setSkill?: string; groupSkill?: string },
  ) => void
  updating: boolean
}

export function SkillDataCell({
  roll,
  index,
  weapon,
  trackerId,
  updateRoll,
}: SkillDataCellProps) {
  const qc = useQueryClient()
  const [setSkill, setSetSkill] = useState(roll?.setSkill ?? "")
  const [groupSkill, setGroupSkill] = useState(roll?.groupSkill ?? "")
  const groupContainerRef = useRef<HTMLDivElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const {
    comments,
    isLoading: commentsLoading,
    create: createComment,
    update: updateComment,
    remove: removeComment,
  } = useComments(trackerId, roll?.id, "skill")

  const createMutation = useMutation({
    mutationFn: ({ g, s, idx }: { g: string; s: string; idx: number }) =>
      skillRollService.create(trackerId, weapon.id, g, s, idx),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skill-rolls", trackerId, weapon.id] })
      qc.invalidateQueries({ queryKey: ["tracker"] })
      setGroupSkill("")
      setSetSkill("")
      addToast("Roll saved", "success")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!roll) return Promise.resolve()
      return skillRollService.delete(trackerId, weapon.id, roll.id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skill-rolls", trackerId, weapon.id] })
      qc.invalidateQueries({ queryKey: ["tracker"] })
      addToast("Roll deleted", "success")
    },
  })

  useEffect(() => {
    setGroupSkill(roll?.groupSkill ?? "")
    setSetSkill(roll?.setSkill ?? "")
  }, [roll?.groupSkill, roll?.setSkill])

  function save(g: string, s: string) {
    if (!g && !s) return
    if (roll) {
      if (g !== roll.groupSkill || s !== roll.setSkill) {
        updateRoll(weapon.id, roll.id, { groupSkill: g, setSkill: s })
      }
    } else {
      createMutation.mutate({ g, s, idx: index })
    }
  }

  const inputBg = roll ? "bg-gray-700" : "bg-gray-800"

  return (
    <div
      className="relative flex flex-row gap-1 py-1 pr-4"
      data-skill-row={`${weapon.id}-${index}`}
    >
      <div className="flex-1 flex flex-col gap-1">
        <ComboBox
          value={setSkill}
          onCommit={(value) => {
            setSetSkill(value)
            save(groupSkill.trim(), value.trim())
            groupContainerRef.current
              ?.querySelector<HTMLInputElement>("input")
              ?.focus()
          }}
          options={SET_SKILLS}
          placeholder="Set skill"
          inputBg={inputBg}
        />
        <div ref={groupContainerRef}>
          <ComboBox
            value={groupSkill}
            onCommit={(value) => {
              setGroupSkill(value)
              save(value.trim(), setSkill.trim())
              document
                .querySelector<HTMLInputElement>(
                  `[data-skill-row="${weapon.id}-${index + 1}"] input`,
                )
                ?.focus()
            }}
            options={GROUP_SKILLS}
            placeholder="Group skill"
            inputBg={inputBg}
          />
        </div>
      </div>

      <div
        ref={pinRef}
        className="absolute -right-4.5 top-0 bottom-0 flex flex-col items-center justify-around py-1"
      >
        {roll && (
          <CommentPin
            comments={comments}
            onClick={() => setPopoverOpen((v) => !v)}
          />
        )}
      </div>

      <div className="absolute right-0 top-0 bottom-0 flex flex-col items-center justify-around py-1">
        <PinIconButton
          label="Upload rolls from this index"
          onClick={() => setImportOpen(true)}
        >
          <span className="font-mono leading-none">↑</span>
        </PinIconButton>
        {roll && (
          <PinIconButton
            label="Delete roll"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            variant="danger"
          >
            <span className="font-mono leading-none">×</span>
          </PinIconButton>
        )}
      </div>

      {importOpen && (
        <ImportPreviewModal
          weapon={weapon}
          rollType="skill"
          fromIndex={roll?.index ?? index}
          trackerId={trackerId}
          onClose={() => setImportOpen(false)}
        />
      )}

      {popoverOpen && roll && pinRef.current && (
        <CommentPopover
          comments={comments}
          isLoading={commentsLoading}
          anchorRect={pinRef.current.getBoundingClientRect()}
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
