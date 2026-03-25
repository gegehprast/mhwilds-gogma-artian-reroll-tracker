import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { useCommentMutations } from "../hooks/useComments"
import type { SkillRollWithComments, Weapon } from "../lib/api-service"
import { skillRollService } from "../lib/api-service"
import { GROUP_SKILLS, SET_SKILLS } from "../lib/constants"
import { addToast } from "../lib/toast"
import { ComboBox } from "./ComboBox"
import { CommentPopover } from "./CommentPopover"
import { ImportPreviewModal } from "./ImportPreviewModal"
import { RollGutter } from "./RollGutter"

export interface SkillDataCellProps {
  roll: SkillRollWithComments | null
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
  const gutterRef = useRef<HTMLDivElement>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const comments = roll?.comments ?? []
  const {
    create: createComment,
    update: updateComment,
    remove: removeComment,
  } = useCommentMutations(trackerId, roll?.id, "skill")

  const createMutation = useMutation({
    mutationFn: ({ s, g, idx }: { g: string; s: string; idx: number }) =>
      skillRollService.create(trackerId, weapon.id, s, g, idx),
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

  function save(setSkill: string, groupSkill: string) {
    if (!groupSkill && !setSkill) return
    if (roll) {
      if (groupSkill !== roll.groupSkill || setSkill !== roll.setSkill) {
        updateRoll(weapon.id, roll.id, { groupSkill, setSkill })
      }
    } else {
      createMutation.mutate({ s: setSkill, g: groupSkill, idx: index })
    }
  }

  const inputBg = roll ? "bg-gray-700" : "bg-gray-800"

  return (
    <div
      className="relative group/cell flex flex-row gap-1 py-1"
      data-skill-row={`${weapon.id}-${index}`}
    >
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <ComboBox
          value={setSkill}
          onCommit={(value) => {
            setSetSkill(value)
            save(value.trim(), groupSkill.trim())
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
              save(setSkill.trim(), value.trim())
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
          rollType="skill"
          fromIndex={roll?.index ?? index}
          trackerId={trackerId}
          onClose={() => setImportOpen(false)}
        />
      )}

      {popoverOpen && roll && gutterRef.current && (
        <CommentPopover
          comments={comments}
          isLoading={false}
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
