import { GROUP_SKILLS, SET_SKILLS } from "../lib/constants"

interface Props {
  filterSetSkill: string
  filterGroupSkill: string
  filledOnly: boolean
  matchCount: number
  isFiltered: boolean
  onSetSkillChange: (value: string) => void
  onGroupSkillChange: (value: string) => void
  onFilledOnlyChange: (value: boolean) => void
  onClear: () => void
}

export function SkillFilterBar({
  filterSetSkill,
  filterGroupSkill,
  filledOnly,
  matchCount,
  isFiltered,
  onSetSkillChange,
  onGroupSkillChange,
  onFilledOnlyChange,
  onClear,
}: Props) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-800 bg-gray-900/50 shrink-0 flex-wrap">
      <span className="text-xs text-gray-500 font-medium">Filter:</span>
      <select
        value={filterSetSkill}
        onChange={(e) => onSetSkillChange(e.target.value)}
        className="w-30 text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-300 focus:outline-none focus:border-gray-500"
      >
        <option value="">Any set skill</option>
        {SET_SKILLS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <select
        value={filterGroupSkill}
        onChange={(e) => onGroupSkillChange(e.target.value)}
        className="w-30 text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-300 focus:outline-none focus:border-gray-500"
      >
        <option value="">Any group skill</option>
        {GROUP_SKILLS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={filledOnly}
          onChange={(e) => onFilledOnlyChange(e.target.checked)}
          className="accent-red-500"
        />
        Filled rows only
      </label>
      {isFiltered && (
        <>
          <span className="text-xs text-gray-600">
            {matchCount} row{matchCount !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Clear
          </button>
        </>
      )}
    </div>
  )
}
