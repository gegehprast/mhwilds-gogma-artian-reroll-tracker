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

export const SERIES_SKILLS = [
  "Doshaguma's Might",
  "Rey Dau's Voltage",
  "Uth Duna's Cover",
  "Nu Udra's Mutiny",
  "Rathalos's Flare",
  "Ebony Odogaron's Power",
  "Guardian Arkveld's Vitality",
  "Jin Dahaad's Revolt",
  "Gravios's Protection",
  "Blangonga's Spirit",
  "Gore Magala's Tyranny",
  "Arkveld's Hunger",
  "Xu Wu's Vigor",
  "Fulgur Anjanath's Will",
  "Mizutsune's Prowess",
  "Zoh Shia's Pulse",
  "Seregios's Tenacity",
  "Leviathan's Fury",
  "Soul of the Dark Knight",
  "Omega Resonance",
  "Gogmapocalypse",
] as const

export const GROUP_SKILLS = [
  "Scaling Prowess",
  "Fortifying Pelt",
  "Flexible Leathercraft",
  "Neopteron Alert",
  "Lord's Favor",
  "Guardian's Pulse",
  "Neopteron Camouflage",
  "Buttery Leathercraft",
  "Scale Layering",
  "Alluring Pelt",
  "Lord's Fury",
  "Guardian's Protection",
  "Imparted Wisdom",
  "Glory's Favor",
  "Festival Spirit",
  "Lord's Soul",
  "Master of the Fist",
] as const

export const BONUSES = [
  "Attack Boost I",
  "Attack Boost II",
  "Attack Boost III",
  "Attack Boost EX",
  "Affinity Boost I",
  "Affinity Boost II",
  "Affinity Boost III",
  "Affinity Boost EX",
  "Element Boost I",
  "Element Boost II",
  "Element Boost EX",
  "Sharpness Boost",
  "Sharpness/Ammo Boost EX",
]
