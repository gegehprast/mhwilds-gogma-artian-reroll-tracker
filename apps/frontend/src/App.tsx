import { useState } from "react"
import { BonusRollsBirdView } from "./components/BonusRollsBirdView"
import { SkillRollsBirdView } from "./components/SkillRollsBirdView"
import { TrackerHeader } from "./components/TrackerHeader"
import { TrackerSetup } from "./components/TrackerSetup"
import { WeaponPanel } from "./components/WeaponPanel"
import { WeaponSelector } from "./components/WeaponSelector"
import { useTracker } from "./hooks/useTracker"
import { useWeapons } from "./hooks/useWeapons"
import { getTrackerId } from "./lib/api-client"
import type { Element, WeaponType } from "./lib/constants"
import { ELEMENTS, WEAPON_TYPES } from "./lib/constants"

export default function App() {
  const [initialized, setInitialized] = useState(() => !!getTrackerId())
  if (!initialized) return <TrackerSetup onReady={() => setInitialized(true)} />
  return <MainApp />
}

function AddWeaponButton({ trackerId }: { trackerId: string }) {
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

function MainApp() {
  const { query } = useTracker()
  const [selectedWeaponId, setSelectedWeaponId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<
    "skills" | "bonuses" | "skills-bird" | "bonuses-bird"
  >("skills-bird")

  const tracker = query.data

  const isBirdView = activeTab === "skills-bird" || activeTab === "bonuses-bird"

  function handleSwitchTracker() {
    localStorage.removeItem("tracker_id")
    window.location.reload()
  }

  if (query.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-400" />
      </div>
    )
  }

  if (query.isError || !tracker) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 gap-4">
        <p className="text-red-400 text-lg">Failed to load tracker.</p>
        <button
          type="button"
          className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded"
          onClick={handleSwitchTracker}
        >
          Start Over
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-gray-100">
      <TrackerHeader tracker={tracker} onSwitchTracker={handleSwitchTracker} />

      {/* Roll type tabs */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 flex gap-4">
        {(
          [
            ["skills-bird", "Skills ↔"],
            ["bonuses-bird", "Bonuses ↔"],
          ] as const
        ).map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {label}
          </button>
        ))}

        {/* add weapon button — shown in bird views */}
        {isBirdView && <AddWeaponButton trackerId={tracker.id} />}
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Weapon list sidebar — hidden in bird view */}
        {!isBirdView && (
          <WeaponSelector
            trackerId={tracker.id}
            selectedWeaponId={selectedWeaponId}
            onSelect={setSelectedWeaponId}
          />
        )}

        {/* Content area */}
        {activeTab === "skills-bird" ? (
          <SkillRollsBirdView tracker={tracker} />
        ) : activeTab === "bonuses-bird" ? (
          <BonusRollsBirdView tracker={tracker} />
        ) : selectedWeaponId ? (
          <WeaponPanel
            tracker={tracker}
            weaponId={selectedWeaponId}
            tab={activeTab}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-600">
            Select or create a weapon on the left to start tracking.
          </div>
        )}
      </div>
    </div>
  )
}
