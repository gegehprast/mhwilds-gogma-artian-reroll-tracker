import type { Tracker } from "../lib/api-service"
import { BonusRollsTab } from "./BonusRollsTab"
import { SkillRollsTab } from "./SkillRollsTab"

interface Props {
  tracker: Tracker
  weaponId: string
  tab: "skills" | "bonuses"
}

export function WeaponPanel({ tracker, weaponId, tab }: Props) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {tab === "skills" ? (
        <SkillRollsTab tracker={tracker} weaponId={weaponId} />
      ) : (
        <BonusRollsTab tracker={tracker} weaponId={weaponId} />
      )}
    </div>
  )
}
