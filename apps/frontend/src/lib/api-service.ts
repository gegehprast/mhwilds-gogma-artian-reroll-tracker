import type { components } from "../generated/openapi"
import { apiClient, setTrackerId } from "./api-client"

// Domain type aliases
export type Tracker = components["schemas"]["Tracker"]
export type Weapon = components["schemas"]["Weapon"]
export type SkillRoll = components["schemas"]["SkillRoll"]
export type BonusRoll = components["schemas"]["BonusRoll"]
export type WeaponType = components["schemas"]["WeaponType"]
export type Element = components["schemas"]["Element"]

export const trackerService = {
  async getOrCreate(id?: string | null): Promise<Tracker> {
    if (id) {
      const { data, error } = await apiClient.GET("/api/trackers/{id}", {
        params: { path: { id } },
      })
      if (!data) throw new Error(String(error))
      return data
    }
    const { data, error } = await apiClient.POST("/api/trackers", { body: {} })
    if (!data) throw new Error(String(error))
    setTrackerId(data.id)
    return data
  },

  async updateName(id: string, name: string): Promise<Tracker> {
    const { data, error } = await apiClient.PATCH("/api/trackers/{id}", {
      params: { path: { id } },
      body: { name },
    })
    if (!data) throw new Error(String(error))
    return data
  },

  async setSkillIndex(id: string, skillIndex: number): Promise<Tracker> {
    const { data, error } = await apiClient.PATCH("/api/trackers/{id}", {
      params: { path: { id } },
      body: { skillIndex },
    })
    if (!data) throw new Error(String(error))
    return data
  },

  async setBonusIndex(id: string, bonusIndex: number): Promise<Tracker> {
    const { data, error } = await apiClient.PATCH("/api/trackers/{id}", {
      params: { path: { id } },
      body: { bonusIndex },
    })
    if (!data) throw new Error(String(error))
    return data
  },
}

export const weaponService = {
  async list(trackerId: string): Promise<Weapon[]> {
    const { data, error } = await apiClient.GET(
      "/api/trackers/{trackerId}/weapons",
      {
        params: { path: { trackerId } },
      },
    )
    if (!data) throw new Error(String(error))
    return data
  },

  async findOrCreate(
    trackerId: string,
    weaponType: WeaponType,
    element: Element,
  ): Promise<Weapon> {
    const { data, error } = await apiClient.POST(
      "/api/trackers/{trackerId}/weapons",
      {
        params: { path: { trackerId } },
        body: { weaponType, element },
      },
    )
    if (!data) throw new Error(String(error))
    return data
  },

  async delete(trackerId: string, id: string): Promise<void> {
    await apiClient.DELETE("/api/trackers/{trackerId}/weapons/{id}", {
      params: { path: { trackerId, id } },
    })
  },
}

export const skillRollService = {
  async list(trackerId: string, weaponId: string): Promise<SkillRoll[]> {
    const { data, error } = await apiClient.GET(
      "/api/trackers/{trackerId}/weapons/{weaponId}/skill-rolls",
      { params: { path: { trackerId, weaponId } } },
    )
    if (!data) throw new Error(String(error))
    return data
  },

  async create(
    trackerId: string,
    weaponId: string,
    groupSkill: string,
    seriesSkill: string,
  ): Promise<SkillRoll> {
    const { data, error } = await apiClient.POST(
      "/api/trackers/{trackerId}/weapons/{weaponId}/skill-rolls",
      {
        params: { path: { trackerId, weaponId } },
        body: { groupSkill, seriesSkill },
      },
    )
    if (!data) throw new Error(String(error))
    return data
  },

  async delete(trackerId: string, weaponId: string, id: string): Promise<void> {
    await apiClient.DELETE(
      "/api/trackers/{trackerId}/weapons/{weaponId}/skill-rolls/{id}",
      { params: { path: { trackerId, weaponId, id } } },
    )
  },

  async update(
    trackerId: string,
    weaponId: string,
    id: string,
    data: { groupSkill?: string; seriesSkill?: string },
  ): Promise<SkillRoll> {
    const { data: result, error } = await apiClient.PATCH(
      "/api/trackers/{trackerId}/weapons/{weaponId}/skill-rolls/{id}",
      { params: { path: { trackerId, weaponId, id } }, body: data },
    )
    if (!result) throw new Error(String(error))
    return result
  },

  async import(
    trackerId: string,
    weaponId: string,
    selectedIndex: number,
    rolls: Array<{
      attemptNum: number
      groupSkill: string
      seriesSkill: string
    }>,
  ): Promise<SkillRoll[]> {
    const { data, error } = await apiClient.POST(
      "/api/trackers/{trackerId}/weapons/{weaponId}/skill-rolls/import",
      {
        params: { path: { trackerId, weaponId } },
        body: { selectedIndex, rolls },
      },
    )
    if (!data) throw new Error(String(error))
    return data
  },
}

export const bonusRollService = {
  async list(trackerId: string, weaponId: string): Promise<BonusRoll[]> {
    const { data, error } = await apiClient.GET(
      "/api/trackers/{trackerId}/weapons/{weaponId}/bonus-rolls",
      { params: { path: { trackerId, weaponId } } },
    )
    if (!data) throw new Error(String(error))
    return data
  },

  async create(
    trackerId: string,
    weaponId: string,
    bonuses: {
      bonus1: string
      bonus2: string
      bonus3: string
      bonus4: string
      bonus5: string
    },
  ): Promise<BonusRoll> {
    const { data, error } = await apiClient.POST(
      "/api/trackers/{trackerId}/weapons/{weaponId}/bonus-rolls",
      { params: { path: { trackerId, weaponId } }, body: bonuses },
    )
    if (!data) throw new Error(String(error))
    return data
  },

  async delete(trackerId: string, weaponId: string, id: string): Promise<void> {
    await apiClient.DELETE(
      "/api/trackers/{trackerId}/weapons/{weaponId}/bonus-rolls/{id}",
      { params: { path: { trackerId, weaponId, id } } },
    )
  },

  async update(
    trackerId: string,
    weaponId: string,
    id: string,
    data: {
      bonus1?: string
      bonus2?: string
      bonus3?: string
      bonus4?: string
      bonus5?: string
    },
  ): Promise<BonusRoll> {
    const { data: result, error } = await apiClient.PATCH(
      "/api/trackers/{trackerId}/weapons/{weaponId}/bonus-rolls/{id}",
      { params: { path: { trackerId, weaponId, id } }, body: data },
    )
    if (!result) throw new Error(String(error))
    return result
  },

  async import(
    trackerId: string,
    weaponId: string,
    selectedIndex: number,
    rolls: Array<{
      attemptNum: number
      bonus1: string
      bonus2: string
      bonus3: string
      bonus4: string
      bonus5: string
    }>,
  ): Promise<BonusRoll[]> {
    const { data, error } = await apiClient.POST(
      "/api/trackers/{trackerId}/weapons/{weaponId}/bonus-rolls/import",
      {
        params: { path: { trackerId, weaponId } },
        body: { selectedIndex, rolls },
      },
    )
    if (!data) throw new Error(String(error))
    return data
  },
}
