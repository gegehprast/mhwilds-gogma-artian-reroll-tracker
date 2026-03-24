import type { BonusImportRow, SkillImportRow } from "../lib/import-rolls"

export function ImportPreviewContent({
  rows,
  fromIndex,
  rollType,
  onChangeFile,
}: {
  rows: SkillImportRow[] | BonusImportRow[]
  fromIndex: number
  rollType: "skill" | "bonus"
  onChangeFile: () => void
}) {
  return (
    <>
      {/* Summary */}
      <div className="bg-gray-800/50 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
        <span className="text-green-400 font-mono">✓</span>
        <span className="text-gray-200">
          Found <strong className="text-white">{rows.length}</strong> attempt
          {rows.length !== 1 ? "s" : ""} — will occupy index{" "}
          <strong className="text-white">{fromIndex}</strong>
          {rows.length > 1 && (
            <>
              {" – "}
              <strong className="text-white">
                {fromIndex + rows.length - 1}
              </strong>
            </>
          )}
        </span>
        <button
          type="button"
          onClick={onChangeFile}
          className="ml-auto text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Change file
        </button>
      </div>

      {/* Preview table */}
      <div className="rounded-lg border border-gray-700 overflow-hidden max-h-80 overflow-y-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0">
            <tr className="bg-gray-800 border-b border-gray-700">
              <th className="text-left px-3 py-2 text-gray-400 font-semibold w-16">
                Index
              </th>
              {rollType === "skill" ? (
                <>
                  <th className="text-left px-3 py-2 text-gray-400 font-semibold">
                    Set Skill
                  </th>
                  <th className="text-left px-3 py-2 text-gray-400 font-semibold">
                    Group Skill
                  </th>
                </>
              ) : (
                <>
                  <th className="text-left px-3 py-2 text-gray-400 font-semibold">
                    Bonus 1
                  </th>
                  <th className="text-left px-3 py-2 text-gray-400 font-semibold">
                    Bonus 2
                  </th>
                  <th className="text-left px-3 py-2 text-gray-400 font-semibold">
                    Bonus 3
                  </th>
                  <th className="text-left px-3 py-2 text-gray-400 font-semibold">
                    Bonus 4
                  </th>
                  <th className="text-left px-3 py-2 text-gray-400 font-semibold">
                    Bonus 5
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={`border-b border-gray-800/60 ${i % 2 === 0 ? "" : "bg-gray-800/20"}`}
              >
                <td className="px-3 py-1.5 font-mono text-gray-400">
                  {fromIndex + i}
                </td>
                {rollType === "skill" ? (
                  <>
                    <td className="px-3 py-1.5 text-gray-200">
                      {(row as SkillImportRow).setSkill}
                    </td>
                    <td className="px-3 py-1.5 text-gray-200">
                      {(row as SkillImportRow).groupSkill}
                    </td>
                  </>
                ) : (
                  (
                    ["bonus1", "bonus2", "bonus3", "bonus4", "bonus5"] as const
                  ).map((k) => (
                    <td key={k} className="px-3 py-1.5 text-gray-200">
                      {(row as BonusImportRow)[k]}
                    </td>
                  ))
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
