import { useQueries } from "@tanstack/react-query"
import {
  type SkillRollWithComments,
  skillRollService,
  type Weapon,
} from "../lib/api-service"

export function useAllSkillRolls(
  trackerId: string | undefined,
  weapons: Weapon[],
) {
  const results = useQueries({
    queries: weapons.map((w) => ({
      queryKey: ["skill-rolls", trackerId, w.id],
      queryFn: () => {
        if (!trackerId) throw new Error("trackerId required")
        return skillRollService.list(trackerId, w.id)
      },
      enabled: !!trackerId,
    })),
  })

  const isLoading = results.some((r) => r.isLoading)

  const data = new Map<string, SkillRollWithComments[]>()
  for (let i = 0; i < weapons.length; i++) {
    const weapon = weapons[i]
    const result = results[i]
    if (weapon && result?.data) {
      data.set(weapon.id, result.data)
    }
  }

  return { data, isLoading }
}
