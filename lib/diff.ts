/**
 * Character-level diff for Japanese text comparison.
 * Returns aligned segments showing matched / inserted / deleted characters,
 * suitable for UI highlighting in drill feedback.
 */

export type DiffOp = "match" | "insert" | "delete" | "replace"
export type DiffSegment = { op: DiffOp; user: string; target: string }

const PUNCT = /[\s、。，,.!?？！「」『』（）()・…—\-]/g

function normalize(s: string): string {
  return s.replace(PUNCT, "").trim()
}

/** Compute Levenshtein operations between two character arrays. */
function alignChars(a: string[], b: string[]): DiffSegment[] {
  const m = a.length
  const n = b.length
  // dp[i][j] = min cost to convert a[0..i) into b[0..j)
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  // Backtrack
  const ops: DiffSegment[] = []
  let i = m
  let j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      ops.push({ op: "match", user: a[i - 1], target: b[j - 1] })
      i--
      j--
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      ops.push({ op: "replace", user: a[i - 1], target: b[j - 1] })
      i--
      j--
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      ops.push({ op: "delete", user: a[i - 1], target: "" })
      i--
    } else {
      ops.push({ op: "insert", user: "", target: b[j - 1] })
      j--
    }
  }
  return ops.reverse()
}

/** Coalesce adjacent ops of the same kind for cleaner rendering. */
function coalesce(ops: DiffSegment[]): DiffSegment[] {
  const out: DiffSegment[] = []
  for (const op of ops) {
    const last = out[out.length - 1]
    if (last && last.op === op.op) {
      last.user += op.user
      last.target += op.target
    } else {
      out.push({ ...op })
    }
  }
  return out
}

export function diff(user: string, target: string): DiffSegment[] {
  const u = Array.from(normalize(user))
  const t = Array.from(normalize(target))
  return coalesce(alignChars(u, t))
}

export type DiffStats = {
  totalChars: number
  matched: number
  matchRatio: number // 0..1
  edits: number // total insertions + deletions + replacements
}

export function diffStats(user: string, target: string): DiffStats {
  const u = normalize(user)
  const t = normalize(target)
  const segs = diff(u, t)
  const matched = segs.filter((s) => s.op === "match").reduce((acc, s) => acc + s.user.length, 0)
  const edits = segs.filter((s) => s.op !== "match").length
  const total = Math.max(t.length, 1)
  return { totalChars: total, matched, matchRatio: matched / total, edits }
}
