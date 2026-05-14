/**
 * Import AI-generated corpus packs from JSON files.
 *
 * Default:
 *   pnpm corpus:import
 *
 * Specific files:
 *   pnpm corpus:import corpus/packs/meeting-risk.json
 *
 * Dry run:
 *   pnpm corpus:import --dry-run
 */

import { createHash } from "node:crypto"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { z } from "zod"
import { db, schema } from "../lib/db/client"

const categories = [
  "rescue",
  "progress",
  "request",
  "apology",
  "smalltalk",
  "daily",
  "grammar",
  "custom",
] as const

const registers = ["敬語", "丁寧", "カジュアル"] as const
const scenarios = ["1on1", "meeting", "slack", "email", "phone"] as const
const passageSources = ["email", "slack", "meeting-minutes", "report", "news"] as const

const tokenSchema = z.object({
  text: z.string().min(1),
  kana: z.string().min(1).optional(),
})

const sentenceSchema = z.object({
  externalId: z.string().min(1).optional(),
  japanese: z.string().min(1),
  tokens: z.array(tokenSchema).min(1),
  kana: z.string().min(1).optional(),
  chinese: z.string().min(1),
  category: z.enum(categories),
  register: z.enum(registers).optional(),
  difficulty: z.number().int().min(1).max(5),
  frequencyRank: z.number().int().min(1).max(1000).optional(),
  chunkPattern: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).default([]),
})

const dialogueTurnSchema = z.object({
  speaker: z.string().min(1),
  japanese: z.string().min(1),
  tokens: z.array(tokenSchema).optional(),
  kana: z.string().min(1).optional(),
  chinese: z.string().min(1),
})

const dialogueSchema = z.object({
  externalId: z.string().min(1).optional(),
  title: z.string().min(1),
  scenario: z.enum(scenarios),
  description: z.string().optional(),
  difficulty: z.number().int().min(1).max(5),
  register: z.enum(registers).optional(),
  turns: z.array(dialogueTurnSchema).min(2),
  tags: z.array(z.string().min(1)).default([]),
})

const passageSchema = z.object({
  externalId: z.string().min(1).optional(),
  title: z.string().min(1),
  source: z.enum(passageSources),
  description: z.string().optional(),
  body: z.string().min(1),
  tokens: z.array(tokenSchema).optional(),
  vocabulary: z
    .array(
      z.object({
        word: z.string().min(1),
        kana: z.string().min(1).optional(),
        meaning: z.string().min(1),
      }),
    )
    .default([]),
  questions: z
    .array(
      z.object({
        q: z.string().min(1),
        a: z.string().min(1),
        type: z.enum(["fact", "open", "summary", "rewrite"]),
      }),
    )
    .default([]),
  difficulty: z.number().int().min(1).max(5),
  lengthWords: z.number().int().min(1).optional(),
  tags: z.array(z.string().min(1)).default([]),
})

const packSchema = z.object({
  packVersion: z.literal(1),
  packId: z.string().min(3),
  title: z.string().min(1),
  generatedBy: z.string().min(1),
  generatedAt: z.string().min(1),
  targetProfile: z.string().min(1),
  reviewStatus: z.enum(["draft", "reviewed"]).default("draft"),
  sentences: z.array(sentenceSchema).default([]),
  dialogues: z.array(dialogueSchema).default([]),
  passages: z.array(passageSchema).default([]),
})

type CorpusPack = z.infer<typeof packSchema>
type CorpusSentence = z.infer<typeof sentenceSchema>
type CorpusDialogue = z.infer<typeof dialogueSchema>
type CorpusPassage = z.infer<typeof passageSchema>

const dryRun = process.argv.includes("--dry-run")
const explicitFiles = process.argv.slice(2).filter((arg) => !arg.startsWith("--"))
const files = explicitFiles.length > 0 ? explicitFiles : defaultPackFiles()

if (files.length === 0) {
  console.log("No corpus packs found in corpus/packs/.")
  process.exit(0)
}

let imported = { sentences: 0, dialogues: 0, passages: 0 }

