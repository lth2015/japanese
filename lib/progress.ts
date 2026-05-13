/**
 * Stage progression logic. Encodes the R→W→音読→L→S model.
 *
 * Stage integer encoding:
 *   1   - read (recognition; default for all preset sentences)
 *   2   - write (drill: CN → JP)
 *   25  - read-aloud (音読)
 *   3   - listen-write
 *   4   - quick-fire (5-sec CN → speak)
 *   5   - in-the-wild (real conversation)
 *
 * Quality scale (matches SM-2): 0-5. We expose 3 user-facing buttons:
 *   完美       → 5
 *   可接受     → 3
 *   需要复习   → 1
 */

import type { StageKey } from "./db/schema"
import { type SM2State, sm2 } from "./sm2"

export const STAGES = [1, 2, 25, 3, 4, 5] as const
export type Stage = (typeof STAGES)[number]

export function stageKey(stage: Stage): StageKey | null {
  switch (stage) {
    case 2:
      return "s2"
    case 25:
      return "s25"
    case 3:
      return "s3"
    case 4:
      return "s4"
    default:
      return null // stage 1 and 5 don't have SM-2 schedules
  }
}

export function stageLabel(stage: Stage): string {
  switch (stage) {
    case 1:
      return "识别"
    case 2:
      return "写出"
    case 25:
      return "朗读"
    case 3:
      return "听写"
    case 4:
      return "5秒口译"
    case 5:
      return "实战"
  }
}

export const SELF_RATINGS = [
  { label: "完美", quality: 5, color: "success" as const },
  { label: "可接受", quality: 3, color: "warning" as const },
  { label: "需要复习", quality: 1, color: "danger" as const },
]

export type RatingQuality = 1 | 3 | 5

/** Decide the next currentStage after an attempt at `attemptStage`. */
export function nextCurrentStage(
  previousCurrent: Stage,
  attemptStage: Stage,
  quality: RatingQuality,
): Stage {
  // Failure on this stage: demote to one below (don't go below 1)
  if (quality < 3) {
    const idx = STAGES.indexOf(attemptStage)
    return STAGES[Math.max(0, idx - 1)]
  }
  // Pass: advance to max(previousCurrent, attemptStage)
  return previousCurrent > attemptStage ? previousCurrent : attemptStage
}

/** Apply SM-2 update for the given stage; returns next state. */
export function applySM2(
  currentState: SM2State | undefined,
  quality: RatingQuality,
): SM2State {
  const start: SM2State = currentState ?? {
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
  }
  return sm2(start, quality)
}

/** Convert intervalDays into a nextReviewAt unix-seconds timestamp. */
export function nextReviewTs(intervalDays: number, from: Date = new Date()): number {
  const d = new Date(from)
  d.setDate(d.getDate() + intervalDays)
  return Math.floor(d.getTime() / 1000)
}
