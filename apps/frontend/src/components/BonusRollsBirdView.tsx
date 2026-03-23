import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"
import { useAllBonusRolls } from "../hooks/useAllBonusRolls"
import { useWeapons } from "../hooks/useWeapons"
import type { BonusRoll, Tracker, Weapon } from "../lib/api-service"
import { bonusRollService } from "../lib/api-service"
import type { Element, WeaponType } from "../lib/constants"
import { ELEMENTS, WEAPON_TYPES } from "../lib/constants"
import { ImportModal } from "./ImportModal"

interface Props {
  tracker: Tracker
}

type BonusKey = "bonus1" | "bonus2" | "bonus3" | "bonus4" | "bonus5"
type BonusData = Record<BonusKey, string>

// ── Add weapon popover ──────────────────────────────────────────────────────

function AddWeaponPopover({
  trackerId,
  onDone,
}: {
  trackerId: string
  onDone: () => void
}) {
  const { findOrCreate } = useWeapons(trackerId)
  const [weaponType, setWeaponType] = useState<WeaponType>(WEAPON_TYPES[0])
  const [element, setElement] = useState<Element>(ELEMENTS[0])

  return (
    <div className="absolute right-0 top-full mt-1 z-30 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-3 flex flex-col gap-2 w-52">
      <select
        className="bg-gray-700 text-gray-100 text-xs rounded px-2 py-1.5 border border-gray-600"
        value={weaponType}
        onChange={(e) => setWeaponType(e.target.value as WeaponType)}
      >
        {WEAPON_TYPES.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>
      <select
        className="bg-gray-700 text-gray-100 text-xs rounded px-2 py-1.5 border border-gray-600"
        value={element}
        onChange={(e) => setElement(e.target.value as Element)}
      >
        {ELEMENTS.map((e) => (
          <option key={e}>{e}</option>
        ))}
      </select>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() =>
            findOrCreate.mutate({ weaponType, element }, { onSuccess: onDone })
          }
          disabled={findOrCreate.isPending}
          className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-xs font-semibold rounded py-1.5"
        >
          {findOrCreate.isPending ? "…" : "Add"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="flex-1 bg-gray-600 hover:bg-gray-500 text-gray-200 text-xs rounded py-1.5"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Editable bonus cell ─────────────────────────────────────────────────────

interface EditableBonusCellProps {
  roll: BonusRoll
  weapon: Weapon
  onImport: (roll: BonusRoll, weapon: Weapon) => void
  updateRoll: (
    weaponId: string,
    rollId: string,
    data: Partial<BonusData>,
  ) => void
  deleteRoll: (weaponId: string, rollId: string) => void
  updating: boolean
}

const BONUS_KEYS: BonusKey[] = [
  "bonus1",
  "bonus2",
  "bonus3",
  "bonus4",
  "bonus5",
]

function EditableBonusCell({
  roll,
  weapon,
  onImport,
  updateRoll,
  deleteRoll,
  updating,
}: EditableBonusCellProps) {
  const [editing, setEditing] = useState(false)
  const [values, setValues] = useState<BonusData>({
    bonus1: roll.bonus1,
    bonus2: roll.bonus2,
    bonus3: roll.bonus3,
    bonus4: roll.bonus4,
    bonus5: roll.bonus5,
  })
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  function startEdit() {
    setValues({
      bonus1: roll.bonus1,
      bonus2: roll.bonus2,
      bonus3: roll.bonus3,
      bonus4: roll.bonus4,
      bonus5: roll.bonus5,
    })
    setEditing(true)
  }

  function save() {
    const changed: Partial<BonusData> = {}
    for (const key of BONUS_KEYS) {
      if (values[key].trim() !== roll[key]) changed[key] = values[key].trim()
    }
    if (Object.keys(changed).length > 0) {
      updateRoll(weapon.id, roll.id, changed)
    }
    setEditing(false)
  }

  function cancel() {
    setValues({
      bonus1: roll.bonus1,
      bonus2: roll.bonus2,
      bonus3: roll.bonus3,
      bonus4: roll.bonus4,
      bonus5: roll.bonus5,
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1 py-1">
        {BONUS_KEYS.map((key, i) => (
          <input
            key={key}
            ref={inputRefs[i]}
            autoFocus={i === 0}
            className="w-full bg-gray-700 text-gray-100 text-xs rounded px-2 py-1 border border-amber-500 outline-none"
            value={values[key]}
            onChange={(e) =>
              setValues((v) => ({ ...v, [key]: e.target.value }))
            }
            placeholder={`Bonus ${i + 1}`}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                if (i < 4) inputRefs[i + 1].current?.focus()
                else save()
              }
              if (e.key === "Escape") cancel()
            }}
            onBlur={i === 4 ? save : undefined}
          />
        ))}
        {updating && (
          <span className="text-[10px] text-gray-500 text-center">saving…</span>
        )}
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className="group/cell relative py-1 cursor-text"
      onClick={startEdit}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") startEdit()
      }}
      title="Click to edit"
    >
      <div className="text-center min-h-24 flex flex-col justify-center gap-0.5">
        {BONUS_KEYS.map((key, i) => (
          <div key={key} className="text-xs leading-snug">
            <span className="text-gray-600 mr-1">{i + 1}.</span>
            <span className="text-gray-200">{roll[key]}</span>
          </div>
        ))}
      </div>
      <div className="absolute top-0.5 right-0.5 hidden group-hover/cell:flex gap-0.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onImport(roll, weapon)
          }}
          className="text-gray-500 hover:text-blue-400 text-[10px] px-0.5 leading-none"
          title="Import from here"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            deleteRoll(weapon.id, roll.id)
          }}
          className="text-gray-500 hover:text-red-400 text-[10px] px-0.5 leading-none"
          title="Delete"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

