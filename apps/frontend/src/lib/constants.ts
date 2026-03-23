import type { components } from "../generated/openapi"

// Types are derived from the backend's OpenAPI schema — kept in sync automatically.
export type WeaponType = components["schemas"]["WeaponType"]
export type Element = components["schemas"]["Element"]

export const WEAPON_TYPES: WeaponType[] = [
  "Great Sword",
  "Sword & Shield",
  "Dual Blades",
  "Long Sword",
  "Hammer",
  "Hunting Horn",
  "Lance",
  "Gunlance",
  "Switch Axe",
  "Charge Blade",
  "Insect Glaive",
  "Light Bowgun",
  "Heavy Bowgun",
  "Bow",
]

export const ELEMENTS: Element[] = [
  "None",
  "Fire",
  "Water",
  "Thunder",
  "Ice",
  "Dragon",
  "Poison",
  "Paralysis",
  "Sleep",
  "Blast",
]
