import type { DragEvent } from "react"
import type { Weapon } from "../lib/api-service"
import { PinIconButton } from "./PinIconButton"

interface Props {
  weapon: Weapon
  isDragging: boolean
  isDragOver: boolean
  onDragStart: (e: DragEvent<HTMLTableCellElement>) => void
  onDragOver: (e: DragEvent<HTMLTableCellElement>) => void
  onDragLeave: () => void
  onDrop: (e: DragEvent<HTMLTableCellElement>) => void
  onDragEnd: () => void
  onDelete: () => void
}

export function WeaponColumnHeader({
  weapon,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onDelete,
}: Props) {
  return (
    <th
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`sticky top-0 z-10 px-3 py-1 border-r w-52 text-center select-none transition-colors ${
        isDragOver
          ? "border-l-2 border-l-red-400 bg-gray-800"
          : isDragging
            ? "bg-gray-900/50 opacity-40"
            : "bg-gray-900 border-gray-700 cursor-grab"
      }`}
    >
      <div className="flex flex-row items-center justify-start gap-1">
        <div className="flex flex-col items-start">
          <div className="text-xs text-red-400 font-normal mt-0.5">
            {weapon.element}
          </div>
          <div className="font-semibold text-gray-100 text-sm">
            {weapon.weaponType}
          </div>
        </div>
        <div className="ml-auto">
          <PinIconButton
            label="Delete weapon"
            onClick={onDelete}
            variant="danger"
          >
            <span className="font-mono leading-none">×</span>
          </PinIconButton>
        </div>
      </div>
    </th>
  )
}
