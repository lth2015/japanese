"use server"

import { eq } from "drizzle-orm"
import { db, schema } from "@/lib/db/client"
import type { Sm2PerStage } from "@/lib/db/schema"
import {
  applySM2,
  nextCurrentStage,
  nextReviewTs,
  type RatingQuality,
  type Stage,
  stageKey,
} from "@/lib/progress"

/**
 * Apply a self-rating for a sentence at the given stage.
 * Updates user_progress: SM-2 schedule for that stage, currentStage, history.
 *
 * Used by all training modes (drill, read-aloud, listen-write, quick-fire).
 */
export async function applyRating(sentenceId: string, stage: Stage, quality: RatingQuality) {
  const sk = stageKey(stage)
  if (!sk) throw new Error(`Stage ${stage} has no SM-2 schedule`)

  const existing = db
    .select()
    .from(schema.userProgress)
    .where(eq(schema.userProgress.sentenceId, sentenceId))
    .get()

  const prevCurrent: Stage = (existing?.currentStage as Stage) ?? 1
  const newCurrent = nextCurrentStage(prevCurrent, stage, quality)

  const prevSm2 = existing?.sm2 ?? {}
  const newStageState = applySM2(prevSm2[sk], quality)
  const newSm2: typeof prevSm2 = {
    ...prevSm2,
    [sk]: {
      ...newStageState,
      nextReviewAt: nextReviewTs(newStageState.intervalDays),
    } satisfies Sm2PerStage,
  }

  const newHistory = [
    ...(existing?.stageHistory ?? []),
    {
      stage,
      passedAt: Math.floor(Date.now() / 1000),
      score: quality,
    },
  ]

  if (existing) {
    db.update(schema.userProgress)
      .set({
        currentStage: newCurrent,
        stageHistory: newHistory,
        sm2: newSm2,
        lastReviewAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.userProgress.sentenceId, sentenceId))
      .run()
  } else {
    db.insert(schema.userProgress)
      .values({
        sentenceId,
        currentStage: newCurrent,
        stageHistory: newHistory,
        sm2: newSm2,
        lastReviewAt: new Date(),
      })
      .run()
  }

  return { previousStage: prevCurrent, newStage: newCurrent }
}
