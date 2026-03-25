import { Target } from "lucide-react"
import { useCallback, useRef, useState } from "react"
import { useAllBonusRolls } from "../hooks/useAllBonusRolls"
import { useAllSkillRolls } from "../hooks/useAllSkillRolls"
import { useCloseOnEscape } from "../hooks/useCloseOnEscape"
import { useCloseOnOutsideClick } from "../hooks/useCloseOnOutsideClick"
import { useWeapons } from "../hooks/useWeapons"
import type { Tracker } from "../lib/api-service"

interface Props {
  tracker: Tracker
  activeTab: "skills-bird" | "bonuses-bird"
}

interface Recommendation {
  label: string
  index: number
  distance: number
}

export function NextRollBadge({ tracker, activeTab }: Props) {
  const { query: weaponsQuery } = useWeapons(tracker.id)
  const weapons = weaponsQuery.data ?? []
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])

  useCloseOnOutsideClick(containerRef, close, open)
  useCloseOnEscape(close, open)

  const isSkills = activeTab === "skills-bird"
  const currentIndex = isSkills
    ? (tracker.skillIndex ?? 1)
    : (tracker.bonusIndex ?? 1)

  // Pass empty weapons to the inactive tab so it doesn't fetch extra data.
  // The active tab's data is already cached by the view — same query keys.
  const { data: skillRolls } = useAllSkillRolls(
    tracker.id,
    isSkills ? weapons : [],
  )
  const { data: bonusRolls } = useAllBonusRolls(
    tracker.id,
    isSkills ? [] : weapons,
  )
  const rollsByWeapon = isSkills ? skillRolls : bonusRolls

  const recommendations: Recommendation[] = []
  for (const weapon of weapons) {
    const rolls = rollsByWeapon.get(weapon.id) ?? []
    const redRolls = rolls.filter(
      (r) =>
        r.index >= currentIndex && r.comments.some((c) => c.color === "red"),
    )
    if (redRolls.length === 0) continue
    const nearest = redRolls.reduce((a, b) => (a.index < b.index ? a : b))
    const label =
      weapon.element === "None"
        ? weapon.weaponType
        : `${weapon.weaponType} · ${weapon.element}`
    recommendations.push({
      label,
      index: nearest.index,
      distance: nearest.index - currentIndex,
    })
  }
  recommendations.sort((a, b) => a.distance - b.distance)

  const hasRecommendations = recommendations.length > 0
  const nearest = recommendations[0]
  const nearestDistance = nearest?.distance ?? 0
  const nearestGroup = recommendations.filter(
    (r) => r.distance === nearestDistance,
  )
  const extra = nearestGroup.length - 1

  // Full label for wider screens
  const fullLabel = hasRecommendations
    ? extra > 0
      ? `Suggested roll: ${nearest.label} (+${extra} more)`
      : `Suggested roll: ${nearest.label}`
    : "Suggested roll: Add red comment as target"

  // Short label for mobile
  const shortLabel = hasRecommendations
    ? extra > 0
      ? `${nearest.label} +${extra}`
      : nearest.label
    : null

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded transition-colors ${
          hasRecommendations
            ? "text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20"
            : "text-gray-500 bg-gray-800 hover:bg-gray-700"
        }`}
      >
        <Target size={11} className="shrink-0" />
        {/* Mobile: compact */}
        <span className="sm:hidden">
          {shortLabel ?? <span className="sr-only">No targets</span>}
        </span>
        {/* Desktop: full text */}
        <span className="hidden sm:inline">{fullLabel}</span>
      </button>
      {open && hasRecommendations && (
        <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1 z-50 bg-gray-900 border border-gray-700 rounded shadow-lg p-2 min-w-52 text-xs">
          <p className="text-gray-500 mb-1.5 font-medium">
            Nearest red-comment rolls:
          </p>
          {recommendations.slice(0, 6).map((r) => (
            <div
              key={`${r.label}-${r.index}`}
              className="flex items-center justify-between gap-4 py-0.5"
            >
              <span className="text-gray-200">{r.label}</span>
              <span className="text-gray-500 shrink-0 font-mono">
                #{r.index}
                {r.distance === 0 ? (
                  <span className="text-yellow-400 ml-1">← now</span>
                ) : (
                  <span className="text-gray-600 ml-1">(+{r.distance})</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
