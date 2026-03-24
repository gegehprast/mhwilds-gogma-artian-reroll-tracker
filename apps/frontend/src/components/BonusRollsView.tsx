import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useEffect, useRef, useState } from "react"
import { useAllBonusRolls } from "../hooks/useAllBonusRolls"
import { useWeapons } from "../hooks/useWeapons"
import type { Tracker, Weapon } from "../lib/api-service"
import { bonusRollService } from "../lib/api-service"
import { addToast } from "../lib/toast"
import type { BonusData } from "../types/bonus-roll-types"
import { AddBonusCell } from "./AddBonusCell"
import { BonusDataCell } from "./BonusDataCell"
import { WeaponColumnHeader } from "./WeaponColumnHeader"

interface Props {
  tracker: Tracker
}

// ── Main component ──────────────────────────────────────────────────────────────

export function BonusRollsView({ tracker }: Props) {
  const qc = useQueryClient()
  const { query: weaponsQuery } = useWeapons(tracker.id)
  const weapons: Weapon[] = weaponsQuery.data ?? []
  const { data: rollsByWeapon, isLoading } = useAllBonusRolls(
    tracker.id,
    weapons,
  )

  const updateRollMutation = useMutation({
    mutationFn: ({
      weaponId,
      rollId,
      data,
    }: {
      weaponId: string
      rollId: string
      data: Partial<BonusData>
    }) => bonusRollService.update(tracker.id, weaponId, rollId, data),
    onSuccess: (_, { weaponId }) => {
      qc.invalidateQueries({ queryKey: ["bonus-rolls", tracker.id, weaponId] })
      addToast("Roll updated", "success")
    },
  })

  const existingIndices: number[] = Array.from(
    new Set(
      Array.from(rollsByWeapon.values()).flatMap((rolls) =>
        rolls.map((r) => r.index),
      ),
    ),
  ).sort((a, b) => a - b)

  const PAGE_SIZE = 20
  const BONUS_ROW_HEIGHT = 148

  const maxExisting =
    existingIndices.length > 0 ? existingIndices[existingIndices.length - 1] : 0
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.max(PAGE_SIZE, maxExisting),
  )
  const totalRows = Math.max(visibleCount, maxExisting)
  const allIndices = Array.from({ length: totalRows }, (_, i) => i + 1)
  const nextIndex = totalRows + 1

  const scrollRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: allIndices.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => BONUS_ROW_HEIGHT,
    overscan: 5,
  })
  const virtualRows = virtualizer.getVirtualItems()
  const totalVirtualSize = virtualizer.getTotalSize()
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0
  const paddingBottom =
    virtualRows.length > 0
      ? totalVirtualSize - virtualRows[virtualRows.length - 1].end
      : 0

  const lastVirtualRowIndex = virtualRows[virtualRows.length - 1]?.index
  useEffect(() => {
    if (
      lastVirtualRowIndex !== undefined &&
      lastVirtualRowIndex >= allIndices.length - 3
    ) {
      setVisibleCount((c) => c + PAGE_SIZE)
    }
  }, [lastVirtualRowIndex, allIndices.length])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-400" />
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
    <div ref={scrollRef} className="flex-1 overflow-auto">
      <table className="border-collapse text-sm min-w-max">
        {/* ── Header ── */}
        <thead>
          <tr className="bg-gray-900 border-b-2 border-gray-700">
            <th className="sticky top-0 left-0 z-20 bg-gray-900 text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide border-r border-gray-700 w-20 min-w-20">
              Index
            </th>
            {weapons.map((w) => (
              <WeaponColumnHeader key={w.id} weapon={w} />
            ))}
          </tr>
        </thead>

        <tbody>
          {paddingTop > 0 && (
            <tr>
              <td colSpan={weapons.length + 1} style={{ height: paddingTop }} />
            </tr>
          )}
          {/* ── Data rows ── */}
          {virtualRows.map((vRow) => {
            const idx = allIndices[vRow.index]
            const isCurrentIndex = idx === tracker.bonusIndex
            return (
              <tr
                key={idx}
                className={`group/row border-b transition-colors border-gray-800/60`}
              >
                <td
                  className={`sticky left-0 z-10 px-4 py-2 font-mono text-sm text-center align-middle transition-colors ${
                    isCurrentIndex
                      ? "bg-red-500/30 group-hover/row:bg-red-500/50 group-focus-within/row:bg-red-500/50 text-red-400 border-r border-red-500/30"
                      : "bg-gray-950 group-hover/row:bg-gray-900 group-focus-within/row:bg-gray-900 text-gray-400 border-r border-gray-800"
                  }`}
                >
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
                      className={`px-3 align-top w-52 transition-colors border-r border-gray-800 ${
                        isCurrentIndex
                          ? "bg-red-500/30 group-hover/row:bg-red-500/50 group-focus-within/row:bg-red-500/50"
                          : "group-hover/row:bg-gray-800/50 group-focus-within/row:bg-gray-800/50"
                      }`}
                    >
                      <BonusDataCell
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
            )
          })}
          {paddingBottom > 0 && (
            <tr>
              <td
                colSpan={weapons.length + 1}
                style={{ height: paddingBottom }}
              />
            </tr>
          )}

          {/* ── Add row ── */}
          <tr className="border-b border-gray-700 bg-gray-900/50">
            <td className="sticky left-0 z-10 bg-gray-900 px-4 py-2 font-mono text-sm text-red-400 border-r border-gray-700 text-center align-top">
              {nextIndex}
            </td>
            {weapons.map((w) => (
              <td
                key={w.id}
                className="px-3 py-1 border-r border-gray-700 align-top w-52"
              >
                <AddBonusCell weapon={w} trackerId={tracker.id} />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
