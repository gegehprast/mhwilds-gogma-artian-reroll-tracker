import { useState } from "react"

type ImportType = "skills" | "bonuses"

type SkillRow = { attemptNum: number; groupSkill: string; seriesSkill: string }
type BonusRow = {
  attemptNum: number
  bonus1: string
  bonus2: string
  bonus3: string
  bonus4: string
  bonus5: string
}

interface Props {
  type: ImportType
  selectedIndex: number
  onClose: () => void
  onImport: (selectedIndex: number, rows: SkillRow[] | BonusRow[]) => void
}

function parseJson(
  raw: string,
  type: ImportType,
): SkillRow[] | BonusRow[] | string {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return "Invalid JSON"
  }
  if (!Array.isArray(parsed)) return "Expected a JSON array"

  if (type === "skills") {
    const rows: SkillRow[] = []
    for (const item of parsed) {
      if (
        typeof item !== "object" ||
        item === null ||
        typeof (item as Record<string, unknown>).attemptNum !== "number" ||
        typeof (item as Record<string, unknown>).groupSkill !== "string" ||
        typeof (item as Record<string, unknown>).seriesSkill !== "string"
      ) {
        return 'Each item must have { "attemptNum": number, "groupSkill": string, "seriesSkill": string }'
      }
      rows.push(item as SkillRow)
    }
    return rows
  }

  const rows: BonusRow[] = []
  for (const item of parsed) {
    const r = item as Record<string, unknown>
    if (
      typeof item !== "object" ||
      item === null ||
      typeof r.attemptNum !== "number" ||
      typeof r.bonus1 !== "string" ||
      typeof r.bonus2 !== "string" ||
      typeof r.bonus3 !== "string" ||
      typeof r.bonus4 !== "string" ||
      typeof r.bonus5 !== "string"
    ) {
      return 'Each item must have { "attemptNum": number, "bonus1"–"bonus5": string }'
    }
    rows.push(item as BonusRow)
  }
  return rows
}

export function ImportModal({ type, selectedIndex, onClose, onImport }: Props) {
  const [raw, setRaw] = useState("")
  const [idx, setIdx] = useState(selectedIndex)
  const [error, setError] = useState<string | null>(null)

  function handleImport() {
    const result = parseJson(raw, type)
    if (typeof result === "string") {
      setError(result)
      return
    }
    setError(null)
    onImport(idx, result)
  }

  const placeholder =
    type === "skills"
      ? `[\n  { "attemptNum": 1, "groupSkill": "Blaze", "seriesSkill": "Kaiser" },\n  ...\n]`
      : `[\n  { "attemptNum": 1, "bonus1": "Atk+15", "bonus2": "Def+5", "bonus3": "...", "bonus4": "...", "bonus5": "..." },\n  ...\n]`

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-lg flex flex-col gap-4 p-5">
        <h2 className="text-white font-semibold text-lg">
          Import {type === "skills" ? "Skill" : "Bonus"} Rolls
        </h2>

        <div className="flex flex-col gap-1">
          <label htmlFor="indexInput" className="text-xs text-gray-400">
            Insert after index (selectedIndex):
          </label>
          <input
            id="indexInput"
            type="number"
            min={0}
            className="bg-gray-800 text-gray-100 text-sm rounded px-2 py-1.5 border border-gray-600 w-32"
            value={idx}
            onChange={(e) => setIdx(Number(e.target.value))}
          />
          <p className="text-xs text-gray-500">
            New rolls will be inserted starting at index {idx + 1}. Existing
            rolls in that range will be replaced.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="jsonInput" className="text-xs text-gray-400">
            Paste JSON array:
          </label>
          <textarea
            id="jsonInput"
            rows={8}
            className="bg-gray-800 text-gray-100 text-xs font-mono rounded px-2 py-1.5 border border-gray-600 resize-y"
            placeholder={placeholder}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            className="bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-4 py-2 rounded"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  )
}
