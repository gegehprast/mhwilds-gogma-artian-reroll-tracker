import { useState } from "react"
import { useWeapons } from "../hooks/useWeapons"
import type { Element, WeaponType } from "../lib/constants"
import { ELEMENTS, WEAPON_TYPES } from "../lib/constants"

interface Props {
  trackerId: string
}

export function AddWeaponButton({ trackerId }: Props) {
  const { findOrCreate } = useWeapons(trackerId)
  const [open, setOpen] = useState(false)
  const [weaponType, setWeaponType] = useState<WeaponType>(WEAPON_TYPES[0])
  const [element, setElement] = useState<Element>(ELEMENTS[0])

  return (
    <div className="relative ml-auto flex items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black rounded px-3 py-1.5 leading-none"
      >
        + Add weapon
      </button>
      {open && (
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
                findOrCreate.mutate(
                  { weaponType, element },
                  { onSuccess: () => setOpen(false) },
                )
              }
              disabled={findOrCreate.isPending}
              className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-xs font-semibold rounded py-1.5"
            >
              {findOrCreate.isPending ? "…" : "Add"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-gray-200 text-xs rounded py-1.5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