// ── Add-row cell (one per weapon column in the bottom add row) ──────────────

function AddBonusCell({
  weapon,
  trackerId,
}: {
  weapon: Weapon
  trackerId: string
}) {
  const qc = useQueryClient()
  const emptyBonuses: BonusData = {
    bonus1: "",
    bonus2: "",
    bonus3: "",
    bonus4: "",
    bonus5: "",
  }
  const [values, setValues] = useState<BonusData>(emptyBonuses)
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  const create = useMutation({
    mutationFn: (bonuses: BonusData) =>
      bonusRollService.create(trackerId, weapon.id, bonuses),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bonus-rolls", trackerId, weapon.id] })
      qc.invalidateQueries({ queryKey: ["tracker"] })
      setValues(emptyBonuses)
    },
  })

  function submit() {
    const allFilled = BONUS_KEYS.every((k) => values[k].trim())
    if (!allFilled) return
    create.mutate({
      bonus1: values.bonus1.trim(),
      bonus2: values.bonus2.trim(),
      bonus3: values.bonus3.trim(),
      bonus4: values.bonus4.trim(),
      bonus5: values.bonus5.trim(),
    })
  }

  return (
    <div className="flex flex-col gap-1 py-1">
      {BONUS_KEYS.map((key, i) => (
        <input
          key={key}
          ref={inputRefs[i]}
          className="w-full bg-gray-800 text-gray-100 text-xs rounded px-2 py-1 border border-gray-700 focus:border-amber-500 outline-none placeholder-gray-600"
          value={values[key]}
          onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
          placeholder={`Bonus ${i + 1}`}
          disabled={create.isPending}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              if (i < 4) inputRefs[i + 1].current?.focus()
              else submit()
            }
          }}
        />
      ))}
      <button
        type="button"
        onClick={submit}
        disabled={create.isPending || BONUS_KEYS.some((k) => !values[k].trim())}
        className="w-full bg-amber-500/20 hover:bg-amber-500/40 disabled:opacity-40 text-amber-300 text-xs font-semibold rounded py-1 transition-colors"
      >
        {create.isPending ? "…" : "Add roll"}
      </button>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────────

