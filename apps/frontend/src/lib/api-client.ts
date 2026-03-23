import createClient from "openapi-fetch"
import type { paths } from "../generated/openapi"

const TRACKER_ID_KEY = "tracker_id"
const X_TRACKER_ID = "X-Tracker-Id"

export function getTrackerId(): string | null {
  return localStorage.getItem(TRACKER_ID_KEY)
}

export function setTrackerId(id: string): void {
  localStorage.setItem(TRACKER_ID_KEY, id)
}

/** openapi-fetch client — automatically injects X-Tracker-Id when present */
export const apiClient = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:3001",
})

apiClient.use({
  onRequest({ request }) {
    const id = getTrackerId()
    if (id) request.headers.set(X_TRACKER_ID, id)
    return request
  },
})
