import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { useAllSkillRolls } from "../hooks/useAllSkillRolls"
import { useWeapons } from "../hooks/useWeapons"
import type { SkillRoll, Tracker, Weapon } from "../lib/api-service"
import { skillRollService } from "../lib/api-service"
import type { Element, WeaponType } from "../lib/constants"
import { ELEMENTS, WEAPON_TYPES } from "../lib/constants"
import { ImportModal } from "./ImportModal"

interface Props {
  tracker: Tracker
}

// ── Add weapon popover ──────────────────────────────────────────────────────

function AddWeaponPopover({
  trackerId,
  onDone,
}: {
  trackerId: string
  onDone: () => void
}) {
  const { findOrCreate } = useWeapons(trackerId)
  const [weaponType, setWeaponType] = useState<WeaponType>(WEAPON_TYPES[0])
  const [element, setElement] = useState<Element>(ELEMENTS[0])

  return (
    <div className="absolute right-0 top-full mt-1 z-30 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-3 flex flex-col gap-2 w-52">
      <select
        className="bg-gray-700 text-gray-100 text-xs rounded px-2 py-1.5 border border-gray-600"
        value={weaponType}
        onChange={(e) => setWeaponType(e.target.value as WeaponType)}
      >
        {WEAPON_TYPES.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>
      <select
        className="bg-gray-700 text-gray-100 text-xs rounded px-2 py-1.5 border border-gray-600"
        value={element}
        onChange={(e) => setElement(e.target.value as Element)}
      >
        {ELEMENTS.map((e) => (
          <option key={e}>{e}</option>
        ))}
      </select>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() =>
            findOrCreate.mutate({ weaponType, element }, { onSuccess: onDone })
          }
          disabled={findOrCreate.isPending}
          className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-xs font-semibold rounded py-1.5"
        >
          {findOrCreate.isPending ? "…" : "Add"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="flex-1 bg-gray-600 hover:bg-gray-500 text-gray-200 text-xs rounded py-1.5"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Editable roll cell ──────────────────────────────────────────────────────

interface EditableCellProps {
  roll: SkillRoll
  weapon: Weapon
  onImport: (roll: SkillRoll, weapon: Weapon) => void
  updateRoll: (
    weaponId: string,
    rollId: string,
    data: { groupSkill?: string; seriesSkill?: string },
  ) => void
  deleteRoll: (weaponId: string, rollId: string) => void
  updating: boolean
}

function EditableSkillCell({
  roll,
  weapon,
  onImport,
  updateRoll,
  deleteRoll,
  updating,
}: EditableCellProps) {
  const [groupSkill, setGroupSkill] = useState(roll.groupSkill)
  const [seriesSkill, setSeriesSkill] = useState(roll.seriesSkill)
  const seriesRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setGroupSkill(roll.groupSkill)
    setSeriesSkill(roll.seriesSkill)
  }, [roll.groupSkill, roll.seriesSkill])

  function save() {
    const g = groupSkill.trim()
    const s = seriesSkill.trim()
    if (!g || !s) {
      setGroupSkill(roll.groupSkill)
      setSeriesSkill(roll.seriesSkill)
      return
    }
    if (g !== roll.groupSkill || s !== roll.seriesSkill) {
      updateRoll(weapon.id, roll.id, { groupSkill: g, seriesSkill: s })
    }
  }

  function reset() {
    setGroupSkill(roll.groupSkill)
    setSeriesSkill(roll.seriesSkill)
  }

  return (
    <div className="flex flex-col gap-1 py-1">
      <div className="flex justify-end gap-0.5 mb-0.5">
        <button
          type="button"
          onClick={() => onImport(roll, weapon)}
          className="text-gray-500 hover:text-blue-400 text-[10px] px-0.5 leading-none"
          title="Import from here"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={() => deleteRoll(weapon.id, roll.id)}
          className="text-gray-500 hover:text-red-400 text-[10px] px-0.5 leading-none"
          title="Delete"
        >
          ✕
        </button>
      </div>
      <input
        className="w-full bg-gray-700 text-gray-100 text-xs rounded px-2 py-1 border border-gray-700 focus:border-amber-500 outline-none"
        value={groupSkill}
        onChange={(e) => setGroupSkill(e.target.value)}
        placeholder="Group skill"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            seriesRef.current?.focus()
          }
          if (e.key === "Escape") reset()
        }}
      />
      <input
        ref={seriesRef}
        className="w-full bg-gray-700 text-gray-100 text-xs rounded px-2 py-1 border border-gray-700 focus:border-amber-500 outline-none"
        value={seriesSkill}
        onChange={(e) => setSeriesSkill(e.target.value)}
        placeholder="Series skill"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            save()
          }
          if (e.key === "Escape") reset()
        }}
        onBlur={save}
      />
      {updating && (
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
  const [addingWeapon, setAddingWeapon] = useState(false)
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

  const deleteRollMutation = useMutation({
    mutationFn: ({ weaponId, rollId }: { weaponId: string; rollId: string }) =>
      skillRollService.delete(tracker.id, weaponId, rollId),
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

  const allIndices: number[] = Array.from(
    new Set(
      Array.from(rollsByWeapon.values()).flatMap((rolls) =>
        rolls.map((r) => r.index),
      ),
    ),
  ).sort((a, b) => a - b)

  const nextIndex =
    allIndices.length > 0 ? allIndices[allIndices.length - 1] + 1 : 1

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
      </div>
    )
  }

  if (weapons.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-600">
        No weapons yet — use the Skill Rolls tab to add one.
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
            <th className="sticky right-0 z-20 bg-gray-900 px-3 py-3 border-l border-gray-700 w-10">
              <button
                type="button"
                onClick={() => setAddingWeapon(!addingWeapon)}
                className="text-amber-400 hover:text-amber-300 text-xl leading-none font-bold"
                title="Add weapon"
              >
                +
              </button>
              {addingWeapon && (
                <AddWeaponPopover
                  trackerId={tracker.id}
                  onDone={() => setAddingWeapon(false)}
                />
              )}
            </th>
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
                    {roll ? (
                      <EditableSkillCell
                        roll={roll}
                        weapon={w}
                        onImport={(r, wep) =>
                          setImportTarget({ roll: r, weapon: wep })
                        }
                        updateRoll={(weaponId, rollId, data) =>
                          updateRollMutation.mutate({ weaponId, rollId, data })
                        }
                        deleteRoll={(weaponId, rollId) =>
                          deleteRollMutation.mutate({ weaponId, rollId })
                        }
                        updating={updateRollMutation.isPending}
                      />
                    ) : (
                      <div className="py-2 text-center text-gray-700 text-xs select-none">
                        —
                      </div>
                    )}
                  </td>
                )
              })}
              <td />
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
            <td />
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
