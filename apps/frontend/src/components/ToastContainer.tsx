import { useSyncExternalStore } from "react"
import { getSnapshot, removeToast, subscribe, type Toast } from "../lib/toast"

function toastBg(type: Toast["type"]) {
  if (type === "error") return "bg-red-900/90 border-red-700 text-red-200"
  if (type === "success")
    return "bg-green-900/90 border-green-700 text-green-200"
  return "bg-gray-800/90 border-gray-600 text-gray-200"
}

export function ToastContainer() {
  const toasts = useSyncExternalStore(subscribe, getSnapshot)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm shadow-lg ${toastBg(toast.type)}`}
        >
          <span className="flex-1 leading-snug">{toast.message}</span>
          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            className="opacity-60 hover:opacity-100 shrink-0 text-base leading-none"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
