import { useState } from "react"
import { useWeapons } from "../hooks/useWeapons"
import type { Weapon } from "../lib/api-service"
import {
  ELEMENTS,
  type Element,
  WEAPON_TYPES,
  type WeaponType,
} from "../lib/constants"

interface Props {
  trackerId: string | undefined
  selectedWeaponId: string | null
  onSelect: (id: string) => void
}

export function WeaponSelector({
  trackerId,
  selectedWeaponId,
  onSelect,
}: Props) {
  const { query, findOrCreate, remove } = useWeapons(trackerId)
  const [weaponType, setWeaponType] = useState<WeaponType>(WEAPON_TYPES[0])
  const [element, setElement] = useState<Element>(ELEMENTS[0])
  const [adding, setAdding] = useState(false)

  function handleAdd() {
    if (!trackerId) return
    findOrCreate.mutate(
      { weaponType, element },
      {
        onSuccess: (weapon) => {
          onSelect(weapon.id)
          setAdding(false)
        },
      },
    )
  }

  const weapons: Weapon[] = query.data ?? []

  return (
    <div className="w-60 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Weapons
        </span>
        <button
          type="button"
          onClick={() => setAdding(!adding)}
          className="text-red-400 hover:text-red-300 text-lg leading-none"
          title="Add weapon"
        >
          +
        </button>
      </div>

      {adding && (
        <div className="p-3 border-b border-gray-700 bg-gray-850 flex flex-col gap-2">
          <select
            className="bg-gray-800 text-gray-100 text-sm rounded px-2 py-1 border border-gray-600"
            value={weaponType}
            onChange={(e) => setWeaponType(e.target.value as WeaponType)}
          >
            {WEAPON_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select
            className="bg-gray-800 text-gray-100 text-sm rounded px-2 py-1 border border-gray-600"
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
              onClick={handleAdd}
              disabled={findOrCreate.isPending}
              className="flex-1 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-black text-sm font-semibold rounded py-1"
            >
              {findOrCreate.isPending ? "…" : "Add"}
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded py-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {weapons.length === 0 && (
          <p className="text-xs text-gray-600 p-4 text-center">
            No weapons yet
          </p>
        )}
        {weapons.map((w) => (
          <div
            key={w.id}
            className={`group flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${
              w.id === selectedWeaponId
                ? "bg-red-900/30 text-red-300"
                : "hover:bg-gray-800 text-gray-300"
            }`}
            onClick={() => onSelect(w.id)}
            onKeyDown={(e) => e.key === "Enter" && onSelect(w.id)}
            role="button"
            tabIndex={0}
          >
            <div className="text-xs leading-tight">
              <div className="font-medium">{w.weaponType}</div>
              <div className="text-gray-500">{w.element}</div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                remove.mutate(w.id, {
                  onSuccess: () => {
                    if (selectedWeaponId === w.id) onSelect("")
                  },
                })
              }}
              className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 text-xs px-1"
              title="Delete weapon"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
