import { useState } from "react"
import { setTrackerId } from "../lib/api-client"
import { trackerService } from "../lib/api-service"

interface Props {
  onReady: () => void
}

export function TrackerSetup({ onReady }: Props) {
  const [mode, setMode] = useState<"generate" | "load">("generate")
  const [name, setName] = useState("")
  const [loadId, setLoadId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const tracker = await trackerService.getOrCreate(null)
      if (name.trim()) {
        await trackerService.updateName(tracker.id, name.trim())
      }
      onReady()
    } catch {
      setError("Failed to create tracker. Is the server running?")
    } finally {
      setLoading(false)
    }
  }

  async function handleLoad() {
    const id = loadId.trim()
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      setTrackerId(id)
      await trackerService.getOrCreate(id)
      onReady()
    } catch {
      localStorage.removeItem("tracker_id")
      setError("Tracker not found. Double-check the ID.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-md p-8 flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-400">🦎 Gogma Tracker</h1>
          <p className="text-gray-400 mt-2 text-sm">
            Track your Gimmick Augment reroll results
          </p>
        </div>

        <div className="flex rounded-lg overflow-hidden border border-gray-700">
          <button
            type="button"
            onClick={() => {
              setMode("generate")
              setError(null)
            }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mode === "generate"
                ? "bg-red-500 text-white"
                : "bg-gray-800 text-gray-400 hover:text-gray-200"
            }`}
          >
            New Tracker
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("load")
              setError(null)
            }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mode === "load"
                ? "bg-red-500 text-white"
                : "bg-gray-800 text-gray-400 hover:text-gray-200"
            }`}
          >
            Load Existing
          </button>
        </div>

        {mode === "generate" ? (
          <div className="flex flex-col gap-3">
            <input
              className="bg-gray-800 text-gray-100 rounded px-3 py-2 border border-gray-600 placeholder-gray-600"
              placeholder="Tracker name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? "Creating…" : "Create New Tracker"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              className="bg-gray-800 text-gray-100 rounded px-3 py-2 border border-gray-600 placeholder-gray-600"
              placeholder="Paste Tracker ID"
              value={loadId}
              onChange={(e) => setLoadId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLoad()}
              autoFocus
            />
            <button
              type="button"
              onClick={handleLoad}
              disabled={loading || !loadId.trim()}
              className="bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? "Loading…" : "Load Tracker"}
            </button>
          </div>
        )}

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>
    </div>
  )
}
