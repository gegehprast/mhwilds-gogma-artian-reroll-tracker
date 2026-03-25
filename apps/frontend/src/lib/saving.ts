/**
 * Module-level saving store. Tracks in-flight mutations via a counter.
 * Works with useSyncExternalStore — no React context needed.
 */
let inFlight = 0
const listeners = new Set<() => void>()

function notify() {
  for (const listener of listeners) listener()
}

export function startSaving() {
  inFlight++
  notify()
}

export function doneSaving() {
  inFlight = Math.max(0, inFlight - 1)
  notify()
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSnapshot(): boolean {
  return inFlight > 0
}
