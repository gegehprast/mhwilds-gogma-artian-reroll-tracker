import type { Weapon } from "../lib/api-service"

interface Props {
  weapon: Weapon
}

export function WeaponColumnHeader({ weapon }: Props) {
  return (
    <th className="sticky top-0 z-10 px-4 py-3 border-r border-gray-700 w-52 text-center bg-gray-900">
      <div className="font-semibold text-gray-100 text-sm">
        {weapon.weaponType}
      </div>
      <div className="text-xs text-red-400 font-normal mt-0.5">
        {weapon.element}
      </div>
    </th>
  )
}
