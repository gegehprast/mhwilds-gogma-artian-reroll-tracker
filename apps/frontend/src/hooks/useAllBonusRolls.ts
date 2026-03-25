import { useQueries } from "@tanstack/react-query"
import {
  type BonusRollWithComments,
  bonusRollService,
  type Weapon,
} from "../lib/api-service"

export function useAllBonusRolls(
  trackerId: string | undefined,
  weapons: Weapon[],
) {
  const results = useQueries({
    queries: weapons.map((w) => ({
      queryKey: ["bonus-rolls", trackerId, w.id],
      queryFn: () => {
        if (!trackerId) throw new Error("trackerId required")
        return bonusRollService.list(trackerId, w.id)
      },
      enabled: !!trackerId,
    })),
  })

  const isLoading = results.some((r) => r.isLoading)

  const data = new Map<string, BonusRollWithComments[]>()
  for (let i = 0; i < weapons.length; i++) {
    const weapon = weapons[i]
    const result = results[i]
    if (weapon && result?.data) {
      data.set(weapon.id, result.data)
    }
  }

  return { data, isLoading }
}
