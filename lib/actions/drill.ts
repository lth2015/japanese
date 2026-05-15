"use server"

import { and, asc, eq, isNull, or, sql } from "drizzle-orm"
import { id } from "@/lib/id"
import { db, schema } from "@/lib/db/client"
import { diffStats } from "@/lib/diff"
import {
  type DrillNaturalnessFeedback,
  generateDrillNaturalnessFeedback,
  isGeminiConfigured,
} from "@/lib/gemini"

/**
 * Pick the next sentence to drill at Stage 2.
 *
 * Priority order:
 *   1. Sentences with user_progress where Stage 2 review is due
 *      (sm2.s2.nextReviewAt <= now) — these need rehearsing.
 *   2. Sentences the user has never attempted at Stage 2 — sorted by
 *      frequency_rank ascending (most common first), then difficulty ascending.
 */
export async function getNextDrillSentence(excludeIds: string[] = []) {
  const nowSec = Math.floor(Date.now() / 1000)

  // 1) Due-for-review attempt
  const dueRows = db
    .select({
      sentence: schema.sentence,
      progress: schema.userProgress,
    })
    .from(schema.sentence)
    .innerJoin(schema.userProgress, eq(schema.userProgress.sentenceId, schema.sentence.id))
    .where(
      and(
        sql`json_extract(${schema.userProgress.sm2}, '$.s2.nextReviewAt') IS NOT NULL`,
        sql`json_extract(${schema.userProgress.sm2}, '$.s2.nextReviewAt') <= ${nowSec}`,
        excludeIds.length
          ? sql`${schema.sentence.id} NOT IN (${sql.join(excludeIds.map((i) => sql`${i}`), sql`,`)})`
          : sql`1=1`,
      ),
    )
    .orderBy(sql`json_extract(${schema.userProgress.sm2}, '$.s2.nextReviewAt') ASC`)
    .limit(1)
    .all()

  if (dueRows.length > 0) {
    return { sentence: dueRows[0].sentence, isReview: true }
  }

  // 2) New sentences — never attempted at Stage 2, by frequency
  const newRows = db
    .select()
    .from(schema.sentence)
    .leftJoin(schema.userProgress, eq(schema.userProgress.sentenceId, schema.sentence.id))
    .where(
      and(
        or(
          isNull(schema.userProgress.sentenceId),
          sql`json_extract(${schema.userProgress.sm2}, '$.s2') IS NULL`,
        ),
        excludeIds.length
          ? sql`${schema.sentence.id} NOT IN (${sql.join(excludeIds.map((i) => sql`${i}`), sql`,`)})`
          : sql`1=1`,
      ),
    )
    .orderBy(
      asc(schema.sentence.frequencyRank),
      asc(schema.sentence.difficulty),
      asc(schema.sentence.id),
    )
    .limit(1)
    .all()

  if (newRows.length > 0) {
    return { sentence: newRows[0].sentence, isReview: false }
  }

  return null
}

export type SubmitResult = {
  attemptId: string
  matchRatio: number
  edits: number
}

export async function submitDrillAttempt(
  sentenceId: string,
  userInput: string,
): Promise<SubmitResult> {
  const s = db.select().from(schema.sentence).where(eq(schema.sentence.id, sentenceId)).get()
  if (!s) throw new Error(`Sentence not found: ${sentenceId}`)

  const stats = diffStats(userInput, s.japanese)
  const attemptId = id()

  db.insert(schema.drillAttempt)
    .values({
      id: attemptId,
      sentenceId,
      userInput,
      naturalScore: Math.round(stats.matchRatio * 100),
    })
    .run()

  return {
    attemptId,
    matchRatio: stats.matchRatio,
    edits: stats.edits,
  }
}

export type DrillFeedbackResult =
  | { status: "ok"; feedback: DrillNaturalnessFeedback }
  | { status: "not-configured" }
  | { status: "error"; message: string }

export async function requestDrillFeedback(attemptId: string): Promise<DrillFeedbackResult> {
  if (!isGeminiConfigured()) {
    return { status: "not-configured" }
  }

  const row = db
    .select({
      attempt: schema.drillAttempt,
      sentence: schema.sentence,
    })
    .from(schema.drillAttempt)
    .innerJoin(schema.sentence, eq(schema.sentence.id, schema.drillAttempt.sentenceId))
    .where(eq(schema.drillAttempt.id, attemptId))
    .get()

  if (!row) {
    return { status: "error", message: "Attempt not found" }
  }

  const { attempt, sentence } = row

  if (
    attempt.naturalVersion &&
    attempt.businessVersion &&
    attempt.casualVersion &&
    attempt.explanation
  ) {
    return {
      status: "ok",
      feedback: {
        naturalVersion: attempt.naturalVersion,
        businessVersion: attempt.businessVersion,
        casualVersion: attempt.casualVersion,
        explanation: attempt.explanation,
      },
    }
  }

  try {
    const feedback = await generateDrillNaturalnessFeedback({
      chinese: sentence.chinese,
      userInput: attempt.userInput,
      reference: sentence.japanese,
    })
    if (!feedback) return { status: "not-configured" }

    db.update(schema.drillAttempt)
      .set({
        naturalVersion: feedback.naturalVersion,
        businessVersion: feedback.businessVersion,
        casualVersion: feedback.casualVersion,
        explanation: feedback.explanation,
      })
      .where(eq(schema.drillAttempt.id, attemptId))
      .run()

    return { status: "ok", feedback }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[drill] Gemini feedback failed", message)
    return { status: "error", message }
  }
}
