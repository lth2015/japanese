import type { Token } from "@/lib/db/schema"

export type VerbGroup = "godan" | "ichidan" | "irregular"
export type ConjugationType =
  | "passive"
  | "causative"
  | "causativePassive"
  | "potential"
  | "negative"
  | "polite"
  | "te"
  | "ta"
export type Scene = "work" | "life"
export type Register = "敬語" | "丁寧" | "カジュアル"

export type VerbExample = {
  japanese: string
  tokens: Token[]
  kana: string
  chinese: string
  scene: Scene
  register: Register
}

export type VerbConjugation = {
  conjugationType: ConjugationType
  conjugatedForm: string
  explanationZh: string
  patternHint: string
  examples: VerbExample[]
}

export type VerbEntry = {
  id: string
  dictionaryForm: string
  verbGroup: VerbGroup
  meaningZh: string
  conjugations: VerbConjugation[]
}

/** Flattened unit: one example from one conjugation of one verb. This is what
 *  the display queue operates on after flattenVerbCards(). */
export type VerbCard = {
  cardId: string
  verbId: string
  dictionaryForm: string
  verbGroup: VerbGroup
  meaningZh: string
  conjugationType: ConjugationType
  conjugatedForm: string
  explanationZh: string
  patternHint: string
  example: VerbExample
  exampleIndex: number
  totalExamples: number
}
