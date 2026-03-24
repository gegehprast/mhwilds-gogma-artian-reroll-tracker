import { useState } from "react"
import { AddWeaponButton } from "./components/AddWeaponButton"
import { BonusRollsView } from "./components/BonusRollsView"
import { IndexControl } from "./components/IndexControl"
import { SkillRollsView } from "./components/SkillRollsView"
import { TrackerHeader } from "./components/TrackerHeader"
import { TrackerSetup } from "./components/TrackerSetup"
import { WeaponSelector } from "./components/WeaponSelector"
import { useTracker } from "./hooks/useTracker"
import { getTrackerId } from "./lib/api-client"

export default function App() {
  const [initialized, setInitialized] = useState(() => !!getTrackerId())
  if (!initialized) return <TrackerSetup onReady={() => setInitialized(true)} />
  return <MainApp />
}

function MainApp() {
  const { query } = useTracker()
  const [selectedWeaponId, setSelectedWeaponId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"skills-bird" | "bonuses-bird">(
    "skills-bird",
  )

  const tracker = query.data

  const isBirdView = activeTab === "skills-bird" || activeTab === "bonuses-bird"

  function handleSwitchTracker() {
    localStorage.removeItem("tracker_id")
    window.location.reload()
  }

  if (query.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-400" />
      </div>
    )
  }

  if (query.isError || !tracker) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 gap-4">
        <p className="text-red-400 text-lg">Failed to load tracker.</p>
        <button
          type="button"
          className="bg-red-500 hover:bg-red-400 text-black font-semibold px-4 py-2 rounded"
          onClick={handleSwitchTracker}
        >
          Start Over
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100">
      <TrackerHeader tracker={tracker} onSwitchTracker={handleSwitchTracker} />

      {/* Roll type tabs */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 flex items-center gap-1">
        <div className="flex gap-1">
          {(
            [
              ["skills-bird", "Skills"],
              ["bonuses-bird", "Bonuses"],
            ] as const
          ).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-red-400 text-red-400"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Index input + add weapon — shown in bird views */}
        {isBirdView && (
          <div className="flex items-center gap-2 ml-auto">
            <IndexControl tracker={tracker} activeTab={activeTab} />
            <AddWeaponButton trackerId={tracker.id} />
          </div>
        )}
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
        {activeTab === "skills-bird" && <SkillRollsView tracker={tracker} />}

        {activeTab === "bonuses-bird" && <BonusRollsView tracker={tracker} />}
      </div>
    </div>
  )
}
