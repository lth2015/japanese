/**
 * SM-2 spaced repetition algorithm.
 * Quality scale: 0 (complete blackout) — 5 (perfect).
 * Threshold: < 3 = failed, restart interval; >= 3 = pass, advance.
 */

export type SM2State = {
  easeFactor: number
  intervalDays: number
  repetitions: number
}

export function sm2(state: SM2State, quality: number): SM2State {
  const q = Math.max(0, Math.min(5, quality))
  let { easeFactor, intervalDays, repetitions } = state

  if (q < 3) {
    // Failed: reset
    repetitions = 0
    intervalDays = 1
  } else {
    repetitions += 1
    if (repetitions === 1) intervalDays = 1
    else if (repetitions === 2) intervalDays = 6
    else intervalDays = Math.round(intervalDays * easeFactor)
  }

  // Update ease factor (clamp to >= 1.3)
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  if (easeFactor < 1.3) easeFactor = 1.3

  return { easeFactor, intervalDays, repetitions }
}

export function nextReviewDate(intervalDays: number, from: Date = new Date()): Date {
  const d = new Date(from)
  d.setDate(d.getDate() + intervalDays)
  return d
}
