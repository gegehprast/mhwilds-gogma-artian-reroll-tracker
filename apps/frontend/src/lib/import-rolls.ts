import type { Element, WeaponType } from "./constants"

interface RawAttempt {
  attemptNum: number
  skills?: { group: string; series: string }
  bonuses?: string[]
  timestamp?: string
}

interface RawWeapon {
  weaponTypeName: string // third-party name, matched via normalization
  attribute: string // matches Element string (e.g. "Blast")
  attempts?: RawAttempt[]
}

interface RawImportFile {
  weapons?: RawWeapon[]
}

export interface SkillImportRow {
  seriesSkill: string
  groupSkill: string
}

export interface BonusImportRow {
  bonus1: string
  bonus2: string
  bonus3: string
  bonus4: string
  bonus5: string
}

export type ImportParseOk<T> = { ok: true; rows: T[] }
export type ImportParseErr = { ok: false; error: string }

/**
 * Normalizes a weapon type name for best-effort matching across third-party
 * naming conventions. Lowercases, replaces `&` with `and`, then strips all
 * non-alphanumeric characters so variants like "GreatSword", "great_sword",
 * and "Great Sword" all resolve to the same key.
 */
function normalizeWeaponName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "")
}

export function parseImportJson(
  raw: unknown,
  weaponType: WeaponType,
  element: Element,
  rollType: "skill",
): ImportParseOk<SkillImportRow> | ImportParseErr

export function parseImportJson(
  raw: unknown,
  weaponType: WeaponType,
  element: Element,
  rollType: "bonus",
): ImportParseOk<BonusImportRow> | ImportParseErr

export function parseImportJson(
  raw: unknown,
  weaponType: WeaponType,
  element: Element,
  rollType: "skill" | "bonus",
):
  | ImportParseOk<SkillImportRow>
  | ImportParseOk<BonusImportRow>
  | ImportParseErr {
  if (typeof raw !== "object" || raw === null || !("weapons" in raw)) {
    return { ok: false, error: "Invalid JSON: missing 'weapons' array" }
  }

  const file = raw as RawImportFile
  if (!Array.isArray(file.weapons)) {
    return { ok: false, error: "Invalid JSON: 'weapons' must be an array" }
  }

  const matching = file.weapons.filter(
    (w) =>
      typeof w.weaponTypeName === "string" &&
      normalizeWeaponName(w.weaponTypeName) ===
        normalizeWeaponName(weaponType) &&
      w.attribute === element,
  )

  if (matching.length === 0) {
    return {
      ok: false,
      error: `No ${weaponType} / ${element} entries found in this file`,
    }
  }

  type AttemptWithSkills = RawAttempt & {
    skills: { group: string; series: string }
  }
  type AttemptWithBonuses = RawAttempt & { bonuses: string[] }

  function hasSkills(a: RawAttempt): a is AttemptWithSkills {
    return a.skills != null && typeof a.skills === "object"
  }

  function hasBonuses(a: RawAttempt): a is AttemptWithBonuses {
    return Array.isArray(a.bonuses)
  }

  const allAttempts = matching
    .flatMap((w) => w.attempts ?? [])
    .sort((a, b) => a.attemptNum - b.attemptNum)

  if (rollType === "skill") {
    const rows: SkillImportRow[] = allAttempts.filter(hasSkills).map((a) => ({
      seriesSkill: a.skills.series,
      groupSkill: a.skills.group,
    }))
    if (rows.length === 0) {
      return { ok: false, error: "No skill attempts found for this weapon" }
    }
    return { ok: true, rows }
  }

  const rows: BonusImportRow[] = allAttempts.filter(hasBonuses).map((a) => ({
    bonus1: a.bonuses[0] ?? "",
    bonus2: a.bonuses[1] ?? "",
    bonus3: a.bonuses[2] ?? "",
    bonus4: a.bonuses[3] ?? "",
    bonus5: a.bonuses[4] ?? "",
  }))
  if (rows.length === 0) {
    return { ok: false, error: "No bonus attempts found for this weapon" }
  }
  return { ok: true, rows }
}
