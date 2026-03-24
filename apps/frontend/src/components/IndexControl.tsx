import { useEffect, useState } from "react"
import { useDebounce } from "../hooks/useDebounce"
import { useTracker } from "../hooks/useTracker"
import type { Tracker } from "../lib/api-service"

interface Props {
  tracker: Tracker
  activeTab: "skills-bird" | "bonuses-bird"
}

export function IndexControl({ tracker, activeTab }: Props) {
  const { setSkillIndex, setBonusIndex } = useTracker()
  const [skillInput, setSkillInput] = useState(String(tracker.skillIndex))
  const [bonusInput, setBonusInput] = useState(String(tracker.bonusIndex))

  const saveSkillDebounced = useDebounce((raw: string) => {
    const v = Number.parseInt(raw, 10)
    if (!Number.isNaN(v) && v >= 1 && v !== tracker.skillIndex) {
      setSkillIndex.mutate({ id: tracker.id, skillIndex: v })
    }
  }, 200)

  const saveBonusDebounced = useDebounce((raw: string) => {
    const v = Number.parseInt(raw, 10)
    if (!Number.isNaN(v) && v >= 1 && v !== tracker.bonusIndex) {
      setBonusIndex.mutate({ id: tracker.id, bonusIndex: v })
    }
  }, 200)

  useEffect(() => {
    setSkillInput(String(tracker.skillIndex))
  }, [tracker.skillIndex])

  useEffect(() => {
    setBonusInput(String(tracker.bonusIndex))
  }, [tracker.bonusIndex])

  function handleSkillChange(raw: string) {
    setSkillInput(raw)
    saveSkillDebounced(raw)
  }

  function handleBonusChange(raw: string) {
    setBonusInput(raw)
    saveBonusDebounced(raw)
  }

  if (activeTab === "skills-bird") {
    return (
      <div className="flex items-center bg-gray-800 border border-gray-700 rounded px-2 py-0.5">
        <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide leading-none mb-0.5">
          Skill IDX
        </span>
        <input
          type="number"
          min={1}
          className="bg-transparent text-red-300 font-mono text-sm w-12 text-center border-b border-red-500 outline-none"
          value={skillInput}
          onChange={(e) => handleSkillChange(e.target.value)}
        />
      </div>
    )
  }

  return (
    <div className="flex items-center bg-gray-800 border border-gray-700 rounded px-2 py-0.5">
      <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide leading-none mb-0.5">
        Bonus IDX
      </span>
      <input
        type="number"
        min={1}
        className="bg-transparent text-red-300 font-mono text-sm w-12 text-center border-b border-red-500 outline-none"
        value={bonusInput}
        onChange={(e) => handleBonusChange(e.target.value)}
      />
    </div>
  )
}
