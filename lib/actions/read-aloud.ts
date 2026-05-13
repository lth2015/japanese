"use server"

import { and, asc, eq, isNull, or, sql } from "drizzle-orm"
import { id } from "@/lib/id"
import { db, schema } from "@/lib/db/client"
import { diffStats } from "@/lib/diff"

/**
 * Pick the next sentence to read-aloud (Stage 2.5).
 *
 * Priority order:
 *   1. Sentences with Stage 2.5 review due (sm2.s25.nextReviewAt <= now)
 *   2. Sentences that have passed Stage 2 (currentStage >= 2) but never attempted at 2.5
 *   3. Sentences the user is at Stage 1 — fallback if no Stage 2 unlocks yet
 */
export async function getNextReadAloudSentence(excludeIds: string[] = []) {
  const nowSec = Math.floor(Date.now() / 1000)

  // 1) Stage 2.5 review due
  const dueRows = db
    .select({ sentence: schema.sentence })
    .from(schema.sentence)
    .innerJoin(schema.userProgress, eq(schema.userProgress.sentenceId, schema.sentence.id))
    .where(
      and(
        sql`json_extract(${schema.userProgress.sm2}, '$.s25.nextReviewAt') IS NOT NULL`,
        sql`json_extract(${schema.userProgress.sm2}, '$.s25.nextReviewAt') <= ${nowSec}`,
        excludeIds.length
          ? sql`${schema.sentence.id} NOT IN (${sql.join(excludeIds.map((i) => sql`${i}`), sql`,`)})`
          : sql`1=1`,
      ),
    )
    .orderBy(sql`json_extract(${schema.userProgress.sm2}, '$.s25.nextReviewAt') ASC`)
    .limit(1)
    .all()

  if (dueRows.length > 0) {
    return { sentence: dueRows[0].sentence, isReview: true, isUnlocked: true }
  }

  // 2) Currently at >=2, never tried 2.5
  const stage2Rows = db
    .select({ sentence: schema.sentence })
    .from(schema.sentence)
    .innerJoin(schema.userProgress, eq(schema.userProgress.sentenceId, schema.sentence.id))
    .where(
      and(
        sql`${schema.userProgress.currentStage} >= 2`,
        sql`json_extract(${schema.userProgress.sm2}, '$.s25') IS NULL`,
        excludeIds.length
          ? sql`${schema.sentence.id} NOT IN (${sql.join(excludeIds.map((i) => sql`${i}`), sql`,`)})`
          : sql`1=1`,
      ),
    )
    .orderBy(asc(schema.sentence.frequencyRank), asc(schema.sentence.difficulty))
    .limit(1)
    .all()

  if (stage2Rows.length > 0) {
    return { sentence: stage2Rows[0].sentence, isReview: false, isUnlocked: true }
  }

  // 3) Fallback: pick a low-difficulty sentence even if not yet at Stage 2
  const fallbackRows = db
    .select()
    .from(schema.sentence)
    .leftJoin(schema.userProgress, eq(schema.userProgress.sentenceId, schema.sentence.id))
    .where(
      and(
        or(
          isNull(schema.userProgress.sentenceId),
          sql`json_extract(${schema.userProgress.sm2}, '$.s25') IS NULL`,
        ),
        excludeIds.length
          ? sql`${schema.sentence.id} NOT IN (${sql.join(excludeIds.map((i) => sql`${i}`), sql`,`)})`
          : sql`1=1`,
      ),
    )
    .orderBy(asc(schema.sentence.difficulty), asc(schema.sentence.frequencyRank))
    .limit(1)
    .all()

  if (fallbackRows.length > 0) {
    return { sentence: fallbackRows[0].sentence, isReview: false, isUnlocked: false }
  }

  return null
}

export type ReadAloudResult = {
  attemptId: string
  matchRatio: number
  edits: number
}

export async function submitReadAloudAttempt(
  sentenceId: string,
  sttTranscript: string,
): Promise<ReadAloudResult> {
  const s = db.select().from(schema.sentence).where(eq(schema.sentence.id, sentenceId)).get()
  if (!s) throw new Error(`Sentence not found: ${sentenceId}`)

  // For 音読, compare STT transcript to the target Japanese (or kana fallback)
  const target = s.japanese
  const stats = diffStats(sttTranscript, target)
  const score = Math.round(Math.max(0.6, stats.matchRatio) * 100) // floor at 60 if STT recognized anything

  const attemptId = id()
  db.insert(schema.readAloudAttempt)
    .values({
      id: attemptId,
      sentenceId,
      sttTranscript,
      characterMatch: stats.matchRatio,
      score,
    })
    .run()

  return {
    attemptId,
    matchRatio: stats.matchRatio,
    edits: stats.edits,
  }
}
