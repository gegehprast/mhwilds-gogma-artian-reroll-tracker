import type { Weapon } from "../lib/api-service"
import { PinIconButton } from "./PinIconButton"

interface Props {
  weapon: Weapon
  canMoveLeft: boolean
  canMoveRight: boolean
  onMoveLeft: () => void
  onMoveRight: () => void
  onDelete: () => void
}

export function WeaponColumnHeader({
  weapon,
  canMoveLeft,
  canMoveRight,
  onMoveLeft,
  onMoveRight,
  onDelete,
}: Props) {
  return (
    <th className="sticky top-0 z-10 px-4 py-3 border-r border-gray-700 w-52 text-center bg-gray-900">
      <div className="font-semibold text-gray-100 text-sm">
        {weapon.weaponType}
      </div>
      <div className="text-xs text-red-400 font-normal mt-0.5">
        {weapon.element}
      </div>
      <div className="flex items-center justify-center gap-2 mt-1.5">
        <PinIconButton
          label="Move left"
          onClick={onMoveLeft}
          disabled={!canMoveLeft}
        >
          <span className="font-mono leading-none text-xs">←</span>
        </PinIconButton>
        <PinIconButton
          label="Delete weapon"
          onClick={onDelete}
          variant="danger"
        >
          <span className="font-mono leading-none text-xs">×</span>
        </PinIconButton>
        <PinIconButton
          label="Move right"
          onClick={onMoveRight}
          disabled={!canMoveRight}
        >
          <span className="font-mono leading-none text-xs">→</span>
        </PinIconButton>
      </div>
    </th>
  )
}
