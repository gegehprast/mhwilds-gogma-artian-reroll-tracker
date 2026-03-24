import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { useAllSkillRolls } from "../hooks/useAllSkillRolls"
import { useWeapons } from "../hooks/useWeapons"
import type { SkillRoll, Tracker, Weapon } from "../lib/api-service"
import { skillRollService } from "../lib/api-service"
import { ImportModal } from "./ImportModal"

interface Props {
  tracker: Tracker
}

// ── Data-row cell: handles update for existing rolls, create-at-index for empty ──

interface SkillDataCellProps {
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

function SkillDataCell({
  roll,
  index,
  weapon,
  trackerId,
  updateRoll,
  updating,
}: SkillDataCellProps) {
  const qc = useQueryClient()
  const [groupSkill, setGroupSkill] = useState(roll?.groupSkill ?? "")
  const [seriesSkill, setSeriesSkill] = useState(roll?.seriesSkill ?? "")
  const seriesRef = useRef<HTMLInputElement>(null)

  const createMutation = useMutation({
    mutationFn: ({ g, s, idx }: { g: string; s: string; idx: number }) =>
      skillRollService.create(trackerId, weapon.id, g, s, idx),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skill-rolls", trackerId, weapon.id] })
      qc.invalidateQueries({ queryKey: ["tracker"] })
      setGroupSkill("")
      setSeriesSkill("")
    },
  })

  useEffect(() => {
    setGroupSkill(roll?.groupSkill ?? "")
    setSeriesSkill(roll?.seriesSkill ?? "")
  }, [roll?.groupSkill, roll?.seriesSkill])

  function save() {
    const g = groupSkill.trim()
    const s = seriesSkill.trim()
    if (!g || !s) {
      setGroupSkill(roll?.groupSkill ?? "")
      setSeriesSkill(roll?.seriesSkill ?? "")
      return
    }
    if (roll) {
      if (g !== roll.groupSkill || s !== roll.seriesSkill) {
        updateRoll(weapon.id, roll.id, { groupSkill: g, seriesSkill: s })
      }
    } else {
      createMutation.mutate({ g, s, idx: index })
    }
  }

  function reset() {
    setGroupSkill(roll?.groupSkill ?? "")
    setSeriesSkill(roll?.seriesSkill ?? "")
  }

  const isPending = roll ? updating : createMutation.isPending
  const inputBg = roll ? "bg-gray-700" : "bg-gray-800"

  return (
    <div className="flex flex-col gap-1 py-1">
      <input
        className={`w-full ${inputBg} text-gray-100 text-xs rounded px-2 py-1 border border-gray-700 focus:border-amber-500 outline-none placeholder-gray-600`}
        value={groupSkill}
        onChange={(e) => setGroupSkill(e.target.value)}
        placeholder="Group skill"
        disabled={isPending}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            save()
            seriesRef.current?.focus()
          }
          if (e.key === "Escape") reset()
        }}
      />
      <input
        ref={seriesRef}
        className={`w-full ${inputBg} text-gray-100 text-xs rounded px-2 py-1 border border-gray-700 focus:border-amber-500 outline-none placeholder-gray-600`}
        value={seriesSkill}
        onChange={(e) => setSeriesSkill(e.target.value)}
        placeholder="Series skill"
        disabled={isPending}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            save()
          }
          if (e.key === "Escape") reset()
        }}
        onBlur={roll ? save : undefined}
      />
      {isPending && (
        <span className="text-[10px] text-gray-500 text-center">saving…</span>
      )}
    </div>
  )
}

// ── Add-row cell (one per weapon column in the bottom add row) ──────────────

