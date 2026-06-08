import type { ConjugationType, Scene, VerbCard, VerbEntry, VerbGroup } from "./types"

export function flattenVerbCards(corpus: VerbEntry[]): VerbCard[] {
  const cards: VerbCard[] = []
  for (const verb of corpus) {
    for (const conj of verb.conjugations) {
      for (let i = 0; i < conj.examples.length; i++) {
        cards.push({
          cardId: `${verb.id}-${conj.conjugationType}-${i}`,
          verbId: verb.id,
          dictionaryForm: verb.dictionaryForm,
          verbGroup: verb.verbGroup,
          meaningZh: verb.meaningZh,
          conjugationType: conj.conjugationType,
          conjugatedForm: conj.conjugatedForm,
          explanationZh: conj.explanationZh,
          patternHint: conj.patternHint,
          example: conj.examples[i],
          exampleIndex: i,
          totalExamples: conj.examples.length,
        })
      }
    }
  }
  return cards
}

export type VerbFilters = {
  conjugationType: ConjugationType | "all"
  scene: Scene | "all"
  verbGroup: VerbGroup | "all"
}

export function filterVerbCards(cards: VerbCard[], filters: VerbFilters): VerbCard[] {
  return cards.filter((card) => {
    if (filters.conjugationType !== "all" && card.conjugationType !== filters.conjugationType)
      return false
    if (filters.scene !== "all" && card.example.scene !== filters.scene) return false
    if (filters.verbGroup !== "all" && card.verbGroup !== filters.verbGroup) return false
    return true
  })
}

export function getConjugationLabel(t: ConjugationType): string {
  switch (t) {
    case "passive":
      return "受身形"
    case "causative":
      return "使役形"
    case "causativePassive":
      return "使役受身形"
    case "potential":
      return "可能形"
    case "negative":
      return "否定形"
    case "polite":
      return "丁寧形"
    case "te":
      return "て形"
    case "ta":
      return "た形"
  }
}

export function getSceneLabel(s: Scene): string {
  switch (s) {
    case "work":
      return "職場"
    case "life":
      return "日常"
  }
}

// 中文教材常用的「一/二/三类动词」命名（对应日语的 五段 / 一段 / 不規則）。
export function getVerbGroupLabel(g: VerbGroup): string {
  switch (g) {
    case "group1":
      return "一类动词"
    case "group2":
      return "二类动词"
    case "group3":
      return "三类动词"
  }
}
