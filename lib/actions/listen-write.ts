"use server"

import { and, asc, eq, isNull, or, sql } from "drizzle-orm"
import { id } from "@/lib/id"
import { db, schema } from "@/lib/db/client"
import { diffStats } from "@/lib/diff"

/**
 * Pick the next sentence for Stage 3 (听写).
 *
 * Priority:
 *   1. Stage 3 review due
 *   2. Sentences that have passed Stage 2.5 but never attempted Stage 3
 *   3. Sentences that have passed Stage 2 (skip 2.5 for users who can already hear)
 *   4. Fallback: any sentence
 */
export async function getNextListenWriteSentence(excludeIds: string[] = []) {
  const nowSec = Math.floor(Date.now() / 1000)
  const exclude = excludeIds.length
    ? sql`${schema.sentence.id} NOT IN (${sql.join(excludeIds.map((i) => sql`${i}`), sql`,`)})`
    : sql`1=1`

  // 1) Due for review
  const dueRows = db
    .select({ sentence: schema.sentence })
    .from(schema.sentence)
    .innerJoin(schema.userProgress, eq(schema.userProgress.sentenceId, schema.sentence.id))
    .where(
      and(
        sql`json_extract(${schema.userProgress.sm2}, '$.s3.nextReviewAt') IS NOT NULL`,
        sql`json_extract(${schema.userProgress.sm2}, '$.s3.nextReviewAt') <= ${nowSec}`,
        exclude,
      ),
    )
    .orderBy(sql`json_extract(${schema.userProgress.sm2}, '$.s3.nextReviewAt') ASC`)
    .limit(1)
    .all()
  if (dueRows.length > 0) {
    return { sentence: dueRows[0].sentence, isReview: true, isUnlocked: true }
  }

  // 2) Passed Stage 2.5 but no Stage 3 yet
  const unlocked25 = db
    .select({ sentence: schema.sentence })
    .from(schema.sentence)
    .innerJoin(schema.userProgress, eq(schema.userProgress.sentenceId, schema.sentence.id))
    .where(
      and(
        sql`${schema.userProgress.currentStage} >= 25`,
        sql`json_extract(${schema.userProgress.sm2}, '$.s3') IS NULL`,
        exclude,
      ),
    )
    .orderBy(asc(schema.sentence.frequencyRank))
    .limit(1)
    .all()
  if (unlocked25.length > 0) {
    return { sentence: unlocked25[0].sentence, isReview: false, isUnlocked: true }
  }

  // 3) Passed Stage 2 but skip 2.5
  const unlocked2 = db
    .select({ sentence: schema.sentence })
    .from(schema.sentence)
    .innerJoin(schema.userProgress, eq(schema.userProgress.sentenceId, schema.sentence.id))
    .where(
      and(
        sql`${schema.userProgress.currentStage} >= 2`,
        sql`json_extract(${schema.userProgress.sm2}, '$.s3') IS NULL`,
        exclude,
      ),
    )
    .orderBy(asc(schema.sentence.frequencyRank))
    .limit(1)
    .all()
  if (unlocked2.length > 0) {
    return { sentence: unlocked2[0].sentence, isReview: false, isUnlocked: true }
  }

  // 4) Fallback — sentences never tried at Stage 3, sorted by mora_count then difficulty (easier first)
  const fallback = db
    .select()
    .from(schema.sentence)
    .leftJoin(schema.userProgress, eq(schema.userProgress.sentenceId, schema.sentence.id))
    .where(
      and(
        or(
          isNull(schema.userProgress.sentenceId),
          sql`json_extract(${schema.userProgress.sm2}, '$.s3') IS NULL`,
        ),
        exclude,
      ),
    )
    .orderBy(
      asc(sql`COALESCE(${schema.sentence.moraCount}, 999)`),
      asc(schema.sentence.difficulty),
    )
    .limit(1)
    .all()
  if (fallback.length > 0) {
    return { sentence: fallback[0].sentence, isReview: false, isUnlocked: false }
  }

  return null
}

export type ListenWriteResult = {
  attemptId: string
  matchRatio: number
  edits: number
}

export async function submitListenWriteAttempt(
  sentenceId: string,
  userInput: string,
  replays: number,
): Promise<ListenWriteResult> {
  const s = db.select().from(schema.sentence).where(eq(schema.sentence.id, sentenceId)).get()
  if (!s) throw new Error(`Sentence not found: ${sentenceId}`)

  const stats = diffStats(userInput, s.japanese)
  const attemptId = id()
  db.insert(schema.listenWriteAttempt)
    .values({
      id: attemptId,
      sentenceId,
      userInput,
      characterMatch: stats.matchRatio,
      score: Math.round(stats.matchRatio * 100),
      replays,
    })
    .run()

  return {
    attemptId,
    matchRatio: stats.matchRatio,
    edits: stats.edits,
  }
}
