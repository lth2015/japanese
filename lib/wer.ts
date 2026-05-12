/**
 * Character-level Word Error Rate for Japanese.
 * Strips whitespace and punctuation, then computes Levenshtein distance / target length.
 * Returns 0 (perfect) to 1+ (totally off).
 */

const PUNCT = /[\s、。，,.!?？！「」『』（）()・…—\-]/g

function normalize(s: string): string[] {
  return Array.from(s.replace(PUNCT, ""))
}

function levenshtein(a: string[], b: string[]): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  const m = a.length
  const n = b.length
  const prev = new Array<number>(n + 1)
  const curr = new Array<number>(n + 1)
  for (let j = 0; j <= n; j++) prev[j] = j
  for (let i = 1; i <= m; i++) {
    curr[0] = i
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j]
  }
  return prev[n]
}

export function wer(target: string, recognized: string): number {
  const t = normalize(target)
  const r = normalize(recognized)
  if (t.length === 0) return 0
  return levenshtein(t, r) / t.length
}

export function pronunciationScore(werValue: number): number {
  // Convert WER to 0-100 score. WER of 0 -> 100, WER of 0.5 -> 50, WER of 1+ -> 0.
  return Math.max(0, Math.min(100, Math.round((1 - werValue) * 100)))
}
