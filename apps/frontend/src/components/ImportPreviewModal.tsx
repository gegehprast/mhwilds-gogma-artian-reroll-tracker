import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useCloseOnEscape } from "../hooks/useCloseOnEscape"
import { useCloseOnOutsideClick } from "../hooks/useCloseOnOutsideClick"
import type { Weapon } from "../lib/api-service"
import { bonusRollService, skillRollService } from "../lib/api-service"
import type { BonusImportRow, SkillImportRow } from "../lib/import-rolls"
import { parseImportJson } from "../lib/import-rolls"
import { ImportDropZone } from "./ImportDropZone"
import { ImportPreviewContent } from "./ImportPreviewContent"

// ── Types ───────────────────────────────────────────────────────────────────

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
  const dialogRef = useRef<HTMLDivElement | null>(null)

  useCloseOnEscape(onClose, !parsed)
  useCloseOnOutsideClick(dialogRef, onClose, !parsed)

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Import ${rollType === "skill" ? "Skill" : "Bonus"} Rolls`}
        className="relative bg-gray-900 border border-gray-700 rounded-lg w-160 max-w-full max-h-[85vh] flex flex-col shadow-2xl"
        tabIndex={-1}
        autoFocus
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 shrink-0">
          <div>
            <p className="font-semibold text-gray-100 text-sm">
              Import {rollType === "skill" ? "Skill" : "Bonus"} Rolls
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {weapon.weaponType} · {weapon.element} · inserting from index{" "}
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
          {parsed ? (
            <ImportPreviewContent
              rows={rows}
              fromIndex={fromIndex}
              rollType={rollType}
              onChangeFile={() => {
                setParsed(null)
                setParseError(null)
              }}
            />
          ) : (
            <ImportDropZone onFile={processFile} parseError={parseError} />
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
              Existing rolls at index {fromIndex}–{fromIndex + rows.length - 1}{" "}
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
