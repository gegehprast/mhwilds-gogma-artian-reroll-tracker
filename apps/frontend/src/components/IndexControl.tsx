import { useEffect, useState } from "react"
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

  useEffect(() => {
    setSkillInput(String(tracker.skillIndex))
  }, [tracker.skillIndex])

  useEffect(() => {
    setBonusInput(String(tracker.bonusIndex))
  }, [tracker.bonusIndex])

  function saveSkill() {
    const v = Number.parseInt(skillInput, 10)
    if (!Number.isNaN(v) && v >= 1 && v !== tracker.skillIndex) {
      setSkillIndex.mutate({ id: tracker.id, skillIndex: v })
    }
  }

  function saveBonus() {
    const v = Number.parseInt(bonusInput, 10)
    if (!Number.isNaN(v) && v >= 1 && v !== tracker.bonusIndex) {
      setBonusIndex.mutate({ id: tracker.id, bonusIndex: v })
    }
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
          onChange={(e) => setSkillInput(e.target.value)}
          onBlur={saveSkill}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveSkill()
          }}
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
        onChange={(e) => setBonusInput(e.target.value)}
        onBlur={saveBonus}
        onKeyDown={(e) => {
          if (e.key === "Enter") saveBonus()
        }}
      />
    </div>
  )
}