function AddSkillCell({
  weapon,
  trackerId,
}: {
  weapon: Weapon
  trackerId: string
}) {
  const qc = useQueryClient()
  const [groupSkill, setGroupSkill] = useState("")
  const [seriesSkill, setSeriesSkill] = useState("")
  const seriesRef = useRef<HTMLInputElement>(null)

  const create = useMutation({
    mutationFn: ({ g, s }: { g: string; s: string }) =>
      skillRollService.create(trackerId, weapon.id, g, s),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skill-rolls", trackerId, weapon.id] })
      qc.invalidateQueries({ queryKey: ["tracker"] })
      setGroupSkill("")
      setSeriesSkill("")
    },
  })

  function submit() {
    const g = groupSkill.trim()
    const s = seriesSkill.trim()
    if (!g || !s) return
    create.mutate({ g, s })
  }

  return (
    <div className="flex flex-col gap-1 py-1">
      <input
        className="w-full bg-gray-800 text-gray-100 text-xs rounded px-2 py-1 border border-gray-700 focus:border-amber-500 outline-none placeholder-gray-600"
        value={groupSkill}
        onChange={(e) => setGroupSkill(e.target.value)}
        placeholder="Group skill"
        disabled={create.isPending}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            seriesRef.current?.focus()
          }
        }}
      />
      <input
        ref={seriesRef}
        className="w-full bg-gray-800 text-gray-100 text-xs rounded px-2 py-1 border border-gray-700 focus:border-amber-500 outline-none placeholder-gray-600"
        value={seriesSkill}
        onChange={(e) => setSeriesSkill(e.target.value)}
        placeholder="Series skill"
        disabled={create.isPending}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            submit()
          }
        }}
      />
      <button
        type="button"
        onClick={submit}
        disabled={create.isPending || !groupSkill.trim() || !seriesSkill.trim()}
        className="w-full bg-amber-500/20 hover:bg-amber-500/40 disabled:opacity-40 text-amber-300 text-xs font-semibold rounded py-1 transition-colors"
      >
        {create.isPending ? "…" : "Add roll"}
      </button>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export function SkillRollsBirdView({ tracker }: Props) {
  const qc = useQueryClient()
  const { query: weaponsQuery } = useWeapons(tracker.id)
  const weapons: Weapon[] = weaponsQuery.data ?? []
  const { data: rollsByWeapon, isLoading } = useAllSkillRolls(
    tracker.id,
    weapons,
  )
  const [importTarget, setImportTarget] = useState<{
    roll: SkillRoll
    weapon: Weapon
  } | null>(null)

  const updateRollMutation = useMutation({
    mutationFn: ({
      weaponId,
      rollId,
      data,
    }: {
      weaponId: string
      rollId: string
      data: { groupSkill?: string; seriesSkill?: string }
    }) => skillRollService.update(tracker.id, weaponId, rollId, data),
    onSuccess: (_, { weaponId }) => {
      qc.invalidateQueries({ queryKey: ["skill-rolls", tracker.id, weaponId] })
    },
  })

  const importRollsMutation = useMutation({
    mutationFn: ({
      weaponId,
      selectedIndex,
      rolls,
    }: {
      weaponId: string
      selectedIndex: number
      rolls: Array<{
        attemptNum: number
        groupSkill: string
        seriesSkill: string
      }>
    }) => skillRollService.import(tracker.id, weaponId, selectedIndex, rolls),
    onSuccess: (_, { weaponId }) => {
      qc.invalidateQueries({ queryKey: ["skill-rolls", tracker.id, weaponId] })
    },
  })

  const existingIndices: number[] = Array.from(
    new Set(
      Array.from(rollsByWeapon.values()).flatMap((rolls) =>
        rolls.map((r) => r.index),
      ),
    ),
  ).sort((a, b) => a - b)

  const maxExisting =
    existingIndices.length > 0 ? existingIndices[existingIndices.length - 1] : 0
  const allIndices = Array.from(
    { length: Math.max(100, maxExisting) },
    (_, i) => i + 1,
  )
  const nextIndex = allIndices[allIndices.length - 1] + 1

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
      </div>
    )
  }

  if (weapons.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
        No weapons added yet — use the button above to add one.
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="border-collapse text-sm min-w-max">
        {/* ── Header ── */}
        <thead className="sticky top-0 z-10">
          <tr className="bg-gray-900 border-b-2 border-gray-700">
            <th className="sticky left-0 z-20 bg-gray-900 text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide border-r border-gray-700 w-20 min-w-20">
              Index
            </th>
            {weapons.map((w) => (
              <th
                key={w.id}
                className="px-4 py-3 border-r border-gray-700 w-52 text-center"
              >
                <div className="font-semibold text-gray-100 text-sm">
                  {w.weaponType}
                </div>
                <div className="text-xs text-amber-400 font-normal mt-0.5">
                  {w.element}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {/* ── Data rows ── */}
          {allIndices.map((idx) => (
            <tr
              key={idx}
              className="group/row border-b border-gray-800/60 hover:bg-gray-800/20 transition-colors"
            >
              <td className="sticky left-0 z-10 bg-gray-950 group-hover/row:bg-gray-900 px-4 py-2 font-mono text-sm text-gray-400 border-r border-gray-800 text-center align-middle transition-colors">
                {idx}
              </td>
              {weapons.map((w) => {
                const roll =
                  (rollsByWeapon.get(w.id) ?? []).find(
                    (r) => r.index === idx,
                  ) ?? null
                return (
                  <td
                    key={w.id}
                    className="px-3 border-r border-gray-800 align-top w-52"
                  >
                    <SkillDataCell
                      roll={roll}
                      index={idx}
                      weapon={w}
                      trackerId={tracker.id}
                      updateRoll={(weaponId, rollId, data) =>
                        updateRollMutation.mutate({ weaponId, rollId, data })
                      }
                      updating={updateRollMutation.isPending}
                    />
                  </td>
                )
              })}
            </tr>
          ))}

          {/* ── Add row ── */}
          <tr className="border-b border-gray-700 bg-gray-900/50">
            <td className="sticky left-0 z-10 bg-gray-900 px-4 py-2 font-mono text-sm text-amber-400 border-r border-gray-700 text-center align-top">
              {nextIndex}
            </td>
            {weapons.map((w) => (
              <td
                key={w.id}
                className="px-3 py-1 border-r border-gray-700 align-top w-52"
              >
                <AddSkillCell weapon={w} trackerId={tracker.id} />
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {importTarget && (
        <ImportModal
          type="skills"
          selectedIndex={importTarget.roll.index}
          onClose={() => setImportTarget(null)}
          onImport={(idx, rawRows) => {
            const rows = rawRows as Array<{
              attemptNum: number
              groupSkill: string
              seriesSkill: string
            }>
            importRollsMutation.mutate(
              {
                weaponId: importTarget.weapon.id,
                selectedIndex: idx,
                rolls: rows,
              },
              { onSuccess: () => setImportTarget(null) },
            )
          }}
        />
      )}
    </div>
  )
}
