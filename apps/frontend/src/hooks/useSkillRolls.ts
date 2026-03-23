import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { skillRollService } from "../lib/api-service"

export function useSkillRolls(
  trackerId: string | undefined,
  weaponId: string | undefined,
) {
  const qc = useQueryClient()
  const key = ["skill-rolls", trackerId, weaponId]

  const query = useQuery({
    queryKey: key,
    queryFn: () => {
      if (!trackerId || !weaponId)
        throw new Error("trackerId and weaponId required")
      return skillRollService.list(trackerId, weaponId)
    },
    enabled: !!trackerId && !!weaponId,
  })

  const create = useMutation({
    mutationFn: ({
      groupSkill,
      seriesSkill,
    }: {
      groupSkill: string
      seriesSkill: string
    }) => {
      if (!trackerId || !weaponId)
        throw new Error("trackerId and weaponId required")
      return skillRollService.create(
        trackerId,
        weaponId,
        groupSkill,
        seriesSkill,
      )
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
      return skillRollService.delete(trackerId, weaponId, id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const update = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: { groupSkill?: string; seriesSkill?: string }
    }) => {
      if (!trackerId || !weaponId)
        throw new Error("trackerId and weaponId required")
      return skillRollService.update(trackerId, weaponId, id, data)
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
        groupSkill: string
        seriesSkill: string
      }>
    }) => {
      if (!trackerId || !weaponId)
        throw new Error("trackerId and weaponId required")
      return skillRollService.import(trackerId, weaponId, selectedIndex, rolls)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { query, create, remove, update, importRolls }
}
