/**
 * Module-level toast store. Works with useSyncExternalStore.
 * No React context needed — mutations can call addToast() directly.
 */
export type ToastType = "error" | "success" | "info"

export interface Toast {
  id: string
  message: string
  type: ToastType
}

let toasts: Toast[] = []
const listeners = new Set<() => void>()

function notify() {
  for (const listener of listeners) listener()
}

export function addToast(message: string, type: ToastType = "error") {
  const id = String(Date.now() + Math.random())
  toasts = [...toasts, { id, message, type }]
  notify()
  setTimeout(() => removeToast(id), 5000)
}

export function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id)
  notify()
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSnapshot(): Toast[] {
  return toasts
}