for (const file of files) {
  const raw = JSON.parse(readFileSync(file, "utf8"))
  const pack = packSchema.parse(raw)
  const warnings = lintPack(pack)

  console.log(`\n${dryRun ? "Checking" : "Importing"} ${file}`)
  console.log(`  pack: ${pack.title} (${pack.packId})`)
  if (pack.reviewStatus !== "reviewed") {
    console.log("  warning: reviewStatus is not reviewed")
  }
  for (const warning of warnings) console.log(`  warning: ${warning}`)

  if (!dryRun) {
    for (const s of pack.sentences) upsertSentence(pack, s)
    for (const d of pack.dialogues) upsertDialogue(pack, d)
    for (const p of pack.passages) upsertPassage(pack, p)
  }

  imported = {
    sentences: imported.sentences + pack.sentences.length,
    dialogues: imported.dialogues + pack.dialogues.length,
    passages: imported.passages + pack.passages.length,
  }
}

console.log(`\n${dryRun ? "Dry run complete" : "Import complete"}.`)
console.log(`  sentences: ${imported.sentences}`)
console.log(`  dialogues: ${imported.dialogues}`)
console.log(`  passages:  ${imported.passages}`)

function defaultPackFiles() {
  const dir = join(process.cwd(), "corpus", "packs")
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => join(dir, file))
}

function stableId(prefix: string, key: string) {
  return `${prefix}_${createHash("sha256").update(key).digest("base64url").slice(0, 12)}`
}

function itemId(prefix: string, pack: CorpusPack, externalId: string | undefined, key: string) {
  return stableId(prefix, `${pack.packId}::${externalId ?? key}`)
}

function withPackTag(tags: string[], pack: CorpusPack) {
  return Array.from(new Set([...tags, `pack:${pack.packId}`, "ai-generated"]))
}

function moraCount(kana?: string) {
  if (!kana) return null
  return Array.from(kana.replace(/[\s、。！？,.!?]/g, "")).length
}

function upsertSentence(pack: CorpusPack, s: CorpusSentence) {
  const row = {
    id: itemId("s", pack, s.externalId, s.japanese),
    japanese: s.japanese,
    tokens: s.tokens,
    kana: s.kana ?? null,
    chinese: s.chinese,
    category: s.category,
    register: s.register ?? null,
    chunkPattern: s.chunkPattern ?? null,
    difficulty: s.difficulty,
    frequencyRank: s.frequencyRank ?? null,
    moraCount: moraCount(s.kana),
    source: "ai-generated-accepted" as const,
    tags: withPackTag(s.tags, pack),
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
        source: row.source,
        tags: row.tags,
      },
    })
    .run()
}

function upsertDialogue(pack: CorpusPack, d: CorpusDialogue) {
  const row = {
    id: itemId("d", pack, d.externalId, d.title),
    title: d.title,
    scenario: d.scenario,
    description: d.description ?? null,
    difficulty: d.difficulty,
    register: d.register ?? null,
    turns: d.turns,
    tags: withPackTag(d.tags, pack),
    source: "ai-generated-accepted" as const,
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
        source: row.source,
      },
    })
    .run()
}

function upsertPassage(pack: CorpusPack, p: CorpusPassage) {
  const row = {
    id: itemId("p", pack, p.externalId, p.title),
    title: p.title,
    source: p.source,
    description: p.description ?? null,
    body: p.body,
    tokens: p.tokens ?? null,
    vocabulary: p.vocabulary,
    questions: p.questions,
    difficulty: p.difficulty,
    lengthWords: p.lengthWords ?? null,
    tags: withPackTag(p.tags, pack),
    contentSource: "ai-generated-accepted" as const,
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
        contentSource: row.contentSource,
      },
    })
    .run()
}

function lintPack(pack: CorpusPack) {
  const warnings: string[] = []
  const japanese = new Set<string>()

  for (const sentence of pack.sentences) {
    if (japanese.has(sentence.japanese)) {
      warnings.push(`duplicate sentence: ${sentence.japanese}`)
    }
    japanese.add(sentence.japanese)

    const tokenText = sentence.tokens.map((token) => token.text).join("")
    if (tokenText !== sentence.japanese) {
      warnings.push(`tokens do not concatenate to sentence: ${sentence.japanese}`)
    }
  }

  for (const dialogue of pack.dialogues) {
    for (const turn of dialogue.turns) {
      if (!turn.tokens?.length && !turn.kana) {
        warnings.push(`dialogue turn lacks tokens/kana: ${dialogue.title} / ${turn.speaker}`)
      }
    }
  }

  for (const passage of pack.passages) {
    if (passage.questions.length === 0) {
      warnings.push(`passage has no questions: ${passage.title}`)
    }
  }

  return warnings
}
