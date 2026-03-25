export const WEAPON_TYPES = [
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
] as const

export const ELEMENTS = [
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
] as const

export type WeaponType = (typeof WEAPON_TYPES)[number]
export type Element = (typeof ELEMENTS)[number]

export const MAX_ROLL_INDEX = 1000