export function BonusRollsBirdView({ tracker }: Props) {
  const qc = useQueryClient()
  const { query: weaponsQuery } = useWeapons(tracker.id)
  const weapons: Weapon[] = weaponsQuery.data ?? []
  const { data: rollsByWeapon, isLoading } = useAllBonusRolls(
    tracker.id,
    weapons,
  )
  const [addingWeapon, setAddingWeapon] = useState(false)
  const [importTarget, setImportTarget] = useState<{
    roll: BonusRoll
    weapon: Weapon
  } | null>(null)

  const updateRollMutation = useMutation({
    mutationFn: ({
      weaponId,
      rollId,
      data,
    }: {
      weaponId: string
      rollId: string
      data: Partial<BonusData>
    }) => bonusRollService.update(tracker.id, weaponId, rollId, data),
    onSuccess: (_, { weaponId }) => {
      qc.invalidateQueries({ queryKey: ["bonus-rolls", tracker.id, weaponId] })
    },
  })

  const deleteRollMutation = useMutation({
    mutationFn: ({ weaponId, rollId }: { weaponId: string; rollId: string }) =>
      bonusRollService.delete(tracker.id, weaponId, rollId),
    onSuccess: (_, { weaponId }) => {
      qc.invalidateQueries({ queryKey: ["bonus-rolls", tracker.id, weaponId] })
    },
  })

  const importRollsMutation = useMutation({
    mutationFn: ({
      weaponId,
      selectedIndex,
      rolls,
    }: {
      weaponId: string
      selectedIndex: number
      rolls: Array<{ attemptNum: number } & BonusData>
    }) => bonusRollService.import(tracker.id, weaponId, selectedIndex, rolls),
    onSuccess: (_, { weaponId }) => {
      qc.invalidateQueries({ queryKey: ["bonus-rolls", tracker.id, weaponId] })
    },
  })

  const allIndices: number[] = Array.from(
    new Set(
      Array.from(rollsByWeapon.values()).flatMap((rolls) =>
        rolls.map((r) => r.index),
      ),
    ),
  ).sort((a, b) => a - b)

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
      </div>
    )
  }

  if (weapons.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-600">
        No weapons yet — use the Bonus Rolls tab to add one.
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="border-collapse text-sm min-w-max w-full">
        {/* ── Header ── */}
        <thead className="sticky top-0 z-10">
          <tr className="bg-gray-900 border-b-2 border-gray-700">
            <th className="sticky left-0 z-20 bg-gray-900 text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide border-r border-gray-700 w-20 min-w-20">
              Index
            </th>
            {weapons.map((w) => (
              <th
                key={w.id}
                className="px-4 py-3 border-r border-gray-700 min-w-52 text-center"
              >
                <div className="font-semibold text-gray-100 text-sm">
                  {w.weaponType}
                </div>
                <div className="text-xs text-amber-400 font-normal mt-0.5">
                  {w.element}
                </div>
              </th>
            ))}
            <th className="px-3 py-3 border-gray-700 relative w-10">
              <button
                type="button"
                onClick={() => setAddingWeapon(!addingWeapon)}
                className="text-amber-400 hover:text-amber-300 text-xl leading-none font-bold"
                title="Add weapon"
              >
                +
              </button>
              {addingWeapon && (
                <AddWeaponPopover
                  trackerId={tracker.id}
                  onDone={() => setAddingWeapon(false)}
                />
              )}
            </th>
          </tr>
        </thead>

        <tbody>
          {/* ── Data rows ── */}
          {allIndices.map((idx) => (
            <tr
              key={idx}
              className="group/row border-b border-gray-800/60 hover:bg-gray-800/20 transition-colors"
            >
              <td className="sticky left-0 z-10 bg-gray-950 group-hover/row:bg-gray-900 px-4 py-2 font-mono text-sm text-gray-400 border-r border-gray-800 text-center align-middle transition-colors">
                {idx}
              </td>
              {weapons.map((w) => {
                const roll =
                  (rollsByWeapon.get(w.id) ?? []).find(
                    (r) => r.index === idx,
                  ) ?? null
                return (
                  <td
                    key={w.id}
                    className="px-3 border-r border-gray-800 align-middle"
                  >
                    {roll ? (
                      <EditableBonusCell
                        roll={roll}
                        weapon={w}
                        onImport={(r, wep) =>
                          setImportTarget({ roll: r, weapon: wep })
                        }
                        updateRoll={(weaponId, rollId, data) =>
                          updateRollMutation.mutate({ weaponId, rollId, data })
                        }
                        deleteRoll={(weaponId, rollId) =>
                          deleteRollMutation.mutate({ weaponId, rollId })
                        }
                        updating={updateRollMutation.isPending}
                      />
                    ) : (
                      <div className="py-2 text-center text-gray-700 text-xs select-none">
                        —
                      </div>
                    )}
                  </td>
                )
              })}
              <td />
            </tr>
          ))}

          {/* ── Add row ── */}
          <tr className="border-b border-gray-700 bg-gray-900/50">
            <td className="sticky left-0 z-10 bg-gray-900 px-4 py-2 font-mono text-sm text-amber-400 border-r border-gray-700 text-center align-top">
              {tracker.bonusIndex}
            </td>
            {weapons.map((w) => (
              <td
                key={w.id}
                className="px-3 py-1 border-r border-gray-700 align-top"
              >
                <AddBonusCell weapon={w} trackerId={tracker.id} />
              </td>
            ))}
            <td />
          </tr>
        </tbody>
      </table>

      {importTarget && (
        <ImportModal
          type="bonuses"
          selectedIndex={importTarget.roll.index}
          onClose={() => setImportTarget(null)}
          onImport={(idx, rawRows) => {
            const rows = rawRows as Array<{ attemptNum: number } & BonusData>
            importRollsMutation.mutate(
              {
                weaponId: importTarget.weapon.id,
                selectedIndex: idx,
                rolls: rows,
              },
              { onSuccess: () => setImportTarget(null) },
            )
          }}
        />
      )}
    </div>
  )
}
