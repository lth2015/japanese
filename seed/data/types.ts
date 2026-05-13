/**
 * Seed input types. Distinct from DB types because seed sources don't
 * carry id/timestamps — those are derived deterministically at insert time.
 */
import type {
  DialogueTurn,
  PassageQuestion,
  PassageVocab,
  Register,
  SentenceCategory,
  Token,
} from "@/lib/db/schema"

export type SeedSentence = {
  japanese: string
  tokens?: Token[]
  kana?: string
  chinese: string
  category: SentenceCategory
  register?: Register
  difficulty: 1 | 2 | 3 | 4 | 5
  frequencyRank?: number
  chunkPattern?: string
  tags?: string[]
}

export type SeedDialogue = {
  title: string
  scenario: "1on1" | "meeting" | "slack" | "email" | "phone"
  description?: string
  difficulty: 1 | 2 | 3 | 4 | 5
  register?: Register
  turns: DialogueTurn[]
  tags?: string[]
}

export type SeedPassage = {
  title: string
  source: "email" | "slack" | "meeting-minutes" | "report" | "news"
  description?: string
  body: string
  tokens?: Token[]
  vocabulary?: PassageVocab[]
  questions?: PassageQuestion[]
  difficulty: 1 | 2 | 3 | 4 | 5
  lengthWords?: number
  tags?: string[]
}
