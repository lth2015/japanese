/**
 * Seed the SQLite db from the curated content files under `seed/data/`.
 *
 * IDs are derived deterministically from content, so re-running this script is
 * a true upsert: existing rows get updated in place, new rows get inserted.
 * No need to wipe the database.
 *
 * Run: pnpm db:seed
 */

import { createHash } from "node:crypto"
import { sql } from "drizzle-orm"
import { db, schema } from "../lib/db/client"
import { businessSentences } from "../seed/data/business"
import { dailySentences } from "../seed/data/daily"
import { dialogues } from "../seed/data/dialogues"
import { grammarSentences } from "../seed/data/grammar"
import { passages } from "../seed/data/passages"
import type { SeedDialogue, SeedPassage, SeedSentence } from "../seed/data/types"

// Stable IDs: same content → same id, so re-seed never duplicates.
function stableId(prefix: string, key: string): string {
  return `${prefix}_${createHash("sha256").update(key).digest("base64url").slice(0, 12)}`
}

const sentenceId = (s: SeedSentence) => stableId("s", `${s.category}::${s.japanese}`)
const dialogueId = (d: SeedDialogue) => stableId("d", `${d.scenario}::${d.title}`)
const passageId = (p: SeedPassage) => stableId("p", `${p.source}::${p.title}`)

function upsertSentence(s: SeedSentence) {
  const id = sentenceId(s)
  const row = {
    id,
    japanese: s.japanese,
    tokens: s.tokens ?? null,
    kana: s.kana ?? null,
    chinese: s.chinese,
    category: s.category,
    register: s.register ?? null,
    chunkPattern: s.chunkPattern ?? null,
    difficulty: s.difficulty,
    frequencyRank: s.frequencyRank ?? null,
    moraCount: s.kana ? Array.from(s.kana.replace(/[\s、。]/g, "")).length : null,
    source: "preset" as const,
    tags: s.tags ?? [],
  }
  db.insert(schema.sentence)
    .values(row)
    .onConflictDoUpdate({
      target: schema.sentence.id,
      set: {
        japanese: row.japanese,
        tokens: row.tokens,
        kana: row.kana,
        chinese: row.chinese,
        category: row.category,
        register: row.register,
        chunkPattern: row.chunkPattern,
        difficulty: row.difficulty,
        frequencyRank: row.frequencyRank,
        moraCount: row.moraCount,
        tags: row.tags,
      },
    })
    .run()
}

function upsertDialogue(d: SeedDialogue) {
  const id = dialogueId(d)
  const row = {
    id,
    title: d.title,
    scenario: d.scenario,
    description: d.description ?? null,
    difficulty: d.difficulty,
    register: d.register ?? null,
    turns: d.turns,
    tags: d.tags ?? [],
    source: "preset" as const,
  }
  db.insert(schema.dialogue)
    .values(row)
    .onConflictDoUpdate({
      target: schema.dialogue.id,
      set: {
        title: row.title,
        scenario: row.scenario,
        description: row.description,
        difficulty: row.difficulty,
        register: row.register,
        turns: row.turns,
        tags: row.tags,
      },
    })
    .run()
}

function upsertPassage(p: SeedPassage) {
  const id = passageId(p)
  const row = {
    id,
    title: p.title,
    source: p.source,
    description: p.description ?? null,
    body: p.body,
    tokens: p.tokens ?? null,
    vocabulary: p.vocabulary ?? [],
    questions: p.questions ?? [],
    difficulty: p.difficulty,
    lengthWords: p.lengthWords ?? null,
    tags: p.tags ?? [],
    contentSource: "preset" as const,
  }
  db.insert(schema.passage)
    .values(row)
    .onConflictDoUpdate({
      target: schema.passage.id,
      set: {
        title: row.title,
        source: row.source,
        description: row.description,
        body: row.body,
        tokens: row.tokens,
        vocabulary: row.vocabulary,
        questions: row.questions,
        difficulty: row.difficulty,
        lengthWords: row.lengthWords,
        tags: row.tags,
      },
    })
    .run()
}

async function main() {
  const allSentences: SeedSentence[] = [
    ...businessSentences,
    ...dailySentences,
    ...grammarSentences,
  ]

  console.log(`Seeding ${allSentences.length} sentences...`)
  for (const s of allSentences) upsertSentence(s)

  console.log(`Seeding ${dialogues.length} dialogues...`)
  for (const d of dialogues) upsertDialogue(d)

  console.log(`Seeding ${passages.length} passages...`)
  for (const p of passages) upsertPassage(p)

  // Final counts
  const [{ sCount }] = db
    .select({ sCount: sql<number>`count(*)` })
    .from(schema.sentence)
    .all()
  const [{ dCount }] = db
    .select({ dCount: sql<number>`count(*)` })
    .from(schema.dialogue)
    .all()
  const [{ pCount }] = db
    .select({ pCount: sql<number>`count(*)` })
    .from(schema.passage)
    .all()

  console.log(`\n✓ Done. DB now has:`)
  console.log(`  sentences: ${sCount}`)
  console.log(`  dialogues: ${dCount}`)
  console.log(`  passages:  ${pCount}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
