import { useState } from "react"
import { AddWeaponButton } from "./components/AddWeaponButton"
import { IndexControl } from "./components/IndexControl"
import { NextRollBadge } from "./components/NextRollBadge"
import { TrackerHeader } from "./components/TrackerHeader"
import { TrackerSetup } from "./components/TrackerSetup"
import { useTracker } from "./hooks/useTracker"
import { getTrackerId } from "./lib/api-client"
import { BonusRollsView } from "./pages/BonusRollsView"
import { SkillRollsView } from "./pages/SkillRollsView"

export default function App() {
  const [initialized, setInitialized] = useState(() => !!getTrackerId())
  if (!initialized) return <TrackerSetup onReady={() => setInitialized(true)} />
  return <MainApp />
}

function MainApp() {
  const { query } = useTracker()
  const [activeTab, setActiveTab] = useState<"skills-bird" | "bonuses-bird">(
    "skills-bird",
  )

  const tracker = query.data

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

      {/* Roll type tabs + controls */}
      <div className="bg-gray-900 border-b border-gray-800 flex flex-col">
        {/* Tabs row — always visible */}
        <div className="px-4 flex items-center gap-1">
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

          {/* Index input + add weapon — hidden on mobile, shown on sm+ */}
          <div className="hidden sm:flex items-center gap-2 ml-auto">
            <NextRollBadge tracker={tracker} activeTab={activeTab} />
            <IndexControl tracker={tracker} activeTab={activeTab} />
            <AddWeaponButton trackerId={tracker.id} />
          </div>
        </div>

        {/* Controls row — mobile only */}
        <div className="sm:hidden flex items-center gap-2 px-4 pb-2 mt-4">
          <NextRollBadge tracker={tracker} activeTab={activeTab} />
          <div className="ml-auto flex items-center gap-2">
            <IndexControl tracker={tracker} activeTab={activeTab} />
            <AddWeaponButton trackerId={tracker.id} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {activeTab === "skills-bird" && <SkillRollsView tracker={tracker} />}

        {activeTab === "bonuses-bird" && <BonusRollsView tracker={tracker} />}
      </div>
    </div>
  )
}
