import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useState } from "react"
import { createPortal } from "react-dom"
import type { Weapon } from "../lib/api-service"
import { bonusRollService, skillRollService } from "../lib/api-service"
import type { BonusImportRow, SkillImportRow } from "../lib/import-rolls"
import { parseImportJson } from "../lib/import-rolls"

interface Props {
  weapon: Weapon
  rollType: "skill" | "bonus"
  fromIndex: number
  trackerId: string
  onClose: () => void
}

type ParsedSkill = { type: "skill"; rows: SkillImportRow[] }
type ParsedBonus = { type: "bonus"; rows: BonusImportRow[] }
type Parsed = ParsedSkill | ParsedBonus

export function ImportPreviewModal({
  weapon,
  rollType,
  fromIndex,
  trackerId,
  onClose,
}: Props) {
  const qc = useQueryClient()
  const [parseError, setParseError] = useState<string | null>(null)
  const [parsed, setParsed] = useState<Parsed | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const processFile = useCallback(
    (file: File) => {
      setParseError(null)
      setParsed(null)
      file.text().then((text) => {
        let json: unknown
        try {
          json = JSON.parse(text)
        } catch {
          setParseError("File is not valid JSON.")
          return
        }
        if (rollType === "skill") {
          const result = parseImportJson(
            json,
            weapon.weaponType,
            weapon.element,
            "skill",
          )
          if (!result.ok) {
            setParseError(result.error)
            return
          }
          setParsed({ type: "skill", rows: result.rows })
        } else {
          const result = parseImportJson(
            json,
            weapon.weaponType,
            weapon.element,
            "bonus",
          )
          if (!result.ok) {
            setParseError(result.error)
            return
          }
          setParsed({ type: "bonus", rows: result.rows })
        }
      })
    },
    [weapon.weaponType, weapon.element, rollType],
  )

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  async function handleConfirm() {
    if (!parsed) return
    setIsImporting(true)
    setImportError(null)
    try {
      if (parsed.type === "skill") {
        await skillRollService.import(
          trackerId,
          weapon.id,
          fromIndex,
          parsed.rows,
        )
        qc.invalidateQueries({
          queryKey: ["skill-rolls", trackerId, weapon.id],
        })
      } else {
        await bonusRollService.import(
          trackerId,
          weapon.id,
          fromIndex,
          parsed.rows,
        )
        qc.invalidateQueries({
          queryKey: ["bonus-rolls", trackerId, weapon.id],
        })
      }
      qc.invalidateQueries({ queryKey: ["tracker"] })
      onClose()
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "Import failed")
    } finally {
      setIsImporting(false)
    }
  }

  const rows = parsed?.rows ?? []

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Import ${rollType === "skill" ? "Skill" : "Bonus"} Rolls`}
        className="bg-gray-900 border border-gray-700 rounded-lg w-160 max-w-full max-h-[85vh] flex flex-col shadow-2xl"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 shrink-0">
          <div>
            <p className="font-semibold text-gray-100 text-sm">
              Import {rollType === "skill" ? "Skill" : "Bonus"} Rolls
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {weapon.weaponType} · {weapon.element} · inserting after index{" "}
              {fromIndex}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors text-sm"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-0">
          {/* File drop zone */}
          {!parsed ? (
            <label
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-700 hover:border-gray-500 rounded-lg p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors text-gray-400 hover:text-gray-300"
            >
              <span className="text-3xl">📂</span>
              <p className="text-sm font-medium">
                Drop your JSON file here, or click to browse
              </p>
              <p className="text-xs text-gray-600">
                Only .json files are accepted
              </p>
              <input
                type="file"
                accept=".json,application/json"
                className="sr-only"
                onChange={handleFileChange}
              />
              {parseError && (
                <p className="text-xs text-red-400 bg-red-950/50 px-3 py-2 rounded border border-red-800 mt-2">
                  {parseError}
                </p>
              )}
            </label>
          ) : (
            <>
              {/* Summary */}
              <div className="bg-gray-800/50 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                <span className="text-green-400 font-mono">✓</span>
                <span className="text-gray-200">
                  Found <strong className="text-white">{rows.length}</strong>{" "}
                  attempt
                  {rows.length !== 1 ? "s" : ""} — will occupy index{" "}
                  <strong className="text-white">{fromIndex + 1}</strong>
                  {rows.length > 1 ? (
                    <>
                      {" – "}
                      <strong className="text-white">
                        {fromIndex + rows.length}
                      </strong>
                    </>
                  ) : null}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setParsed(null)
                    setParseError(null)
                  }}
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
                            Group Skill
                          </th>
                          <th className="text-left px-3 py-2 text-gray-400 font-semibold">
                            Series Skill
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
                          {fromIndex + i + 1}
                        </td>
                        {rollType === "skill" ? (
                          <>
                            <td className="px-3 py-1.5 text-gray-200">
                              {(row as SkillImportRow).groupSkill}
                            </td>
                            <td className="px-3 py-1.5 text-gray-200">
                              {(row as SkillImportRow).seriesSkill}
                            </td>
                          </>
                        ) : (
                          (
                            [
                              "bonus1",
                              "bonus2",
                              "bonus3",
                              "bonus4",
                              "bonus5",
                            ] as const
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
          )}

          {importError && (
            <p className="text-xs text-red-400 bg-red-950/50 px-3 py-2 rounded border border-red-800">
              {importError}
            </p>
          )}
        </div>

        {/* Footer */}
        {parsed && (
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-700 shrink-0">
            <p className="text-xs text-yellow-600 mr-auto">
              Existing rolls at index {fromIndex + 1}–{fromIndex + rows.length}{" "}
              will be overwritten.
            </p>
            <button
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="text-sm px-3 py-1.5 rounded text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isImporting || rows.length === 0}
              className="text-sm px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium transition-colors"
            >
              {isImporting
                ? "Importing…"
                : `Import ${rows.length} roll${rows.length !== 1 ? "s" : ""}`}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
