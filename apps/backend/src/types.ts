declare module "@bunkit/server" {
  interface Context {
    /** Tracker ID extracted from the X-Tracker-Id header */
    trackerId?: string
  }
}

export {}
