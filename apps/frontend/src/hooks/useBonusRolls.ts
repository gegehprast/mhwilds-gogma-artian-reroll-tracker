import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { bonusRollService } from "../lib/api-service"

export function useBonusRolls(
  trackerId: string | undefined,
  weaponId: string | undefined,
) {
  const qc = useQueryClient()
  const key = ["bonus-rolls", trackerId, weaponId]

  const query = useQuery({
    queryKey: key,
    queryFn: () => {
      if (!trackerId || !weaponId)
        throw new Error("trackerId and weaponId required")
      return bonusRollService.list(trackerId, weaponId)
    },
    enabled: !!trackerId && !!weaponId,
  })

  const create = useMutation({
    mutationFn: (bonuses: {
      bonus1: string
      bonus2: string
      bonus3: string
      bonus4: string
      bonus5: string
    }) => {
      if (!trackerId || !weaponId)
        throw new Error("trackerId and weaponId required")
      return bonusRollService.create(trackerId, weaponId, bonuses)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key })
      qc.invalidateQueries({ queryKey: ["tracker"] })
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => {
      if (!trackerId || !weaponId)
        throw new Error("trackerId and weaponId required")
      return bonusRollService.delete(trackerId, weaponId, id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const update = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: {
        bonus1?: string
        bonus2?: string
        bonus3?: string
        bonus4?: string
        bonus5?: string
      }
    }) => {
      if (!trackerId || !weaponId)
        throw new Error("trackerId and weaponId required")
      return bonusRollService.update(trackerId, weaponId, id, data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const importRolls = useMutation({
    mutationFn: ({
      selectedIndex,
      rolls,
    }: {
      selectedIndex: number
      rolls: Array<{
        attemptNum: number
        bonus1: string
        bonus2: string
        bonus3: string
        bonus4: string
        bonus5: string
      }>
    }) => {
      if (!trackerId || !weaponId)
        throw new Error("trackerId and weaponId required")
      return bonusRollService.import(trackerId, weaponId, selectedIndex, rolls)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { query, create, remove, update, importRolls }
}
