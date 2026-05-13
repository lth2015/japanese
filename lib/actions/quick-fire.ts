"use server"

import { and, asc, eq, isNull, or, sql } from "drizzle-orm"
import { id } from "@/lib/id"
import { db, schema } from "@/lib/db/client"
import { diffStats } from "@/lib/diff"

/**
 * Pick the next sentence for Stage 4 (Quick-Fire 5-sec CN→speak).
 *
 * Priority:
 *   1. Stage 4 review due
 *   2. Sentences that passed Stage 3 but never tried Stage 4
 *   3. Sentences that passed Stage 2.5 (skip 3 path)
 *   4. Sentences that passed Stage 2
 *   5. Fallback: low-difficulty sentences
 */
export async function getNextQuickFireSentence(excludeIds: string[] = []) {
  const nowSec = Math.floor(Date.now() / 1000)
  const exclude = excludeIds.length
    ? sql`${schema.sentence.id} NOT IN (${sql.join(excludeIds.map((i) => sql`${i}`), sql`,`)})`
    : sql`1=1`

  // 1) Due for review
  const due = db
    .select({ sentence: schema.sentence })
    .from(schema.sentence)
    .innerJoin(schema.userProgress, eq(schema.userProgress.sentenceId, schema.sentence.id))
    .where(
      and(
        sql`json_extract(${schema.userProgress.sm2}, '$.s4.nextReviewAt') IS NOT NULL`,
        sql`json_extract(${schema.userProgress.sm2}, '$.s4.nextReviewAt') <= ${nowSec}`,
        exclude,
      ),
    )
    .orderBy(sql`json_extract(${schema.userProgress.sm2}, '$.s4.nextReviewAt') ASC`)
    .limit(1)
    .all()
  if (due.length) return { sentence: due[0].sentence, isReview: true, isUnlocked: true }

  for (const minStage of [3, 25, 2]) {
    const rows = db
      .select({ sentence: schema.sentence })
      .from(schema.sentence)
      .innerJoin(schema.userProgress, eq(schema.userProgress.sentenceId, schema.sentence.id))
      .where(
        and(
          sql`${schema.userProgress.currentStage} >= ${minStage}`,
          sql`json_extract(${schema.userProgress.sm2}, '$.s4') IS NULL`,
          exclude,
        ),
      )
      .orderBy(asc(schema.sentence.frequencyRank))
      .limit(1)
      .all()
    if (rows.length) {
      return { sentence: rows[0].sentence, isReview: false, isUnlocked: minStage >= 3 }
    }
  }

  // 5) fallback
  const fallback = db
    .select()
    .from(schema.sentence)
    .leftJoin(schema.userProgress, eq(schema.userProgress.sentenceId, schema.sentence.id))
    .where(
      and(
        or(
          isNull(schema.userProgress.sentenceId),
          sql`json_extract(${schema.userProgress.sm2}, '$.s4') IS NULL`,
        ),
        exclude,
      ),
    )
    .orderBy(asc(schema.sentence.difficulty), asc(schema.sentence.frequencyRank))
    .limit(1)
    .all()
  if (fallback.length) {
    return { sentence: fallback[0].sentence, isReview: false, isUnlocked: false }
  }

  return null
}

export type QuickFireResult = {
  attemptId: string
  fluencyScore: number
  accuracyScore: number
  totalScore: number
}

/**
 * Score formula (first 4 weeks): 60% fluency + 40% accuracy.
 * Fluency rewards speaking within 5 sec; accuracy is character match.
 * Silence = 0 fluency = max ~40 total.
 */
export async function submitQuickFireAttempt(
  sentenceId: string,
  sttTranscript: string,
  spokenWithinSec: number | null,
): Promise<QuickFireResult> {
  const s = db.select().from(schema.sentence).where(eq(schema.sentence.id, sentenceId)).get()
  if (!s) throw new Error(`Sentence not found: ${sentenceId}`)

  // Fluency: 100 if spoke within 5s, linear decay to 0 at 10s, 0 if no speech.
  let fluency = 0
  if (spokenWithinSec !== null) {
    if (spokenWithinSec <= 5) fluency = 100
    else if (spokenWithinSec >= 10) fluency = 0
    else fluency = Math.round(100 - (spokenWithinSec - 5) * 20)
  }

  // Accuracy: from STT transcript vs target (char match).
  const stats = diffStats(sttTranscript, s.japanese)
  const accuracy = Math.round(stats.matchRatio * 100)

  const total = Math.round(0.6 * fluency + 0.4 * accuracy)

  const attemptId = id()
  db.insert(schema.quickFireAttempt)
    .values({
      id: attemptId,
      sentenceId,
      sttTranscript,
      spokenWithinSec,
      fluencyScore: fluency,
      accuracyScore: accuracy,
      totalScore: total,
    })
    .run()

  return { attemptId, fluencyScore: fluency, accuracyScore: accuracy, totalScore: total }
}
