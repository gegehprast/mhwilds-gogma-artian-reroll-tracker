import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  type Element,
  type WeaponType,
  weaponService,
} from "../lib/api-service"

export function useWeapons(trackerId: string | undefined) {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ["weapons", trackerId],
    queryFn: () => {
      if (!trackerId) throw new Error("trackerId required")
      return weaponService.list(trackerId)
    },
    enabled: !!trackerId,
  })

  const findOrCreate = useMutation({
    mutationFn: ({
      weaponType,
      element,
    }: {
      weaponType: WeaponType
      element: Element
    }) => {
      if (!trackerId) throw new Error("trackerId required")
      return weaponService.findOrCreate(trackerId, weaponType, element)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["weapons", trackerId] }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => {
      if (!trackerId) throw new Error("trackerId required")
      return weaponService.delete(trackerId, id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["weapons", trackerId] }),
  })

  return { query, findOrCreate, remove }
}
