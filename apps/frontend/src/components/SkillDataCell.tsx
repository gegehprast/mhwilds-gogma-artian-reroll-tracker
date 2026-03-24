import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { useComments } from "../hooks/useComments"
import type { SkillRoll, Weapon } from "../lib/api-service"
import { skillRollService } from "../lib/api-service"
import { GROUP_SKILLS, SERIES_SKILLS } from "../lib/constants"
import { addToast } from "../lib/toast"
import { ComboBox } from "./ComboBox"
import { CommentPin } from "./CommentPin"
import { CommentPopover } from "./CommentPopover"

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
}

export function SkillDataCell({
  roll,
  index,
  weapon,
  trackerId,
  updateRoll,
}: SkillDataCellProps) {
  const qc = useQueryClient()
  const [groupSkill, setGroupSkill] = useState(roll?.groupSkill ?? "")
  const [seriesSkill, setSeriesSkill] = useState(roll?.seriesSkill ?? "")
  const groupContainerRef = useRef<HTMLDivElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)

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
      setSeriesSkill("")
      addToast("Roll saved", "success")
    },
  })

  useEffect(() => {
    setGroupSkill(roll?.groupSkill ?? "")
    setSeriesSkill(roll?.seriesSkill ?? "")
  }, [roll?.groupSkill, roll?.seriesSkill])

  function save(g: string, s: string) {
    if (!g && !s) return
    if (roll) {
      if (g !== roll.groupSkill || s !== roll.seriesSkill) {
        updateRoll(weapon.id, roll.id, { groupSkill: g, seriesSkill: s })
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
          value={seriesSkill}
          onCommit={(value) => {
            setSeriesSkill(value)
            save(groupSkill.trim(), value.trim())
            groupContainerRef.current
              ?.querySelector<HTMLInputElement>("input")
              ?.focus()
          }}
          options={SERIES_SKILLS}
          placeholder="Series skill"
          inputBg={inputBg}
        />
        <div ref={groupContainerRef}>
          <ComboBox
            value={groupSkill}
            onCommit={(value) => {
              setGroupSkill(value)
              save(value.trim(), seriesSkill.trim())
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

      {roll && (
        <div
          ref={pinRef}
          className="absolute right-0 top-0 bottom-0 flex items-center py-1"
        >
          <CommentPin
            comments={comments}
            onClick={() => setPopoverOpen((v) => !v)}
          />
        </div>
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
