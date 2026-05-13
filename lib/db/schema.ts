import { sql } from "drizzle-orm"
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core"

const now = sql`(unixepoch())`

// Token used for per-kanji furigana rendering.
// `text` is the surface form (kanji or kana). `kana` is the reading;
// null/missing means render plain (already kana). Renders as <ruby>{text}<rt>{kana}</rt></ruby>.
export type Token = { text: string; kana?: string }

export type SentenceCategory =
  | "rescue"
  | "progress"
  | "request"
  | "apology"
  | "smalltalk"
  | "daily"
  | "grammar"
  | "custom"

export type Register = "敬語" | "丁寧" | "カジュアル"
export type SentenceSource = "preset" | "user-import" | "user-manual" | "ai-generated-accepted"

// === Sentence library ===
export const sentence = sqliteTable("sentence", {
  id: text("id").primaryKey(),
  japanese: text("japanese").notNull(),
  kana: text("kana"), // full-sentence reading, fallback when tokens absent
  tokens: text("tokens", { mode: "json" }).$type<Token[]>(), // per-token reading for furigana ruby
  chinese: text("chinese").notNull(),
  category: text("category").$type<SentenceCategory>().notNull(),
  register: text("register").$type<Register>(),
  chunkPattern: text("chunk_pattern"), // "...させてください" reusable skeleton
  difficulty: integer("difficulty").notNull().default(3), // 1-5
  frequencyRank: integer("frequency_rank"), // 1-1000, lower = more common
  moraCount: integer("mora_count"), // listening difficulty hint
  source: text("source").$type<SentenceSource>().notNull().default("preset"),
  tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
  ttsAudioPath: text("tts_audio_path"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
})

export type Sentence = typeof sentence.$inferSelect
export type NewSentence = typeof sentence.$inferInsert

// === Dialogue (multi-turn) ===
export type DialogueTurn = {
  speaker: string // e.g. "上司" / "你" / "同僚"
  japanese: string
  tokens?: Token[]
  kana?: string
  chinese: string
}

export const dialogue = sqliteTable("dialogue", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  scenario: text("scenario").notNull(), // "1on1" | "meeting" | "slack" | "email"
  description: text("description"),
  difficulty: integer("difficulty").notNull().default(3),
  register: text("register").$type<Register>(),
  turns: text("turns", { mode: "json" }).$type<DialogueTurn[]>().notNull().default([]),
  tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
  source: text("source").$type<SentenceSource>().notNull().default("preset"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
})

export type Dialogue = typeof dialogue.$inferSelect

// === Passage (short article) ===
export type PassageVocab = { word: string; kana?: string; meaning: string }
export type PassageQuestion = {
  q: string
  a: string
  type: "fact" | "open" | "summary" | "rewrite"
}

export const passage = sqliteTable("passage", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  source: text("source_kind").notNull(), // "email" | "slack" | "meeting-minutes" | "report" | "news"
  description: text("description"),
  body: text("body").notNull(), // raw text
  tokens: text("tokens", { mode: "json" }).$type<Token[]>(), // for ruby rendering
  vocabulary: text("vocabulary", { mode: "json" }).$type<PassageVocab[]>().default([]),
  questions: text("questions", { mode: "json" }).$type<PassageQuestion[]>().default([]),
  difficulty: integer("difficulty").notNull().default(3),
  lengthWords: integer("length_words"),
  tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
  contentSource: text("content_source").$type<SentenceSource>().notNull().default("preset"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
})

export type Passage = typeof passage.$inferSelect

// === Drill attempts (CN -> JP writing, Stage 2) ===
export const drillAttempt = sqliteTable("drill_attempt", {
  id: text("id").primaryKey(),
  sentenceId: text("sentence_id").notNull().references(() => sentence.id),
  userInput: text("user_input").notNull(),
  naturalScore: integer("natural_score"),
  naturalVersion: text("natural_version"),
  businessVersion: text("business_version"),
  casualVersion: text("casual_version"),
  explanation: text("explanation"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
})

// === Read-aloud attempts (Stage 2.5, 音読) ===
export const readAloudAttempt = sqliteTable("read_aloud_attempt", {
  id: text("id").primaryKey(),
  sentenceId: text("sentence_id").notNull().references(() => sentence.id),
  audioPath: text("audio_path"),
  sttTranscript: text("stt_transcript"),
  sttConfidence: real("stt_confidence"),
  characterMatch: real("character_match"), // 0..1, character-level similarity
  prosodyFeedback: text("prosody_feedback"), // free-text from Gemini
  score: integer("score"), // 0-100
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
})

// === Listen-write attempts (Stage 3) ===
export const listenWriteAttempt = sqliteTable("listen_write_attempt", {
  id: text("id").primaryKey(),
  sentenceId: text("sentence_id").notNull().references(() => sentence.id),
  userInput: text("user_input").notNull(),
  characterMatch: real("character_match"),
  score: integer("score"),
  replays: integer("replays").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
})

// === Quick-Fire attempts (Stage 4, 5-sec CN→JP speaking) ===
export const quickFireAttempt = sqliteTable("quick_fire_attempt", {
  id: text("id").primaryKey(),
  sentenceId: text("sentence_id").notNull().references(() => sentence.id),
  audioPath: text("audio_path"),
  sttTranscript: text("stt_transcript"),
  spokenWithinSec: real("spoken_within_sec"), // when did they start talking?
  fluencyScore: integer("fluency_score"), // 0-100
  accuracyScore: integer("accuracy_score"), // 0-100
  totalScore: integer("total_score"), // weighted: 0.6*fluency + 0.4*accuracy (first 4 weeks)
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
})

// === Talk sessions (Stage 5) ===
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
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
  endedAt: integer("ended_at", { mode: "timestamp" }),
})

// === User progress (per-sentence stage state + SM-2 per stage) ===
export type Sm2PerStage = {
  easeFactor: number
  intervalDays: number
  repetitions: number
  nextReviewAt: number // unix seconds
}

// Stage encoding: 1=read, 2=write, 25=read-aloud, 3=listen-write, 4=quick-fire, 5=in-the-wild
export type StageKey = "s2" | "s25" | "s3" | "s4"

export const userProgress = sqliteTable("user_progress", {
  sentenceId: text("sentence_id").primaryKey().references(() => sentence.id),
  currentStage: integer("current_stage").notNull().default(1), // 1, 2, 25, 3, 4, 5
  stageHistory: text("stage_history", { mode: "json" })
    .$type<Array<{ stage: number; passedAt: number; score: number }>>()
    .default([]),
  sm2: text("sm2", { mode: "json" }).$type<Partial<Record<StageKey, Sm2PerStage>>>().default({}),
  lastReviewAt: integer("last_review_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(now),
})

export type UserProgress = typeof userProgress.$inferSelect

// === Settings ===
export const setting = sqliteTable("setting", {
  key: text("key").primaryKey(),
  value: text("value", { mode: "json" }).notNull(),
})
