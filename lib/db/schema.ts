import { sql } from "drizzle-orm"
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core"

const now = sql`(unixepoch())`

// === Sentence library ===
export const sentence = sqliteTable("sentence", {
  id: text("id").primaryKey(), // nanoid
  japanese: text("japanese").notNull(),
  kana: text("kana"),
  chinese: text("chinese").notNull(),
  category: text("category", {
    enum: ["rescue", "progress", "request", "apology", "smalltalk", "custom"],
  }).notNull(),
  difficulty: integer("difficulty").notNull().default(3), // 1-5
  source: text("source", { enum: ["preset", "user-import", "user-manual"] })
    .notNull()
    .default("preset"),
  tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
  ttsAudioPath: text("tts_audio_path"), // local file path (relative to data/)
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(now),
})

export type Sentence = typeof sentence.$inferSelect
export type NewSentence = typeof sentence.$inferInsert

// === Drill attempts (CN -> JP writing) ===
export const drillAttempt = sqliteTable("drill_attempt", {
  id: text("id").primaryKey(),
  sentenceId: text("sentence_id")
    .notNull()
    .references(() => sentence.id),
  userInput: text("user_input").notNull(),
  naturalScore: integer("natural_score"), // 0-100
  naturalVersion: text("natural_version"),
  businessVersion: text("business_version"),
  casualVersion: text("casual_version"),
  explanation: text("explanation"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(now),
})

// === Read attempts (跟读) ===
export const readAttempt = sqliteTable("read_attempt", {
  id: text("id").primaryKey(),
  sentenceId: text("sentence_id")
    .notNull()
    .references(() => sentence.id),
  audioPath: text("audio_path"),
  sttTranscript: text("stt_transcript"),
  sttConfidence: real("stt_confidence"),
  werScore: real("wer_score"),
  naturalness: text("naturalness"),
  durationMs: integer("duration_ms"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(now),
})

// === Talk sessions ===
export type TalkTurn = {
  role: "ai" | "user"
  text: string
  audioPath?: string
  sttTranscript?: string
  improvedVersion?: string
}

export const talkSession = sqliteTable("talk_session", {
  id: text("id").primaryKey(),
  scenario: text("scenario").notNull(),
  turns: text("turns", { mode: "json" }).$type<TalkTurn[]>().notNull().default([]),
  summary: text("summary"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(now),
  endedAt: integer("ended_at", { mode: "timestamp" }),
})

// === SM-2 review queue ===
export const reviewItem = sqliteTable("review_item", {
  id: text("id").primaryKey(),
  sentenceId: text("sentence_id")
    .notNull()
    .references(() => sentence.id),
  reason: text("reason", {
    enum: ["drill-failed", "read-failed", "user-saved", "auto-from-notebook", "talk-improvement"],
  }).notNull(),
  // SM-2 fields
  easeFactor: real("ease_factor").notNull().default(2.5),
  intervalDays: integer("interval_days").notNull().default(0),
  repetitions: integer("repetitions").notNull().default(0),
  nextReviewAt: integer("next_review_at", { mode: "timestamp" }).notNull(),
  lastReviewAt: integer("last_review_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(now),
})

export type ReviewItem = typeof reviewItem.$inferSelect

// === Settings (single row, key-value JSON) ===
export const setting = sqliteTable("setting", {
  key: text("key").primaryKey(),
  value: text("value", { mode: "json" }).notNull(),
})
