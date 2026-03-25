import { useMutation, useQueryClient } from "@tanstack/react-query"
import { MessageSquare, Trash2, Upload } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useComments } from "../hooks/useComments"
import type { SkillRoll, Weapon } from "../lib/api-service"
import { skillRollService } from "../lib/api-service"
import { GROUP_SKILLS, SET_SKILLS } from "../lib/constants"
import { addToast } from "../lib/toast"
import { COMMENT_COLOR_CLASSES } from "../types/comment-types"
import { ComboBox } from "./ComboBox"
import { CommentPopover } from "./CommentPopover"
import { ImportPreviewModal } from "./ImportPreviewModal"

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
  const gutterRef = useRef<HTMLDivElement>(null)
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
          rollType="skill"
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
