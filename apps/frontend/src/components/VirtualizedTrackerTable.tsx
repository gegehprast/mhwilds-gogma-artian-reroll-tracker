import { useVirtualizer } from "@tanstack/react-virtual"
import { Trash2 } from "lucide-react"
import type { ReactNode } from "react"
import { useEffect, useRef, useState } from "react"
import type { Weapon } from "../lib/api-service"
import { ConfirmDialog } from "./ConfirmDialog"
import { WeaponColumnHeader } from "./WeaponColumnHeader"

interface Props {
  weapons: Weapon[]
  rowHeight: number
  existingIndices: number[]
  currentIndex?: number
  renderCell: (weapon: Weapon, idx: number) => ReactNode
  renderAddCell: (weapon: Weapon) => ReactNode
  /** When set, display only these indices (disables load-more and the Add row) */
  overrideIndices?: number[]
  onDeleteWeapon?: (weaponId: string) => void
  onReorderWeapons?: (ids: string[]) => void
  onDeletePast?: (beforeIndex: number) => Promise<void>
}

const PAGE_SIZE = 20
const MAX_ROLL_INDEX = 1000

export function VirtualizedTrackerTable({
  weapons,
  rowHeight,
  existingIndices,
  currentIndex,
  renderCell,
  renderAddCell,
  overrideIndices,
  onDeleteWeapon,
  onReorderWeapons,
  onDeletePast,
}: Props) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [confirmDeleteBefore, setConfirmDeleteBefore] = useState<number | null>(
    null,
  )
  const [isDeleting, setIsDeleting] = useState(false)
  const maxExisting =
    existingIndices.length > 0 ? existingIndices[existingIndices.length - 1] : 0
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(Math.max(PAGE_SIZE, maxExisting), MAX_ROLL_INDEX),
  )
  const totalRows = Math.min(
    Math.max(visibleCount, maxExisting),
    MAX_ROLL_INDEX,
  )
  const allIndices =
    overrideIndices ?? Array.from({ length: totalRows }, (_, i) => i + 1)
  const nextIndex = totalRows + 1

  const scrollRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: allIndices.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
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
    if (overrideIndices) return
    if (
      lastVirtualRowIndex !== undefined &&
      lastVirtualRowIndex >= allIndices.length - 3
    ) {
      setVisibleCount((c) => Math.min(c + PAGE_SIZE, MAX_ROLL_INDEX))
    }
  }, [lastVirtualRowIndex, allIndices.length, overrideIndices])

  return (
    <div ref={scrollRef} className="flex-1 overflow-auto">
      {confirmDeleteBefore !== null && (
        <ConfirmDialog
          title="Delete past rolls"
          message={`Delete all rolls before index ${confirmDeleteBefore} across every weapon? This cannot be undone.`}
          confirmLabel="Delete all"
          isPending={isDeleting}
          onCancel={() => setConfirmDeleteBefore(null)}
          onConfirm={async () => {
            if (!onDeletePast || confirmDeleteBefore === null) return
            setIsDeleting(true)
            try {
              await onDeletePast(confirmDeleteBefore)
            } finally {
              setIsDeleting(false)
              setConfirmDeleteBefore(null)
            }
          }}
        />
      )}
      <table className="border-collapse text-sm min-w-max">
        {/* ── Header ── */}
        <thead>
          <tr className="bg-gray-900 border-b-2 border-gray-700">
            <th className="sticky top-0 left-0 z-20 bg-gray-900 text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide border-r border-gray-700 w-20 min-w-20">
              Index
            </th>
            {weapons.map((w) => (
              <WeaponColumnHeader
                key={w.id}
                weapon={w}
                isDragging={draggedId === w.id}
                isDragOver={dragOverId === w.id && draggedId !== w.id}
                onDragStart={(e) => {
                  setDraggedId(w.id)
                  e.dataTransfer.effectAllowed = "move"
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = "move"
                  if (w.id !== draggedId) setDragOverId(w.id)
                }}
                onDragLeave={() => setDragOverId(null)}
                onDrop={(e) => {
                  e.preventDefault()
                  if (!draggedId || draggedId === w.id) return
                  const from = weapons.findIndex((x) => x.id === draggedId)
                  const to = weapons.findIndex((x) => x.id === w.id)
                  if (from === -1 || to === -1) return
                  const next = [...weapons]
                  const [moved] = next.splice(from, 1)
                  if (!moved) return
                  next.splice(to, 0, moved)
                  onReorderWeapons?.(next.map((x) => x.id))
                  setDraggedId(null)
                  setDragOverId(null)
                }}
                onDragEnd={() => {
                  setDraggedId(null)
                  setDragOverId(null)
                }}
                onDelete={() => onDeleteWeapon?.(w.id)}
              />
            ))}
          </tr>
        </thead>

        <tbody>
          {paddingTop > 0 && (
            <tr>
              <td colSpan={weapons.length + 1} style={{ height: paddingTop }} />
            </tr>
          )}

          {virtualRows.map((vRow) => {
            const idx = allIndices[vRow.index]
            if (idx === undefined) return null
            const isCurrentIndex = idx === currentIndex
            const isPast = currentIndex !== undefined && idx < currentIndex
            return (
              <tr
                key={idx}
                className={`group/row border-b transition-colors border-gray-800/60 ${
                  idx % 2 === 0 ? "bg-gray-800/20" : ""
                } ${isPast ? "saturate-40 opacity-70" : ""}`}
              >
                <td
                  className={`sticky left-0 z-10 px-4 py-2 font-mono text-sm text-center align-middle transition-colors group/index-cell ${
                    isCurrentIndex
                      ? "bg-red-950 group-hover/row:bg-red-800 group-focus-within/row:bg-red-800 text-red-300 border-r border-red-800"
                      : "bg-gray-950 group-hover/row:bg-gray-800 group-focus-within/row:bg-gray-800 text-gray-300 border-r border-gray-800"
                  }`}
                >
                  {isPast && onDeletePast ? (
                    <>
                      <span className="group-hover/index-cell:hidden">
                        {idx}
                      </span>
                      <button
                        type="button"
                        title={`Delete all rolls before index ${idx + 1}`}
                        onClick={() => setConfirmDeleteBefore(idx + 1)}
                        className="hidden group-hover/index-cell:flex items-center justify-center w-full text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  ) : (
                    idx
                  )}
                </td>
                {weapons.map((w) => (
                  <td
                    key={w.id}
                    className={`pl-3 pr-1 align-top w-52 transition-colors border-r border-gray-800 ${
                      isCurrentIndex
                        ? "bg-red-500/30 group-hover/row:bg-red-500/50 group-focus-within/row:bg-red-500/50"
                        : "group-hover/row:bg-gray-800/50 group-focus-within/row:bg-gray-800/50"
                    }`}
                  >
                    {renderCell(w, idx)}
                  </td>
                ))}
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
          {!overrideIndices && (
            <tr className="border-b border-gray-700 bg-gray-900/50">
              <td className="sticky left-0 z-10 bg-gray-900 px-4 py-2 font-mono text-sm text-red-400 border-r border-gray-700 text-center align-top">
                {nextIndex}
              </td>
              {weapons.map((w) => (
                <td
                  key={w.id}
                  className="px-3 py-1 border-r border-gray-700 align-top w-52"
                >
                  {renderAddCell(w)}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
