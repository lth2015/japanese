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
 * drop ids that no longer exist, and move newly-added priority ids to the
 * front of the not-yet-seen tail so fresh display packs surface promptly.
 */
export function reconcileOrder(
  persisted: string[],
  currentIds: string[],
  cursor: number,
  priorityIds: string[] = [],
): string[] {
  const currentSet = new Set(currentIds)
  const persistedSet = new Set(persisted)
  const prioritySet = new Set(priorityIds)
  const sortByPriority = (ids: string[]) => [
    ...shuffle(ids.filter((id) => prioritySet.has(id))),
    ...shuffle(ids.filter((id) => !prioritySet.has(id))),
  ]
  const kept = persisted.filter((id) => currentSet.has(id))
  if (kept.length === 0) return sortByPriority(currentIds)

  const newIds = sortByPriority(currentIds.filter((id) => !persistedSet.has(id)))
  if (newIds.length === 0) return kept

  const safeCursor = Math.min(Math.max(cursor, 0), kept.length)
  const head = kept.slice(0, safeCursor + 1)
  const tail = kept.slice(safeCursor + 1)
  return [...head, ...newIds, ...tail]
}
