export type TickerState = { shuffledIds: string[]; cursor: number }

const KEY = "nihongo:display-ticker-state-v1"

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function loadTickerState(): TickerState | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed.shuffledIds) || typeof parsed.cursor !== "number") {
      return null
    }
    return parsed as TickerState
  } catch {
    return null
  }
}

export function saveTickerState(state: TickerState) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // localStorage may be unavailable (private mode / quota) — ignore.
  }
}

/**
 * Merge a freshly-loaded sentence id set into the persisted shuffle:
 * drop ids that no longer exist, and splice newly-added ids (shuffled)
 * into the not-yet-seen tail so a just-imported pack surfaces within the
 * current pass instead of waiting a full cycle.
 */
export function reconcileOrder(
  persisted: string[],
  currentIds: string[],
  cursor: number,
): string[] {
  const currentSet = new Set(currentIds)
  const persistedSet = new Set(persisted)
  const kept = persisted.filter((id) => currentSet.has(id))
  if (kept.length === 0) return shuffle(currentIds)

  const newIds = shuffle(currentIds.filter((id) => !persistedSet.has(id)))
  if (newIds.length === 0) return kept

  const safeCursor = Math.min(Math.max(cursor, 0), kept.length)
  const head = kept.slice(0, safeCursor + 1)
  const tail = kept.slice(safeCursor + 1)
  for (const id of newIds) {
    tail.splice(Math.floor(Math.random() * (tail.length + 1)), 0, id)
  }
  return [...head, ...tail]
}
