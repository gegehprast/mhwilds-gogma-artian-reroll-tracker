import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useAllSkillRolls } from "../hooks/useAllSkillRolls"
import { useWeapons } from "../hooks/useWeapons"
import type { SkillRoll, Tracker, Weapon } from "../lib/api-service"
import { skillRollService } from "../lib/api-service"
import { AddSkillCell } from "./AddSkillCell"
import { ImportModal } from "./ImportModal"
import { SkillDataCell } from "./SkillDataCell"
import { WeaponColumnHeader } from "./WeaponColumnHeader"

interface Props {
  tracker: Tracker
}

// ── Main component ──────────────────────────────────────────────────────────

export function SkillRollsView({ tracker }: Props) {
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
    { length: Math.max(50, maxExisting) },
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
              <WeaponColumnHeader key={w.id} weapon={w} />
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
