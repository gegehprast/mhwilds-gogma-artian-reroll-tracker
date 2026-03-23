import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getTrackerId } from "../lib/api-client"
import { trackerService } from "../lib/api-service"

export function useTracker() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ["tracker"],
    queryFn: () => trackerService.getOrCreate(getTrackerId()),
    staleTime: Number.POSITIVE_INFINITY,
  })

  const updateName = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      trackerService.updateName(id, name),
    onSuccess: (data) => qc.setQueryData(["tracker"], data),
  })

  const setSkillIndex = useMutation({
    mutationFn: ({ id, skillIndex }: { id: string; skillIndex: number }) =>
      trackerService.setSkillIndex(id, skillIndex),
    onSuccess: (data) => qc.setQueryData(["tracker"], data),
  })

  const setBonusIndex = useMutation({
    mutationFn: ({ id, bonusIndex }: { id: string; bonusIndex: number }) =>
      trackerService.setBonusIndex(id, bonusIndex),
    onSuccess: (data) => qc.setQueryData(["tracker"], data),
  })

  return { query, updateName, setSkillIndex, setBonusIndex }
}
